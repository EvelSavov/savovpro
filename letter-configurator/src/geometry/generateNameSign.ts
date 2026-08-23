import { findBridgeContours, letterToContours, textToContours } from './fontToPolygons';
import { loadManifold } from '../manifold/loadManifold';
import { manifoldMeshToData, meshBounds, meshVolumeMm3 } from './meshUtils';
import { loadStlMesh } from './loadStlMesh';
import type { Contour, MeshData, NameSignParams, NameSignResult } from '../types/geometry';

/**
 * Generate a solid name sign: letter body with a name-shaped inlay cavity,
 * plus the name piece that fits inside. Units: 1 = 1 mm.
 *
 * Geometry:
 *   Z = 0          → back face (base)
 *   Z = depth      → front face (visible side, faces viewer)
 *   cavity goes from Z = (depth − inlayDepth) to Z = depth
 */
export async function generateNameSign(
  params: NameSignParams,
): Promise<NameSignResult> {
  const {
    letter,
    name,
    letterFontUrl,
    nameFontUrl,
    letterHeight,
    nameHeight,
    depth,
    inlayDepth,
    tolerance,
    nameX,
    nameY,
    raisedInlay,
    autoConnect,
    bridgeThickness,
    minContactArea,
    curveSegments,
  } = params;

  if (inlayDepth >= depth) throw new Error('Inlay depth трябва да е по-малък от Depth.');
  if (tolerance < 0)       throw new Error('Tolerance не може да е отрицателен.');

  const warnings: string[] = [];
  const wasm = await loadManifold();
  const { CrossSection } = wasm;

  // ── Letter CrossSection ──────────────────────────────────────────────────────
  const letterContours = await letterToContours(
    letter, letterHeight, letterFontUrl, curveSegments,
  );
  let letterCs = new CrossSection(letterContours, 'EvenOdd');
  letterCs = letterCs.simplify(0.05);

  if (letterCs.isEmpty()) {
    letterCs.delete();
    throw new Error('Празен контур за буквата. Опитайте друг шрифт.');
  }

  const letterBounds = letterCs.bounds();
  const letterWidth  = letterBounds.max[0] - letterBounds.min[0];

  let letterBody = letterCs.extrude(depth);

  // ── Collect inlay contours (text + symbol groups) ─────────────────────────
  let nameMesh: MeshData | null = null;
  let nameCm3 = 0;
  let nameTris = 0;

  const nameText     = (name ?? '').trim();
  const symbolGroups = params.symbolGroups ?? [];
  const hasText      = nameText.length > 0;

  // Separate 3D model groups (STL files) from 2D inlay groups
  const model3dGroups = symbolGroups.filter(g => !!g.modelUrl);
  const inlay2dGroups = symbolGroups.filter(g => !g.modelUrl);
  const hasSymbols    = inlay2dGroups.length > 0;

  if (hasText || hasSymbols) {
    // ── Text contours ──────────────────────────────────────────────────────
    let textContourList: Contour[] = [];

    if (hasText) {
      const nameResult = await textToContours(nameText, {
        height: nameHeight,
        fontUrl: nameFontUrl,
        // Smaller script glyphs need denser curves than the big letter.
        curveSegments: Math.min(128, Math.max(curveSegments * 2, 64)),
        maxWidth: letterWidth * 1.05,
        offsetX: nameX,
        offsetY: nameY,
      });
      textContourList = nameResult.contours;

      if (nameResult.width > letterWidth * 0.92) {
        warnings.push(
          `Текстът (${nameResult.width.toFixed(1)} mm) е по-широк от буквата (${letterWidth.toFixed(1)} mm).`,
        );
      }
    }

    // ── Per-symbol out-of-bounds check (real CrossSection intersection) ────
    const allSymbolContours: Contour[] = [];

    for (const group of inlay2dGroups) {
      allSymbolContours.push(...group.contours);

      const symCs = new CrossSection(group.contours, 'NonZero');
      if (!symCs.isEmpty()) {
        const symBounds = symCs.bounds();
        const symW = symBounds.max[0] - symBounds.min[0];
        const symH = symBounds.max[1] - symBounds.min[1];
        const symArea = symW * symH;

        const intersectionCs = letterCs.intersect(symCs);
        if (intersectionCs.isEmpty()) {
          warnings.push(
            `⚠ ${group.label} е изцяло извън буквата! Преместете го с X/Y Offset.`,
          );
        } else {
          const ib = intersectionCs.bounds();
          const intArea = (ib.max[0] - ib.min[0]) * (ib.max[1] - ib.min[1]);
          if (symArea > 0 && intArea / symArea < 0.4) {
            warnings.push(
              `⚠ ${group.label} е предимно извън буквата. Поне 40% трябва да е върху нея.`,
            );
          }
        }
        intersectionCs.delete();
      }
      symCs.delete();
    }

    // ── Combine via union — each part gets its own CrossSection so CW hole
    //    contours in one symbol never cancel CCW regions of another symbol.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const csParts: any[] = [];
    if (textContourList.length) csParts.push(new CrossSection(textContourList, 'NonZero'));
    for (const group of inlay2dGroups) {
      if (group.contours.length) csParts.push(new CrossSection(group.contours, 'NonZero'));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let combined: any = csParts.length ? csParts[0] : null;
    for (let pi = 1; pi < csParts.length; pi++) {
      const next = combined.add(csParts[pi]);
      combined.delete(); csParts[pi].delete();
      combined = next;
    }

    if (combined) {
      if (autoConnect && hasText) {
        // A glyph touching the letter is held by its own pocket, so it needs no
        // bar to its neighbours. Only glyphs floating over the letter's counter
        // (or off the letter entirely) get bridged.
        const minContact = Math.max(0, minContactArea);
        const restsOnLetter = (contour: Contour): boolean => {
          const cs = new CrossSection([contour], 'NonZero');
          if (cs.isEmpty()) { cs.delete(); return false; }
          const overlap = letterCs.intersect(cs);
          const shared = overlap.isEmpty() ? 0 : Math.abs(overlap.area());
          overlap.delete();
          cs.delete();
          return shared > 1e-6 && shared >= minContact;
        };

        const bridgeRects = findBridgeContours(
          textContourList, bridgeThickness, restsOnLetter,
        );
        for (const rect of bridgeRects) {
          const bCs = new CrossSection([rect], 'EvenOdd');
          const next = combined.add(bCs);
          combined.delete(); bCs.delete(); combined = next;
        }
      }

      const nameSimplify = 0.012;
      let rawNameCs = combined.simplify(nameSimplify);
      combined.delete();

      let cavityCs = rawNameCs.simplify(nameSimplify);
      rawNameCs.delete();

      if (!cavityCs.isEmpty()) {
        const cavityManifold = cavityCs.extrude(inlayDepth).translate([0, 0, depth - inlayDepth]);
        letterBody = letterBody.subtract(cavityManifold);
        cavityManifold.delete();

        let nameCs = tolerance > 0.01
          ? cavityCs.offset(-tolerance, 'Round').simplify(nameSimplify)
          : cavityCs.simplify(nameSimplify);
        cavityCs.delete();

        if (!nameCs.isEmpty()) {
          // Base inlay piece — flat top (fits inside letter cavity + raised portion)
          let nameManifold = nameCs
            .extrude(inlayDepth + raisedInlay)
            .translate([0, 0, depth - inlayDepth]);

          // If there are symbols and a meaningful raised height, replace the flat
          // raised cap of each symbol with a tapered dome (scaleTop → 5% of base).
          // Text retains its flat top so it stays readable; only symbols get the
          // 3D sculptured look.
          if (hasSymbols && raisedInlay > 0.5 && allSymbolContours.length > 0) {
            const rawSym = new CrossSection(allSymbolContours, 'NonZero');
            const symFitCs = tolerance > 0.01
              ? rawSym.offset(-tolerance, 'Round').simplify(nameSimplify)
              : rawSym.simplify(nameSimplify);
            rawSym.delete();

            if (!symFitCs.isEmpty()) {
              // Flat raised cap (to subtract)
              const flatCap = symFitCs.extrude(raisedInlay).translate([0, 0, depth]);
              // Tapered dome cap (to add): converges to ~5% of footprint at the tip
              const domeCap = symFitCs.extrude(raisedInlay, 0, 0, 0.05).translate([0, 0, depth]);
              const withDome = nameManifold.subtract(flatCap).add(domeCap);
              nameManifold.delete(); flatCap.delete(); domeCap.delete();
              nameManifold = withDome;
            }
            symFitCs.delete();
          }

          nameCs.delete();

          const native = nameManifold.getMesh();
          nameMesh = manifoldMeshToData(native);
          nameCm3  = +(meshVolumeMm3(nameMesh) / 1000).toFixed(1);
          nameTris = nameMesh.indices.length / 3;
          nameManifold.delete();
        } else {
          nameCs.delete();
          warnings.push('Надписът/символите са твърде малки след tolerance. Намалете tolerance или увеличете размера.');
        }
      } else {
        cavityCs.delete();
        warnings.push('Няма контури за надписа/символите. Опитайте друг шрифт или текст.');
      }
    } // end if (combined)
  } // end if (hasText || hasSymbols)

  letterCs.delete();

  const letterMeshNative = letterBody.getMesh();
  const letterMesh = manifoldMeshToData(letterMeshNative);
  const letterTris = letterMesh.indices.length / 3;
  letterBody.delete();

  const bb = meshBounds(letterMesh);
  const letterCenterX = (bb.min[0] + bb.max[0]) / 2;

  // ── Load 3D model groups (STL files) ─────────────────────────────────────
  const models3d: Array<{ label: string; mesh: MeshData }> = [];
  for (const group of model3dGroups) {
    if (!group.modelUrl) continue;
    try {
      const mesh = await loadStlMesh(
        group.modelUrl,
        group.modelSizeMm ?? 30,
        letterCenterX + (group.modelX ?? 0),
        (group.modelY ?? 0),
        depth,  // sit on the letter front face
      );
      models3d.push({ label: group.label, mesh });
    } catch (e) {
      warnings.push(`⚠ Не може да се зареди 3D модел за ${group.label}: ${e}`);
    }
  }

  return {
    letter: letterMesh,
    name: nameMesh,
    models3d,
    dimensions: {
      x: +(bb.max[0] - bb.min[0]).toFixed(2),
      y: +(bb.max[1] - bb.min[1]).toFixed(2),
      z: +(bb.max[2] - bb.min[2]).toFixed(2),
    },
    volumes: {
      letterCm3: +(meshVolumeMm3(letterMesh) / 1000).toFixed(1),
      nameCm3,
    },
    triangles: { letter: letterTris, name: nameTris },
    warnings,
  };
}

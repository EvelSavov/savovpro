import { useCallback, useEffect, useRef, useState } from 'react';

interface SymInstance {
  uid: number;
  id: string;
  size: number;
  x: number;
  y: number;
}
import { generateNameSign } from './geometry/generateNameSign';
import {
  downloadCombinedSTL,
  downloadSeparateZIP,
  downloadSTL,
  meshToBinarySTL,
} from './export/exportSTL';
import { Viewer3D } from './components/Viewer3D';
import { SYMBOLS } from './geometry/symbols';
import { SYMBOL_PRESETS } from './geometry/symbolPresets';
import type { NameSignResult, SymbolGroup } from './types/geometry';
import './App.css';

const BASE = import.meta.env.BASE_URL;

const FONTS = {
  pacifico:    { label: 'Pacifico',        url: `${BASE}fonts/Pacifico-Regular.ttf`      },
  lobster:     { label: 'Lobster',         url: `${BASE}fonts/Lobster-Regular.woff`      },
  dancing:     { label: 'Dancing Script',  url: `${BASE}fonts/DancingScript-Bold.woff`   },
  playfair:    { label: 'Playfair Display',url: `${BASE}fonts/PlayfairDisplay-Bold.woff` },
  crimsonPro:  { label: 'Crimson Pro',     url: `${BASE}fonts/CrimsonPro-Bold.woff`      },
  montserrat:  { label: 'Montserrat',      url: `${BASE}fonts/Montserrat-Bold.ttf`       },
  poppins:     { label: 'Poppins',         url: `${BASE}fonts/Poppins-Bold.woff`         },
  oswald:      { label: 'Oswald',          url: `${BASE}fonts/Oswald-Bold.woff`          },
} as const;
type FontKey = keyof typeof FONTS;

type StylePreset = 'classic' | 'modern' | 'elegant' | 'playful' | 'bold';
type PrintQuality = 'draft' | 'standard' | 'high' | 'ultra';

const QUALITY_SEGS: Record<PrintQuality, number> = {
  draft: 8, standard: 24, high: 48, ultra: 96,
};

interface Preset {
  label: string;
  letterFont: FontKey;
  nameFont: FontKey;
  depth: number;
  inlayDepth: number;
}
const STYLE_PRESETS: Record<StylePreset, Preset> = {
  classic:  { label: 'Classic',  letterFont: 'lobster',    nameFont: 'dancing',    depth: 8,  inlayDepth: 1.5 },
  modern:   { label: 'Modern',   letterFont: 'montserrat', nameFont: 'poppins',    depth: 6,  inlayDepth: 1.2 },
  elegant:  { label: 'Elegant',  letterFont: 'playfair',   nameFont: 'crimsonPro', depth: 10, inlayDepth: 2.0 },
  playful:  { label: 'Playful',  letterFont: 'pacifico',   nameFont: 'dancing',    depth: 8,  inlayDepth: 1.5 },
  bold:     { label: 'Bold',     letterFont: 'oswald',     nameFont: 'montserrat', depth: 12, inlayDepth: 2.5 },
};

type UiMode = 'basic' | 'advanced';
type MobileTab = 'design' | 'edit' | 'order';

export default function App() {
  // Easy / Advanced — Easy = text only (no symbols)
  const [uiMode, setUiMode] = useState<UiMode>('basic');
  // Phone tabs — same shell as sticker/engrave configurators
  const [mobileTab, setMobileTab] = useState<MobileTab>('design');

  // Text
  const [letter, setLetter]   = useState('D');
  const [name, setName]       = useState('Dalia');

  // Style preset
  const [preset, setPreset]   = useState<StylePreset>('classic');

  // Fonts — match Classic preset defaults (Lobster letter, Dancing Script name)
  const [letterFont, setLetterFont] = useState<FontKey>('lobster');
  const [nameFont,   setNameFont]   = useState<FontKey>('dancing');

  // Dimensions
  const [letterHeight, setLetterHeight] = useState(100);
  const [nameHeight,   setNameHeight]   = useState(22);
  const [depth,        setDepth]        = useState(8);
  const [inlayDepth,   setInlayDepth]   = useState(1.5);
  const [tolerance,    setTolerance]    = useState(0.15);

  // Quality
  const [quality, setQuality] = useState<PrintQuality>('high');

  // Auto-connect
  const [autoConnect,     setAutoConnect]     = useState(true);
  const [bridgeThickness, setBridgeThickness] = useState(0.7);

  // Raised inlay
  const [raisedInlay, setRaisedInlay] = useState(0.3);

  // Name position — Y=-8 shifts name below the letter's counter into the solid area
  const [nameX, setNameX] = useState(0);
  const [nameY, setNameY] = useState(-8);

  // Multi-symbol instances — each independently positioned
  const [symInstances, setSymInstances] = useState<SymInstance[]>([]);
  const nextSymUid = useRef(0);

  // Preview colors
  const [letterColor, setLetterColor] = useState('#2a2a2e');
  const [nameColor,   setNameColor]   = useState('#f472b6');

  // State
  const [result, setResult] = useState<NameSignResult | null>(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const genId = useRef(0);

  const generate = useCallback(async () => {
    const id = ++genId.current;
    setBusy(true);
    setError(null);
    try {
      // Build one SymbolGroup per instance
      const symbolGroups: SymbolGroup[] = symInstances.flatMap((inst) => {
        const def = SYMBOLS.find((s) => s.id === inst.id);
        if (!def) return [];

        // 3D model symbol — pass modelUrl, skip 2D contour generation
        if (def.modelPath) {
          return [{
            label: `${def.emoji} ${def.labelBg}`,
            contours: [],
            modelUrl: import.meta.env.BASE_URL + def.modelPath,
            modelSizeMm: inst.size,
            modelX: inst.x,
            modelY: inst.y,
          }];
        }

        const raw = def.generate(inst.size);
        const contours = raw.map((c) =>
          c.map(([x, y]): [number, number] => [x + inst.x, y + inst.y]),
        );
        return [{ label: `${def.emoji} ${def.labelBg}`, contours }];
      });

      const out = await generateNameSign({
        letter,
        name,
        letterFontUrl: FONTS[letterFont].url,
        nameFontUrl:   FONTS[nameFont].url,
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
        curveSegments: QUALITY_SEGS[quality],
        symbolGroups,
      });
      if (id !== genId.current) return;
      setResult(out);
    } catch (e) {
      if (id !== genId.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setResult(null);
    } finally {
      if (id === genId.current) setBusy(false);
    }
  }, [
    letter, name, letterFont, nameFont,
    letterHeight, nameHeight, depth, inlayDepth, tolerance,
    nameX, nameY, raisedInlay, autoConnect, bridgeThickness, quality,
    symInstances,
  ]);

  // Debounced live update
  useEffect(() => {
    const t = window.setTimeout(() => void generate(), 300);
    return () => window.clearTimeout(t);
  }, [generate]);

  // Apply style preset
  const applyPreset = (p: StylePreset) => {
    setPreset(p);
    const v = STYLE_PRESETS[p];
    setLetterFont(v.letterFont);
    setNameFont(v.nameFont);
    setDepth(v.depth);
    setInlayDepth(v.inlayDepth);
  };

  // Apply symbol preset — positions scaled to current letterHeight
  const applySymbolPreset = (presetId: string) => {
    const p = SYMBOL_PRESETS.find((sp) => sp.id === presetId);
    if (!p) return;
    const instances = p.symbols.map((s) => ({
      uid: nextSymUid.current++,
      id: s.id,
      size: Math.round(letterHeight * s.sizeFrac),
      x: Math.round(letterHeight * s.xFrac),
      y: Math.round(letterHeight * s.yFrac),
    }));
    setSymInstances(instances);
  };

  const stem = `${(letter || 'D').slice(0, 1)}_${(name || 'name').replace(/\s+/g, '')}`;

  const totalTris = (result?.triangles.letter ?? 0) + (result?.triangles.name ?? 0);
  const totalVol  = (result?.volumes.letterCm3 ?? 0) + (result?.volumes.nameCm3 ?? 0);

  const setMode = (mode: UiMode) => {
    setUiMode(mode);
    if (mode === 'basic') setSymInstances([]);
  };

  const resetAll = () => {
    setLetter('D');
    setName('Dalia');
    setPreset('classic');
    applyPreset('classic');
    setSymInstances([]);
    setNameX(0);
    setNameY(-8);
    setLetterColor('#2a2a2e');
    setNameColor('#f472b6');
    setAutoConnect(true);
    setQuality('high');
  };

  const isBasic = uiMode === 'basic';

  const downloadStl = () => {
    if (!result) return;
    if (result.name) {
      downloadCombinedSTL(result.letter, result.name, stem);
    } else {
      downloadSTL(result.letter, `${stem}_LETTER.stl`);
    }
  };

  return (
    <div className={`poc mode-${uiMode} mobile-tab-${mobileTab}`}>
      {/* Phone tabs — sticky; hidden on desktop via CSS */}
      <nav className="mobile-tabs" role="tablist" aria-label="Навигация">
        <button
          type="button"
          role="tab"
          className={`mobile-tab${mobileTab === 'design' ? ' is-active' : ''}`}
          aria-selected={mobileTab === 'design'}
          onClick={() => setMobileTab('design')}
        >
          Преглед
        </button>
        <button
          type="button"
          role="tab"
          className={`mobile-tab${mobileTab === 'edit' ? ' is-active' : ''}`}
          aria-selected={mobileTab === 'edit'}
          onClick={() => setMobileTab('edit')}
        >
          Настройки
        </button>
        <button
          type="button"
          role="tab"
          className={`mobile-tab${mobileTab === 'order' ? ' is-active' : ''}`}
          aria-selected={mobileTab === 'order'}
          onClick={() => setMobileTab('order')}
        >
          Свали
        </button>
      </nav>

      <main className="layout">

        {/* ── Viewer ─────────────────────────────────────────────────────── */}
        <section className="panel panel-viewer" aria-label="3D преглед">
          <div className="viewer-card">
            <Viewer3D
              meshes={
                result
                  ? { letter: result.letter, name: result.name, models3d: result.models3d, depth, inlayDepth }
                  : null
              }
              letterColor={letterColor}
              nameColor={nameColor}
            />

            {(error || (result?.warnings?.length ?? 0) > 0) && (
              <div className="viewer-warnings">
                {error && <div className="vw-item vw-error">{error}</div>}
                {result?.warnings.map((w) => (
                  <div key={w} className="vw-item vw-warn">{w}</div>
                ))}
              </div>
            )}
            <div className="model-info">
              {!isBasic && (
                <span className="mi-item">
                  <span className="mi-label">Триъгълници</span>
                  <span className="mi-val">{totalTris > 0 ? totalTris.toLocaleString() : '—'}</span>
                </span>
              )}
              <span className="mi-item">
                <span className="mi-label">Размер</span>
                <span className="mi-val">
                  {result
                    ? `${result.dimensions.x} × ${result.dimensions.y} × ${result.dimensions.z} mm`
                    : '—'}
                </span>
              </span>
              {!isBasic && (
                <span className="mi-item">
                  <span className="mi-label">Обем</span>
                  <span className="mi-val">{totalVol > 0 ? `${totalVol} cm³` : '—'}</span>
                </span>
              )}
            </div>
            <p className="viewer-hint">Завърти · пипни · смени настройките · свали STL</p>
          </div>
        </section>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <aside className="panel panel-controls">

          <div className="controls-edit">
          {/* Easy / Advanced — same pattern as sticker configurator */}
          <div className="mode-toggle" role="group" aria-label="Режим">
            <button
              type="button"
              className={`mode-btn${isBasic ? ' is-active' : ''}`}
              onClick={() => setMode('basic')}
            >
              Лесно
            </button>
            <button
              type="button"
              className={`mode-btn${!isBasic ? ' is-active' : ''}`}
              onClick={() => setMode('advanced')}
            >
              Напреднал
            </button>
          </div>
          <button type="button" className="btn-reset" onClick={resetAll}>
            Започни отначало
          </button>
          {isBasic && (
            <p className="basic-hint">Напиши буква и име → свали STL. Без иконки и сложни настройки.</p>
          )}

          {/* Text — always visible */}
          <div className="group">
            <h2>Текст</h2>
            <label>
              Главна буква
              <input
                value={letter}
                maxLength={2}
                onChange={(e) => setLetter(e.target.value.slice(0, 1).toUpperCase() || e.target.value)}
              />
            </label>
            <label>
              Надпис
              <input
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dalia / Мария"
              />
              <span className="char-count">{name.length} / 24</span>
            </label>
          </div>

          {/* Fonts — always visible */}
          <div className="group">
            <h2>Шрифт</h2>
            <label>
              Буква
              <select value={letterFont} onChange={(e) => { setLetterFont(e.target.value as FontKey); setPreset('classic'); }}>
                {(Object.keys(FONTS) as FontKey[]).map((k) => (
                  <option key={k} value={k}>{FONTS[k].label}</option>
                ))}
              </select>
            </label>
            <label>
              Надпис
              <select value={nameFont} onChange={(e) => { setNameFont(e.target.value as FontKey); setPreset('classic'); }}>
                {(Object.keys(FONTS) as FontKey[]).map((k) => (
                  <option key={k} value={k}>{FONTS[k].label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Simple size in Easy mode */}
          {isBasic && (
            <div className="group">
              <h2>Размер</h2>
              <SliderRow label="Височина на буквата (мм)" value={letterHeight} min={60} max={300} step={1} onChange={setLetterHeight} />
              <SliderRow label="Височина на надписа (мм)" value={nameHeight} min={8} max={100} step={1} onChange={setNameHeight} />
            </div>
          )}

          {/* Preview colors — always */}
          <div className="group">
            <h2>Цветове (превю)</h2>
            <div className="color-row">
              <span>Буква</span>
              <input type="color" value={letterColor} onChange={(e) => setLetterColor(e.target.value)} />
              <span>Надпис</span>
              <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} />
            </div>
          </div>

          {/* ── Advanced-only sections ───────────────────────────────────── */}
          {!isBasic && (
            <>
              <div className="group">
                <h2>Стил пресети</h2>
                <div className="chips">
                  {(Object.keys(STYLE_PRESETS) as StylePreset[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={preset === p ? 'chip active' : 'chip'}
                      onClick={() => applyPreset(p)}
                    >
                      {STYLE_PRESETS[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group">
                <h2>Пресети символи</h2>
                <p className="hint">Готова композиция — автоматично наредени символи.</p>
                <div className="preset-grid">
                  {SYMBOL_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="preset-btn"
                      title={p.description}
                      onClick={() => applySymbolPreset(p.id)}
                    >
                      <span className="preset-emoji">{p.emoji}</span>
                      <span className="preset-label">{p.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="preset-btn preset-clear"
                    title="Изчисти всички символи"
                    onClick={() => setSymInstances([])}
                  >
                    <span className="preset-emoji">✕</span>
                    <span className="preset-label">Изчисти</span>
                  </button>
                </div>
              </div>

              <div className="group">
                <h2>Символи</h2>
                <p className="hint">Кликни върху символ, за да го добавиш.</p>
                <div className="symbol-grid">
                  {SYMBOLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={`Добави ${s.labelBg}`}
                      className="sym-btn"
                      onClick={() => {
                        const uid = nextSymUid.current++;
                        setSymInstances((prev) => [
                          ...prev,
                          { uid, id: s.id, size: 20, x: 0, y: 25 },
                        ]);
                      }}
                    >
                      <span className="sym-emoji">{s.emoji}</span>
                      <span className="sym-label">{s.labelBg}</span>
                    </button>
                  ))}
                </div>

                {symInstances.map((inst) => {
                  const def = SYMBOLS.find((s) => s.id === inst.id)!;
                  const update = (patch: Partial<SymInstance>) =>
                    setSymInstances((prev) =>
                      prev.map((si) => (si.uid === inst.uid ? { ...si, ...patch } : si)),
                    );
                  return (
                    <div key={inst.uid} className="si-card">
                      <div className="si-header">
                        <span>{def.emoji} {def.labelBg}</span>
                        <button
                          type="button"
                          className="si-remove"
                          onClick={() =>
                            setSymInstances((prev) => prev.filter((si) => si.uid !== inst.uid))
                          }
                        >
                          ✕
                        </button>
                      </div>
                      <SliderRow label="Размер (мм)" value={inst.size} min={8} max={80} step={1} onChange={(v) => update({ size: v })} />
                      <SliderRow label="X Offset" value={inst.x} min={-80} max={80} step={1} onChange={(v) => update({ x: v })} />
                      <SliderRow label="Y Offset" value={inst.y} min={-80} max={80} step={1} onChange={(v) => update({ y: v })} />
                    </div>
                  );
                })}
              </div>

              <div className="group">
                <h2>Размери (мм)</h2>
                <SliderRow label="Височина буква" value={letterHeight} min={60} max={300} step={1} onChange={setLetterHeight} />
                <SliderRow label="Височина надпис" value={nameHeight} min={8} max={100} step={1} onChange={setNameHeight} />
                <SliderRow label="Дълбочина" value={depth} min={4} max={20} step={0.5} onChange={setDepth} />
                <SliderRow label="Дълбочина inlay" value={inlayDepth} min={0.8} max={Math.max(1, depth - 0.5)} step={0.1} onChange={setInlayDepth} />
                <SliderRow label="Tolerance" value={tolerance} min={0.05} max={0.5} step={0.05} onChange={setTolerance} />
              </div>

              <div className="group">
                <h2>Качество на печат</h2>
                <div className="chips">
                  {(Object.keys(QUALITY_SEGS) as PrintQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={quality === q ? 'chip active' : 'chip'}
                      onClick={() => setQuality(q)}
                    >
                      {q.charAt(0).toUpperCase() + q.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group">
                <h2>Auto-Connect</h2>
                <p className="hint">Свързва точки (i, j) и близки отделни букви в една част</p>
                <label className="row">
                  <span>Auto-Connect</span>
                  <input type="checkbox" checked={autoConnect} onChange={(e) => setAutoConnect(e.target.checked)} />
                </label>
                {autoConnect && (
                  <SliderRow
                    label="Дебелина на моста"
                    value={bridgeThickness}
                    min={0.4} max={2} step={0.1}
                    onChange={setBridgeThickness}
                  />
                )}
                <SliderRow
                  label="Raised Inlay"
                  value={raisedInlay}
                  min={0} max={1} step={0.05}
                  onChange={setRaisedInlay}
                />
              </div>

              <div className="group">
                <h2>Позиция на надписа</h2>
                <SliderRow label="X Offset" value={nameX} min={-80} max={80} step={1} onChange={setNameX} />
                <SliderRow label="Y Offset" value={nameY} min={-80} max={80} step={1} onChange={setNameY} />
              </div>
            </>
          )}

          </div>{/* /controls-edit */}

          {/* Downloads — order pane on phone; always visible on desktop */}
          <div className="group download order-block">
            <h2>Изтегляне</h2>
            <p className="hint">Един STL с припокрити части (за multi-color slicer).</p>
            <button
              type="button"
              className="btn-primary btn-full"
              disabled={!result || busy}
              onClick={downloadStl}
            >
              Свали STL
            </button>
            <p className="hint" style={{ marginTop: '0.5rem' }}>ZIP с отделни STL файлове (печат и лепене).</p>
            <button
              type="button"
              className="btn-outline btn-full"
              disabled={!result || busy}
              onClick={() => result && void downloadSeparateZIP(result.letter, result.name, stem, result.models3d)}
            >
              Свали части (ZIP)
            </button>
          </div>

        </aside>
      </main>

      {/* Sticky CTA — phone only */}
      <div className="mobile-cta-bar" aria-label="Бързи действия">
        <button
          type="button"
          className="btn-primary"
          disabled={!result || busy}
          onClick={downloadStl}
        >
          Свали STL
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => setMobileTab(mobileTab === 'edit' ? 'design' : 'edit')}
        >
          {mobileTab === 'edit' ? 'Преглед' : 'Настройки'}
        </button>
      </div>

      {busy && <div className="generating-bar">Генерира…</div>}
    </div>
  );
}

// ─── Shared slider component ────────────────────────────────────────────────
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <div className="slider-label">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

void meshToBinarySTL; // prevent unused import warning

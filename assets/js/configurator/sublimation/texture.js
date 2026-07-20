import * as THREE from 'three';
import { state, TEXTURE_W, TEXTURE_H } from './state.js';

export const texCanvas = document.createElement('canvas');
texCanvas.width  = TEXTURE_W;
texCanvas.height = TEXTURE_H;

export const texCtx = texCanvas.getContext('2d');

export const texture = new THREE.CanvasTexture(texCanvas);
texture.colorSpace = THREE.SRGBColorSpace;

/**
 * Рисува върху offscreen canvas и обновява Three.js текстурата.
 * Извиква се при всяка промяна на цвят, изображение или текст.
 */
export function drawTexture() {
  texCtx.clearRect(0, 0, TEXTURE_W, TEXTURE_H);

  texCtx.fillStyle = state.bodyColor;
  texCtx.fillRect(0, 0, TEXTURE_W, TEXTURE_H);

  if (state.userImage) {
    const img   = state.userImage;
    const maxW  = TEXTURE_W * state.imgSize;
    const maxH  = TEXTURE_H * state.imgSize;
    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const drawW = img.naturalWidth  * ratio;
    const drawH = img.naturalHeight * ratio;
    const drawX = state.imgX * TEXTURE_W - drawW / 2;
    const drawY = state.imgY * TEXTURE_H - drawH / 2;
    texCtx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  if (state.text.trim()) {
    texCtx.font         = `bold ${state.textSize * 3}px ${state.font}`;
    texCtx.fillStyle    = state.textColor;
    texCtx.textAlign    = 'center';
    texCtx.textBaseline = 'middle';
    texCtx.fillText(
      state.text,
      state.textX * TEXTURE_W,
      state.textY * TEXTURE_H
    );
  }

  texture.needsUpdate = true;
}

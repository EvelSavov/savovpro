/**
 * Споделено реактивно state за сублимационния конфигуратор.
 * Всички модули четат / пишат в този обект.
 */
export const state = {
  product:     'mug330',
  bodyColor:   '#ffffff',
  handleColor: '#ffffff',
  innerColor:  '#ffffff',
  userImage:   null,   // HTMLImageElement | null
  imgSize:     0.6,
  imgX:        0.5,
  imgY:        0.5,
  text:        '',
  font:        'Arial',
  textSize:    36,
  textColor:   '#1a1a1a',
  textX:       0.5,
  textY:       0.65,
};

export const PHONE = '+359884121606';
export const EMAIL = 'info@savovpro.com';

export const TEXTURE_W = 2048;
export const TEXTURE_H = 1024;

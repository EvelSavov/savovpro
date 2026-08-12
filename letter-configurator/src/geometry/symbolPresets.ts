/**
 * Symbol presets — each defines a composition of symbols positioned
 * relative to the letter center using fractions of `letterHeight`.
 *
 * Coordinate reference (letterHeight = 100 mm):
 *   y = +0.40 → near top of letter
 *   y =  0.00 → letter center
 *   y = -0.30 → lower area (name text lives around y = -0.08)
 *   x = ±0.25 → left/right of centre (most letters fit in ±0.35)
 *
 * All symbols are guaranteed to land within typical letter bounds.
 * The user can still fine-tune positions afterwards.
 */

export interface PresetSymbol {
  /** Symbol ID matching SYMBOLS catalogue */
  id: string;
  /** X position as fraction of letterHeight */
  xFrac: number;
  /** Y position as fraction of letterHeight */
  yFrac: number;
  /** Size as fraction of letterHeight */
  sizeFrac: number;
}

export interface SymbolPreset {
  id: string;
  label: string;
  description: string;
  emoji: string;
  symbols: PresetSymbol[];
}

export const SYMBOL_PRESETS: SymbolPreset[] = [
  {
    id: 'sky',
    label: 'Небе',
    description: 'Балон, облаци и звезди',
    emoji: '🎈',
    symbols: [
      { id: 'hotAirBalloon', xFrac: -0.12, yFrac:  0.28, sizeFrac: 0.22 },
      { id: 'cloud',         xFrac:  0.18, yFrac:  0.38, sizeFrac: 0.14 },
      { id: 'cloud',         xFrac: -0.22, yFrac:  0.42, sizeFrac: 0.10 },
      { id: 'star',          xFrac:  0.10, yFrac:  0.18, sizeFrac: 0.09 },
      { id: 'star',          xFrac:  0.24, yFrac:  0.08, sizeFrac: 0.07 },
      { id: 'star',          xFrac: -0.05, yFrac:  0.10, sizeFrac: 0.07 },
    ],
  },
  {
    id: 'stars',
    label: 'Звезди',
    description: 'Пет звезди в различни размери',
    emoji: '⭐',
    symbols: [
      { id: 'star', xFrac: -0.18, yFrac:  0.38, sizeFrac: 0.16 },
      { id: 'star', xFrac:  0.20, yFrac:  0.32, sizeFrac: 0.12 },
      { id: 'star', xFrac:  0.05, yFrac:  0.24, sizeFrac: 0.14 },
      { id: 'star', xFrac: -0.08, yFrac:  0.10, sizeFrac: 0.09 },
      { id: 'star', xFrac:  0.22, yFrac:  0.12, sizeFrac: 0.08 },
    ],
  },
  {
    id: 'romantic',
    label: 'Романтично',
    description: 'Сърца, луна и звезди',
    emoji: '❤️',
    symbols: [
      { id: 'heart',  xFrac:  0.00, yFrac:  0.34, sizeFrac: 0.18 },
      { id: 'moon',   xFrac: -0.20, yFrac:  0.24, sizeFrac: 0.14 },
      { id: 'heart',  xFrac:  0.20, yFrac:  0.18, sizeFrac: 0.10 },
      { id: 'star',   xFrac: -0.08, yFrac:  0.12, sizeFrac: 0.08 },
      { id: 'star',   xFrac:  0.15, yFrac:  0.38, sizeFrac: 0.07 },
    ],
  },
  {
    id: 'baby',
    label: 'Бебе',
    description: 'Мечо, балонче и цветя',
    emoji: '🐻',
    symbols: [
      { id: 'bear',     xFrac:  0.12, yFrac:  0.28, sizeFrac: 0.22 },
      { id: 'balloon',  xFrac: -0.18, yFrac:  0.30, sizeFrac: 0.14 },
      { id: 'flower',   xFrac:  0.20, yFrac:  0.10, sizeFrac: 0.12 },
      { id: 'star',     xFrac: -0.10, yFrac:  0.14, sizeFrac: 0.08 },
      { id: 'heart',    xFrac: -0.20, yFrac:  0.10, sizeFrac: 0.09 },
    ],
  },
  {
    id: 'sunshine',
    label: 'Слънчево',
    description: 'Слънце, дъга и облаци',
    emoji: '☀️',
    symbols: [
      { id: 'sun',      xFrac: -0.10, yFrac:  0.32, sizeFrac: 0.20 },
      { id: 'rainbow',  xFrac:  0.14, yFrac:  0.24, sizeFrac: 0.20 },
      { id: 'cloud',    xFrac: -0.22, yFrac:  0.14, sizeFrac: 0.13 },
      { id: 'star',     xFrac:  0.22, yFrac:  0.38, sizeFrac: 0.08 },
      { id: 'star',     xFrac:  0.05, yFrac:  0.10, sizeFrac: 0.07 },
    ],
  },
  {
    id: 'butterfly',
    label: 'Природа',
    description: 'Пеперуди, цветя и звезди',
    emoji: '🦋',
    symbols: [
      { id: 'butterfly', xFrac:  0.05, yFrac:  0.34, sizeFrac: 0.22 },
      { id: 'flower',    xFrac: -0.22, yFrac:  0.22, sizeFrac: 0.14 },
      { id: 'flower',    xFrac:  0.22, yFrac:  0.14, sizeFrac: 0.11 },
      { id: 'star',      xFrac: -0.10, yFrac:  0.12, sizeFrac: 0.08 },
      { id: 'heart',     xFrac:  0.15, yFrac:  0.36, sizeFrac: 0.09 },
    ],
  },
];

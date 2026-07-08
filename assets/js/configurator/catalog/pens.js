/**
 * Pen configurator catalog.
 * Base prices → assets/js/pricing-config.js → engrave.categories.pens
 *
 * textCY   — vertical center of the engraving area (0–1 fraction of canvas height)
 * textMaxW — maximum text width (0–1 fraction of canvas width)
 * clipH    — height of the clipping rectangle for the engraving area (fraction of canvas height)
 *
 * The pen barrel on pen-bamboo-blank.png (1024×1024) runs from ~y=175 to ~y=875.
 * Barrel centre ≈ y=525 → 525/1024 ≈ 0.51.
 * Barrel width  ≈ 118px → 118/1024 * 440/440 ≈ 0.115 of canvas → textMaxW=0.18 gives
 * a bit of breathing room while staying on the barrel.
 */
window.CFG_CONFIG = {
  id: 'pens',
  title: 'Химикалки',
  defaultModel: 'pen-bamboo',

  features: {
    doubleSided: false,
    engraveSim: true,
  },

  models: {
    'pen-bamboo': {
      name: 'Бамбукова химикалка',
      shortName: 'Бамбук',
      src: 'assets/configurator/pens/pen-bamboo-blank.png',
      mask: null,
      textCY: 0.51,
      textMaxW: 0.18,
      clipH: 0.13,
    },
  },

  templates: [
    {
      name: 'Само Имена',
      line1: 'ИВАН ПЕТРОВ',
      line2: '',
      font: 'Montserrat',
      size: 12,
      color: '#2D1005',
      letterSpacing: 1,
    },
    {
      name: 'Имена + Дата',
      line1: 'ИВАН ПЕТРОВ',
      line2: '12.06.2024',
      font: 'Montserrat',
      size: 10,
      color: '#2D1005',
      letterSpacing: 0,
    },
    {
      name: 'Калиграфски',
      line1: 'Иван Петров',
      line2: '',
      font: 'Dancing Script',
      size: 16,
      color: '#2D1005',
      letterSpacing: 0,
    },
    {
      name: 'Монограм',
      line1: 'И.П.',
      line2: '',
      font: 'Playfair Display',
      size: 20,
      color: '#1a1a1a',
      letterSpacing: 4,
    },
    {
      name: 'Компания',
      line1: 'ФИРМА ООД',
      line2: 'firmata.com',
      font: 'Montserrat',
      size: 9,
      color: '#1a1a1a',
      letterSpacing: 2,
    },
  ],
};

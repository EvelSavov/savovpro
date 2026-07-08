/**
 * Стикери — каталог.
 * Цени, размери, шрифтове и настройки по подразбиране се четат от
 * assets/js/pricing-config.js (SHOP_CONFIG.stickers).
 * Редактирай стойностите ТАМ, не тук.
 */
(function () {
  var SC = (window.SHOP_CONFIG || {}).stickers || {};

  window.CFG_CONFIG = {
    id:       'stickers',
    title:    'Стикери',
    currency: (window.SHOP_CONFIG || {}).currency || '€',

    /** Ценова формула (синхронизирана от pricing-config.js) */
    pricing: SC.formula || { minPrice: 2, setupFee: 1, pricePerCm2: 0.07 },

    /** Размери на стикера (сантиметри) */
    size: SC.size || { minW: 2, maxW: 120, minH: 2, maxH: 120, defaultW: 20, defaultH: 10 },

    /** Бързи размери */
    quickSizes: SC.quickSizes || [
      { label: '5 × 5 cm',    w:   5, h:  5 },
      { label: '10 × 5 cm',   w:  10, h:  5 },
      { label: '10 × 10 cm',  w:  10, h: 10 },
      { label: '20 × 10 cm',  w:  20, h: 10 },
    ],

    /** Шрифтове */
    fonts: SC.fonts || [
      { id: 'Montserrat',       label: 'Montserrat — модерен'       },
      { id: 'Playfair Display', label: 'Playfair Display — класически' },
      { id: 'Caveat',           label: 'Caveat — ръкописен'         },
      { id: 'Dancing Script',   label: 'Dancing Script — курсив'    },
      { id: 'DM Sans',          label: 'DM Sans — минималистичен'   },
    ],

    /** Настройки по подразбиране */
    defaults: Object.assign(
      { removeBg: true, font: 'Montserrat', defaultText: 'SAVOV PRO\nMade for you' },
      SC.defaults || {}
    ),
  };
})();

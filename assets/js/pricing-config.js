/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          SAVOV PRO — ЦЕНТРАЛНА КОНФИГУРАЦИЯ                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Редактирай САМО този файл за:
 *   • цени на продукти
 *   • формули за изчисление
 *   • минимални поръчки
 *   • количествени отстъпки
 *   • размери и бързи размери на стикери
 *   • шрифтове
 *   • срокове за изпълнение
 *   • текст на disclaimer-а
 *
 * ──────────────────────────────────────────────────────────────
 * ФОРМУЛИ
 * ──────────────────────────────────────────────────────────────
 * Гравиране (ключодържатели, ароматизатори, химикалки):
 *   Единична цена = базова_цена_модел + надбавка_двустранно
 *   Надбавка двустранно:
 *     - Еднакъв дизайн  → engrave.doubleSided.sameDesign.price
 *     - Различни дизайни → engrave.doubleSided.differentDesign.price
 *
 * Стикери (плотер / vinyl):
 *   Единична цена = max(minPrice, setupFee + ширина_cm × височина_cm × pricePerCm2)
 *   Крайна цена   = единична_цена × qty × (1 − отстъпка / 100)
 *
 * Количествена отстъпка (важи за ВСИЧКИ категории):
 *   Взима се пръв ред от quantityBreaks, чийто minQty ≤ qty.
 *   Редовете са наредени в намаляващ ред.
 * ──────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     1. БИЗНЕС НАСТРОЙКИ
     ═══════════════════════════════════════════════════════════ */
  var CONFIG = {

    currency: '€',
    currencyCode: 'EUR',
    vatIncluded: true,          // ДДС е включено в показаните цени
    roundingDecimals: 2,

    /** Текст под цената в конфигуратора */
    disclaimer: 'Ориентировъчна цена — финална оферта след потвърждение. Срок и мин. поръчка по договаряне.',

    /* ───────────────────────────────────────────────────────
       2. КОЛИЧЕСТВЕНИ ОТСТЪПКИ  (важи за всички категории)
          Наредени в намаляващ ред по minQty!
       ─────────────────────────────────────────────────────── */
    quantityBreaks: [
      { minQty: 100, discountPct: 25, label: '≥ 100 бр.  → −25%' },
      { minQty:  50, discountPct: 20, label: '≥ 50 бр.   → −20%' },
      { minQty:  10, discountPct: 10, label: '≥ 10 бр.   → −10%' },
      { minQty:   1, discountPct:  0, label: '1–9 бр.    → без отстъпка' },
    ],

    /* ───────────────────────────────────────────────────────
       3. СРОКОВЕ ЗА ИЗПЪЛНЕНИЕ
       ─────────────────────────────────────────────────────── */
    leadTime: {
      keychains:  '3–5 работни дни',
      fresheners: '3–5 работни дни',
      pens:       '5–7 работни дни',
      stickers:   '5–7 работни дни',
    },

    /* ───────────────────────────────────────────────────────
       4. ГРАВИРАНЕ  (ключодържатели · ароматизатори · химикалки)
       ─────────────────────────────────────────────────────── */
    engrave: {

      /** Надбавки за двустранно гравиране */
      doubleSided: {
        sameDesign:      { price: 3, label: 'Двустранно — еднакъв дизайн'   },
        differentDesign: { price: 5, label: 'Двустранно — различни дизайни' },
      },

      /** Базова цена и мин. поръчка по категория и модел */
      categories: {

        keychains: {
          minOrder: 1,
          models: {
            'keychain-round-light':         { price: 8  },
            'keychain-rect-walnut-leather': { price: 12 },
            'keychain-rect-walnut-chain':   { price: 10 },
          },
        },

        fresheners: {
          minOrder: 1,
          models: {
            'freshener-walnut-silver': { price: 15 },
            'freshener-walnut-black':  { price: 15 },
          },
        },

        pens: {
          minOrder: 5,           // химикалките се поръчват минимум 5 бр.
          models: {
            'pen-bamboo': { price: 10 },
          },
        },

      },
    },

    /* ───────────────────────────────────────────────────────
       5. СТИКЕРИ  (плотер / vinyl)
       ─────────────────────────────────────────────────────── */
    stickers: {

      minOrder: 1,

      /**
       * Ценова формула:
       *   unitPrice = max(minPrice, setupFee + w × h × pricePerCm2)
       */
      formula: {
        minPrice:    2,    // минимална цена на поръчка (€)
        setupFee:    1,    // такса подготовка на файла (€)
        pricePerCm2: 0.07, // цена на кв. см (€)
      },

      /** Размери на стикера (сантиметри) */
      size: {
        minW:     2,
        maxW:   120,
        minH:     2,
        maxH:   120,
        defaultW: 20,
        defaultH: 10,
      },

      /**
       * Бързи размери — показват се в уизъарда и в пикъра за размери.
       * Добавяй, премахвай или редактирай редове по желание.
       */
      quickSizes: [
        { label: '5 × 5 cm',    w:   5, h:  5 },
        { label: '10 × 5 cm',   w:  10, h:  5 },
        { label: '10 × 10 cm',  w:  10, h: 10 },
        { label: '15 × 5 cm',   w:  15, h:  5 },
        { label: '20 × 10 cm',  w:  20, h: 10 },
        { label: '60 × 30 cm',  w:  60, h: 30 },
        { label: '120 × 60 cm', w: 120, h: 60 },
      ],

      /**
       * Достъпни шрифтове.
       * id трябва да съвпада с CSS @font-face family-name.
       */
      fonts: [
        { id: 'Montserrat',       label: 'Montserrat — модерен'       },
        { id: 'Playfair Display', label: 'Playfair Display — класически' },
        { id: 'Caveat',           label: 'Caveat — ръкописен'         },
        { id: 'Dancing Script',   label: 'Dancing Script — курсив'    },
        { id: 'DM Sans',          label: 'DM Sans — минималистичен'   },
      ],

      /** Настройки по подразбиране при зареждане на конфигуратора */
      defaults: {
        removeBg:    true,
        font:        'Montserrat',
        defaultText: 'SAVOV PRO\nMade for you',
      },

    },

    /* ───────────────────────────────────────────────────────
       6. ТЕКСТ НА ПОРЪЧКИТЕ (WA / Email)
       ─────────────────────────────────────────────────────── */
    orderMessage: {
      greeting:      'Здравейте! Искам да поръчам персонализиран продукт.',
      attachmentNote: 'Моля свали превю PNG от конфигуратора и го прикачи в чата.',
      emailSubject:   'Поръчка: Персонализиран продукт',
    },

  }; // END CONFIG


  /* ═══════════════════════════════════════════════════════════
     ПОМОЩНИ ФУНКЦИИ — не се налага да редактираш
     ═══════════════════════════════════════════════════════════ */

  function roundPrice(amount) {
    var factor = Math.pow(10, CONFIG.roundingDecimals);
    return Math.round(amount * factor) / factor;
  }

  function formatPrice(amount) {
    return roundPrice(amount) + ' ' + CONFIG.currency;
  }

  function formatExtra(amount) {
    return '+' + roundPrice(amount) + ' ' + CONFIG.currency;
  }

  /** Връща % отстъпка за дадено количество */
  function getDiscountPct(qty) {
    var breaks = CONFIG.quantityBreaks;
    for (var i = 0; i < breaks.length; i++) {
      if (qty >= breaks[i].minQty) return breaks[i].discountPct;
    }
    return 0;
  }

  /** Прилага количествена отстъпка върху единична цена */
  function applyDiscount(unitPrice, qty) {
    var pct = getDiscountPct(qty);
    return roundPrice(unitPrice * qty * (1 - pct / 100));
  }

  function getLeadTime(catId) {
    return CONFIG.leadTime[catId] || '—';
  }

  function getMinOrder(catId) {
    if (catId === 'stickers') return CONFIG.stickers.minOrder;
    var cat = CONFIG.engrave.categories[catId];
    return cat ? cat.minOrder : 1;
  }

  /* ── Гравиране ── */

  function getEngraveModelPrice(catId, modelId) {
    var cat = CONFIG.engrave.categories[catId];
    if (!cat) return null;
    var m = cat.models[modelId];
    return m != null ? m.price : null;
  }

  /**
   * Изчислява единична цена за гравиране.
   * @param {string} catId   — keychains | fresheners | pens
   * @param {string} modelId
   * @param {{ sides?: number, sameDesign?: boolean }} opts
   */
  function calcEngrave(catId, modelId, opts) {
    opts = opts || {};
    var base = getEngraveModelPrice(catId, modelId);
    if (base == null) return 0;

    var extra = 0;
    if (opts.sides === 2) {
      extra = opts.sameDesign
        ? CONFIG.engrave.doubleSided.sameDesign.price
        : CONFIG.engrave.doubleSided.differentDesign.price;
    }
    return roundPrice(base + extra);
  }

  function getDoubleSidedExtra(sameDesign) {
    return sameDesign
      ? CONFIG.engrave.doubleSided.sameDesign.price
      : CONFIG.engrave.doubleSided.differentDesign.price;
  }

  /* ── Стикери ── */

  /**
   * Единична цена на стикер по площ.
   * @param {number} widthCm
   * @param {number} heightCm
   */
  function calcSticker(widthCm, heightCm) {
    var p = CONFIG.stickers.formula;
    var area = widthCm * heightCm;
    return roundPrice(Math.max(p.minPrice, p.setupFee + area * p.pricePerCm2));
  }

  /**
   * Крайна цена за стикери с количествена отстъпка.
   * @param {number} widthCm
   * @param {number} heightCm
   * @param {number} qty
   */
  function calcStickerTotal(widthCm, heightCm, qty) {
    return applyDiscount(calcSticker(widthCm, heightCm), qty || 1);
  }

  /* ── Каталог helpers ── */

  /** Инжектира цени в CFG_CONFIG.models след зареждане на каталога */
  function applyEngraveCatalog(cfg) {
    if (!cfg || !cfg.id || !cfg.models) return;
    var catId = cfg.id;
    Object.keys(cfg.models).forEach(function (modelId) {
      var price = getEngraveModelPrice(catId, modelId);
      if (price == null) return;
      cfg.models[modelId].price    = price;
      cfg.models[modelId].currency = CONFIG.currency;
    });
    cfg.currency = CONFIG.currency;
    cfg.minOrder = getMinOrder(catId);
    cfg.leadTime = getLeadTime(catId);
  }

  /** Синхронизира ценовия блок на стикерния каталог от тази конфигурация */
  function applyStickerCatalog(cfg) {
    if (!cfg) return;
    cfg.currency  = CONFIG.currency;
    cfg.minOrder  = CONFIG.stickers.minOrder;
    cfg.leadTime  = CONFIG.leadTime.stickers;
    cfg.pricing   = {
      minPrice:    CONFIG.stickers.formula.minPrice,
      setupFee:    CONFIG.stickers.formula.setupFee,
      pricePerCm2: CONFIG.stickers.formula.pricePerCm2,
    };
    // Презаписваме и UI параметрите, за да е всичко централизирано
    cfg.size       = CONFIG.stickers.size;
    cfg.quickSizes = CONFIG.stickers.quickSizes;
    cfg.fonts      = CONFIG.stickers.fonts;
    cfg.defaults   = cfg.defaults || {};
    Object.assign(cfg.defaults, CONFIG.stickers.defaults);
  }

  /* ═══════════════════════════════════════════════════════════
     ПУБЛИЧЕН API
     ═══════════════════════════════════════════════════════════ */
  window.PRICING_CONFIG = CONFIG; // backward compat alias
  window.SHOP_CONFIG    = CONFIG; // новото предпочитано глобално

  window.Pricing = {
    config:               CONFIG,

    /* Форматиране */
    round:                roundPrice,
    format:               formatPrice,
    formatExtra:          formatExtra,

    /* Отстъпки */
    getDiscountPct:       getDiscountPct,
    applyDiscount:        applyDiscount,

    /* Информация */
    getLeadTime:          getLeadTime,
    getMinOrder:          getMinOrder,

    /* Гравиране */
    getEngraveModelPrice: getEngraveModelPrice,
    getDoubleSidedExtra:  getDoubleSidedExtra,
    calcEngrave:          calcEngrave,

    /* Стикери */
    calcSticker:          calcSticker,
    calcStickerTotal:     calcStickerTotal,

    /* Каталог интеграция */
    applyEngraveCatalog:  applyEngraveCatalog,
    applyStickerCatalog:  applyStickerCatalog,
  };

})();

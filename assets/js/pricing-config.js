/**
 * SAVOV PRO — централно ценообразуване за конфигураторите.
 *
 * Редактирай САМО този файл за цени, надбавки и текст на disclaimer.
 *
 * Препоръчани формули:
 * ─────────────────────
 * Гравиране (ключодържатели, ароматизатори):
 *   цена = базова_цена_модел + надбавка_опции
 *   • Едностранно: само базова цена
 *   • Двустранно, еднакъв дизайн: + doubleSided.sameDesign
 *   • Двустранно, различен дизайн: + doubleSided.differentDesign
 *
 * Стикери (плотер / vinyl):
 *   цена = max(minPrice, setupFee + ширина_cm × височина_cm × pricePerCm2)
 *   Стандартна формула за площ + минимална поръчка + такса подготовка.
 */
(function () {
  'use strict';

  var CONFIG = {
    currency: '€',
    currencyCode: 'EUR',
    roundingDecimals: 2,

    disclaimer:
      'Ориентировъчна цена — финална оферта след потвърждение. Срок и мин. поръчка по договаряне.',

    /** Гравиране — базова цена по категория и model id (виж catalog/*.js) */
    engrave: {
      doubleSided: {
        sameDesign: 3,
        differentDesign: 5,
      },
      categories: {
        keychains: {
          'keychain-round-light': 8,
          'keychain-rect-walnut-leather': 12,
          'keychain-rect-walnut-chain': 10,
        },
        fresheners: {
          'freshener-walnut-silver': 15,
          'freshener-walnut-black': 15,
        },
      },
    },

    /**
     * Стикери — area formula
     * @see calcSticker()
     */
    stickers: {
      minPrice: 2,
      setupFee: 1,
      pricePerCm2: 0.07,
    },
  };

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

  function getEngraveModelPrice(catId, modelId) {
    var cat = CONFIG.engrave.categories[catId];
    if (!cat || cat[modelId] == null) return null;
    return cat[modelId];
  }

  /**
   * @param {string} catId — keychains | fresheners
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
        ? CONFIG.engrave.doubleSided.sameDesign
        : CONFIG.engrave.doubleSided.differentDesign;
    }
    return roundPrice(base + extra);
  }

  function getDoubleSidedExtra(sameDesign) {
    return sameDesign
      ? CONFIG.engrave.doubleSided.sameDesign
      : CONFIG.engrave.doubleSided.differentDesign;
  }

  /**
   * @param {number} widthCm
   * @param {number} heightCm
   */
  function calcSticker(widthCm, heightCm) {
    var p = CONFIG.stickers;
    var area = widthCm * heightCm;
    return roundPrice(Math.max(p.minPrice, p.setupFee + area * p.pricePerCm2));
  }

  /** Inject base prices into CFG_CONFIG.models after catalog load */
  function applyEngraveCatalog(cfg) {
    if (!cfg || !cfg.id || !cfg.models) return;
    var catId = cfg.id;
    Object.keys(cfg.models).forEach(function (modelId) {
      var price = getEngraveModelPrice(catId, modelId);
      if (price == null) return;
      cfg.models[modelId].price = price;
      cfg.models[modelId].currency = CONFIG.currency;
    });
    cfg.currency = CONFIG.currency;
  }

  /** Sync sticker catalog pricing block from this config */
  function applyStickerCatalog(cfg) {
    if (!cfg) return;
    cfg.currency = CONFIG.currency;
    cfg.pricing = {
      minPrice: CONFIG.stickers.minPrice,
      setupFee: CONFIG.stickers.setupFee,
      pricePerCm2: CONFIG.stickers.pricePerCm2,
    };
  }

  window.PRICING_CONFIG = CONFIG;
  window.Pricing = {
    config: CONFIG,
    round: roundPrice,
    format: formatPrice,
    formatExtra: formatExtra,
    calcEngrave: calcEngrave,
    calcSticker: calcSticker,
    getEngraveModelPrice: getEngraveModelPrice,
    getDoubleSidedExtra: getDoubleSidedExtra,
    applyEngraveCatalog: applyEngraveCatalog,
    applyStickerCatalog: applyStickerCatalog,
  };
})();

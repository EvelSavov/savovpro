/**
 * Registry of all configurator categories.
 * To add a new category:
 *   1. Add an entry here (id, title, catalog path, engine).
 *   2. Create assets/js/configurator/catalog/<id>.js with window.CFG_CONFIG.
 *   3. Add product images under assets/configurator/<id>/.
 */
window.CONFIGURATOR_CATEGORIES = [
  {
    id: 'keychains',
    title: 'Ключодържатели',
    description: 'Дървени ключодържатели с лазерно гравиране — текст, символи и лого.',
    image: 'assets/configurator/keychains/keychain-round-light-blank.png',
    catalog: 'assets/js/configurator/catalog/keychains.js',
    engine: 'engrave',
    comingSoon: false,
  },
  {
    id: 'fresheners',
    title: 'Ароматизатори',
    description: 'Дървени ароматизатори за автомобил с персонализирано гравиране.',
    image: 'assets/configurator/fresheners/freshener-walnut-silver-blank.png',
    catalog: 'assets/js/configurator/catalog/fresheners.js',
    engine: 'engrave',
    comingSoon: false,
  },
  {
    id: 'stickers',
    title: 'Стикери',
    description: 'Текстови стикери или собствен SVG/PNG дизайн с избор на размер.',
    image: 'assets/products/665D1722-16FF-4A70-BB4F-7B542D7EDFEE_1_201_a-2.jpeg',
    catalog: 'assets/js/configurator/catalog/stickers.js',
    engine: 'sticker',
    page: 'configurator-sticker.html',
    comingSoon: false,
  },
];

/** Returns the URL for a category configurator page. */
window.getConfiguratorUrl = function (cat) {
  if (!cat || cat.comingSoon) return null;
  if (cat.page) {
    return cat.page + (cat.page.indexOf('?') >= 0 ? '&' : '?') + 'cat=' + encodeURIComponent(cat.id);
  }
  if (cat.engine === 'sticker') {
    return 'configurator-sticker.html?cat=' + encodeURIComponent(cat.id);
  }
  return 'configurator-product.html?cat=' + encodeURIComponent(cat.id);
};

/** Updates document title + meta tags for engrave product pages (?cat=). */
window.applyConfiguratorPageMeta = function (catId) {
  var meta = (window.CONFIGURATOR_CATEGORIES || []).find(function (c) {
    return c.id === catId;
  });
  if (!meta) return;

  var pageTitle = 'SAVOV PRO — ' + meta.title;
  document.title = pageTitle;

  var desc = meta.metaDescription || meta.description || '';
  var canonical =
    'https://savovpro.com/configurator-product.html?cat=' + encodeURIComponent(catId);
  var ogImage = meta.ogImage || meta.image || '';
  if (ogImage && ogImage.indexOf('http') !== 0) {
    ogImage = 'https://savovpro.com/' + ogImage.replace(/^\//, '');
  }

  function setMeta(attr, name, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (el) el.setAttribute('content', value);
  }

  setMeta('name', 'description', desc);
  setMeta('property', 'og:title', pageTitle);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', canonical);
  setMeta('name', 'twitter:title', pageTitle);
  setMeta('name', 'twitter:description', desc);
  if (ogImage) {
    setMeta('property', 'og:image', ogImage);
    setMeta('name', 'twitter:image', ogImage);
  }

  var link = document.querySelector('link[rel="canonical"]');
  if (link) link.setAttribute('href', canonical);
};

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
    image: 'assets/services/service-vinyl-plotter-cutting.png',
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

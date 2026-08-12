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
    metaDescription: 'Персонализирани дървени ключодържатели с лазерно гравиране — текст, символи, лого или монограм. Перфектен подарък за рожден ден, именен ден или бизнес партньори. Онлайн конфигуратор. SAVOV PRO.',
    metaKeywords: 'ключодържатели с гравиране, персонализирани ключодържатели, дървени ключодържатели, ключодържатели по поръчка, гравирани подаръци, подарък за рожден ден',
    h1: 'Персонализирани ключодържатели с лазерно гравиране',
    image: 'assets/products/20260111_161704-2.jpg',
    blankImage: 'assets/configurator/keychains/round-light/blank.png',
    ogImage: 'assets/products/20260111_161704-2.jpg',
    catalog: 'assets/js/configurator/catalog/keychains.js',
    engine: 'engrave',
    page: 'configurator-keychains.html',
    comingSoon: false,
  },
  {
    id: 'fresheners',
    title: 'Ароматизатори',
    description: 'Дървени ароматизатори за автомобил с персонализирано гравиране.',
    metaDescription: 'Персонализирани дървени ароматизатори за кола с лазерно гравиране — текст, лого или монограм. Уникален подарък за автомобилни фенове. Онлайн конфигуратор. SAVOV PRO.',
    metaKeywords: 'ароматизатори за кола с гравиране, персонализирани ароматизатори, дървени ароматизатори, ароматизатори по поръчка, авто аксесоари подаръци',
    h1: 'Персонализирани ароматизатори за кола с лазерно гравиране',
    image: 'assets/products/DABF0698-9C20-422D-A22C-24D1A6F53FD1_1_201_a-2.jpeg',
    blankImage: 'assets/configurator/fresheners/walnut-silver/blank.png',
    ogImage: 'assets/products/DABF0698-9C20-422D-A22C-24D1A6F53FD1_1_201_a-2.jpeg',
    catalog: 'assets/js/configurator/catalog/fresheners.js',
    engine: 'engrave',
    page: 'configurator-fresheners.html',
    comingSoon: false,
  },
  {
    id: 'pens',
    title: 'Химикалки',
    description: 'Бамбукови химикалки с лазерно гравиране — текст, лого или PNG дизайн.',
    metaDescription: 'Персонализирани бамбукови химикалки с лазерно гравиране — текст, лого или PNG дизайн. Отличен бизнес подарък или корпоративен сувенир. Онлайн конфигуратор. SAVOV PRO.',
    metaKeywords: 'химикалки с гравиране, персонализирани химикалки, бамбукови химикалки, химикалки по поръчка, бизнес подаръци с лого, корпоративни сувенири',
    h1: 'Персонализирани бамбукови химикалки с лазерно гравиране',
    image: 'assets/products/20260111_163111-2.jpg',
    blankImage: 'assets/configurator/pens/bamboo/blank.png',
    ogImage: 'assets/products/20260111_163111-2.jpg',
    catalog: 'assets/js/configurator/catalog/pens.js',
    engine: 'engrave',
    page: 'configurator-pens.html',
    comingSoon: false,
  },
  {
    id: 'sublimation',
    title: 'Сублимация',
    description: 'Персонализирани чаши, бутилки и магнити — качи твой дизайн и виж 3D preview.',
    metaDescription: 'Персонализирани сублимационни продукти — чаши, бутилки и магнити с твой дизайн. 3D онлайн конфигуратор. SAVOV PRO.',
    metaKeywords: 'сублимационни чаши, персонализирани чаши, чаши по поръчка, сублимация, персонализирани подаръци',
    h1: 'Персонализирани сублимационни продукти — 3D конфигуратор',
    image: 'assets/services/service-sublimation.png',
    ogImage: 'assets/services/service-sublimation.png',
    page: 'configurator-sublimation.html',
    engine: 'sublimation',
    comingSoon: false,
  },
  {
    id: 'letter-lightbox',
    title: '3D Буква с Надпис',
    description: 'LED lightbox буква с персонализирано вградено име — изтегли готов STL файл.',
    metaDescription: '3D LED lightbox буква с вградено персонализирано е — онлайн конфигуратор за 3D печат. SAVOV PRO.',
    h1: '3D Буква с Надпис — LED Lightbox конфигуратор',
    image: 'assets/services/heroes/3d-printing.jpg',
    page: 'configurator-letter.html',
    engine: 'letter-lightbox',
    comingSoon: false,
  },
  {
    id: 'stickers',
    title: 'Стикери',
    description: 'Текстови стикери или собствен SVG дизайн с избор на размер.',
    metaDescription: 'Онлайн конфигуратор за персонализирани стикери с плотерно рязане. Текстови стикери или собствен SVG/PNG дизайн — избери размер, шрифт и цвят. SAVOV PRO.',
    metaKeywords: 'персонализирани стикери, стикери с плотер, плотерно рязане, стикери по поръчка, vinyl стикери, стикери с надпис',
    h1: 'Персонализирани стикери с плотерно рязане',
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
  if (cat.page) return cat.page;
  if (cat.engine === 'sticker') {
    return 'configurator-sticker.html?cat=' + encodeURIComponent(cat.id);
  }
  return 'configurator-product.html?cat=' + encodeURIComponent(cat.id);
};

/** Updates document title, meta tags, JSON-LD and sr-only H1 for engrave product pages (?cat=). */
window.applyConfiguratorPageMeta = function (catId) {
  var meta = (window.CONFIGURATOR_CATEGORIES || []).find(function (c) {
    return c.id === catId;
  });
  if (!meta) return;

  var pageTitle = 'SAVOV PRO — ' + meta.title;
  var seoTitle  = (meta.h1 || meta.title) + ' | SAVOV PRO';
  document.title = seoTitle;

  var desc = meta.metaDescription || meta.description || '';
  var canonicalPath = meta.page || ('configurator-product.html?cat=' + encodeURIComponent(catId));
  var canonical = 'https://savovpro.com/' + canonicalPath;
  var ogImage = meta.ogImage || meta.image || '';
  if (ogImage && ogImage.indexOf('http') !== 0) {
    ogImage = 'https://savovpro.com/' + ogImage.replace(/^\//, '');
  }

  function setMeta(attr, name, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (el) el.setAttribute('content', value);
  }

  function setOrCreateMeta(attr, name, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  setMeta('name', 'description', desc);
  setOrCreateMeta('name', 'keywords', meta.metaKeywords || '');
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

  /* Update sr-only H1 */
  var h1 = document.getElementById('cfg-page-h1');
  if (h1 && meta.h1) h1.textContent = meta.h1;

  /* Update visible header span */
  var span = document.getElementById('cfg-category-title');
  if (span) span.textContent = meta.title;

  /* Update JSON-LD breadcrumb to reflect the current category */
  var ldScript = document.getElementById('ld-engrave-page');
  if (ldScript) {
    try {
      var ld = JSON.parse(ldScript.textContent);
      var graph = ld['@graph'] || [];

      /* Update WebApplication name & url */
      var app = graph.find(function (n) { return n['@type'] === 'WebApplication'; });
      if (app) {
        app.name = 'SAVOV PRO — ' + meta.title + ' конфигуратор';
        app.description = desc;
        app['@id'] = canonical + '#webapp';
        app.url = canonical;
      }

      /* Update BreadcrumbList last item */
      var bc = graph.find(function (n) { return n['@type'] === 'BreadcrumbList'; });
      if (bc && bc.itemListElement) {
        var last = bc.itemListElement[bc.itemListElement.length - 1];
        if (last) { last.name = meta.title; last.item = canonical; }
        bc['@id'] = canonical + '#breadcrumb';
      }

      ldScript.textContent = JSON.stringify(ld);
    } catch (e) { /* ignore JSON errors */ }
  }
};

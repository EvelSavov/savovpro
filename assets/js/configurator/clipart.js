/**
 * Shared Iconify clipart picker for configurators.
 * opts.onPick(iconId, imgElement) — called when user selects an icon.
 */
window.initConfiguratorClipart = function (opts) {
  'use strict';

  var ICONIFY = 'https://api.iconify.design';
  var PREVIEW_HEX = opts.previewColor || 'c9a227';

  var CLIPART_CATS = [
    { label: '♥ Любов', ids: ['mdi:heart', 'mdi:heart-outline', 'mdi:infinity', 'ph:ring-bold', 'mdi:flower', 'mdi:hand-heart', 'mdi:heart-multiple-outline', 'ph:butterfly-bold'] },
    { label: '★ Символи', ids: ['mdi:crown', 'mdi:star', 'mdi:anchor', 'mdi:key-variant', 'mdi:fire', 'mdi:lightning-bolt', 'mdi:compass', 'mdi:shield-star', 'mdi:trophy', 'mdi:medal', 'mdi:peace', 'mdi:yin-yang'] },
    { label: '✿ Природа', ids: ['mdi:leaf', 'mdi:tree', 'mdi:weather-sunny', 'mdi:weather-night', 'mdi:snowflake', 'mdi:mountain', 'mdi:flower-petal-outline', 'mdi:wave', 'mdi:pine-tree', 'mdi:weather-cloudy', 'mdi:grass', 'mdi:seed-outline'] },
    { label: '✦ Животни', ids: ['mdi:paw', 'mdi:cat', 'mdi:dog', 'mdi:bird', 'mdi:fish', 'mdi:rabbit', 'mdi:butterfly', 'mdi:owl', 'mdi:horse', 'mdi:elephant', 'mdi:shark', 'mdi:bee-outline'] },
    { label: '✝ Вяра', ids: ['mdi:cross', 'mdi:star-david', 'mdi:yin-yang', 'mdi:hand-heart', 'mdi:peace', 'mdi:hands-pray'] },
    { label: '◉ Спорт', ids: ['mdi:soccer', 'mdi:basketball', 'mdi:tennis', 'mdi:bicycle', 'mdi:run', 'mdi:swim', 'mdi:weight-lifter', 'mdi:ski', 'mdi:golf', 'mdi:boxing-glove'] },
    { label: '♪ Музика', ids: ['mdi:music-note', 'mdi:guitar-acoustic', 'mdi:piano', 'mdi:headphones', 'mdi:music-clef-treble', 'mdi:microphone', 'mdi:violin', 'mdi:trumpet'] },
  ];

  var BG_EN = {
    'сърце': 'heart', 'сърца': 'heart', 'любов': 'love', 'влюбен': 'love heart',
    'безкрайност': 'infinity', 'пръстен': 'ring', 'целувка': 'kiss', 'рози': 'rose',
    'звезда': 'star', 'звезди': 'stars', 'корона': 'crown', 'диамант': 'diamond',
    'котва': 'anchor', 'ключ': 'key', 'огън': 'fire', 'пламък': 'flame',
    'мълния': 'lightning', 'компас': 'compass', 'щит': 'shield',
    'трофей': 'trophy', 'медал': 'medal', 'камбана': 'bell', 'книга': 'book',
    'стрела': 'arrow', 'самолет': 'airplane', 'ракета': 'rocket',
    'лист': 'leaf', 'листо': 'leaf', 'листа': 'leaf', 'дърво': 'tree', 'гора': 'forest',
    'слънце': 'sun', 'луна': 'moon', 'снежинка': 'snowflake', 'сняг': 'snow',
    'планина': 'mountain', 'планини': 'mountain', 'цвете': 'flower', 'цветя': 'flower',
    'роза': 'rose', 'вълна': 'wave', 'море': 'ocean', 'вода': 'water',
    'котка': 'cat', 'коте': 'cat', 'куче': 'dog', 'лапа': 'paw', 'птица': 'bird',
    'риба': 'fish', 'заек': 'rabbit', 'пеперуда': 'butterfly', 'лъв': 'lion',
    'футбол': 'football', 'баскетбол': 'basketball', 'тенис': 'tennis',
    'кола': 'car', 'автомобил': 'car', 'мотор': 'motorcycle',
    'кафе': 'coffee', 'подарък': 'gift', 'кръст': 'cross', 'музика': 'music',
    'instagram': 'instagram', 'facebook': 'facebook', 'tiktok': 'tiktok',
  };

  function translateQuery(q) {
    var lower = q.toLowerCase().trim();
    if (BG_EN[lower]) return BG_EN[lower];
    return lower.split(/\s+/).map(function (w) { return BG_EN[w] || w; }).join(' ');
  }

  var tabsWrap = document.getElementById(opts.tabsId);
  var gridWrap = document.getElementById(opts.gridId);
  var searchInput = document.getElementById(opts.searchId);
  var searchBtn = document.getElementById(opts.searchBtnId);
  if (!tabsWrap || !gridWrap || !searchInput || !searchBtn || !opts.onPick) return;

  var activeXhr = null;

  function iconSvgUrl(iconId, colorHex) {
    var parts = iconId.split(':');
    var url = ICONIFY + '/' + parts[0] + '/' + parts[1] + '.svg';
    if (colorHex) url += '?color=%23' + colorHex;
    return url;
  }

  function pickIcon(iconId) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () { opts.onPick(iconId, img); };
    img.onerror = function () {
      if (img.src.indexOf('?') !== -1) img.src = iconSvgUrl(iconId);
    };
    img.src = iconSvgUrl(iconId, opts.loadColor || PREVIEW_HEX);
  }

  function makeIconBtn(iconId) {
    var btn = document.createElement('button');
    btn.className = 'cfg-clipart-btn';
    btn.type = 'button';
    var namePart = iconId.split(':')[1] || iconId;
    btn.title = namePart.replace(/-/g, ' ');
    var img = document.createElement('img');
    img.src = iconSvgUrl(iconId, PREVIEW_HEX);
    img.alt = btn.title;
    img.loading = 'lazy';
    img.onerror = function () { btn.style.display = 'none'; };
    btn.appendChild(img);
    btn.addEventListener('click', function () { pickIcon(iconId); });
    return btn;
  }

  function renderIds(ids) {
    gridWrap.innerHTML = '';
    if (!ids || !ids.length) {
      var empty = document.createElement('p');
      empty.className = 'cfg-clipart-empty';
      empty.textContent = 'Няма резултати. Опитай с друга дума.';
      gridWrap.appendChild(empty);
      return;
    }
    ids.forEach(function (id) { gridWrap.appendChild(makeIconBtn(id)); });
  }

  function showLoading() {
    gridWrap.innerHTML = '<p class="cfg-clipart-empty"><span class="cfg-clipart-spinner"></span>Зарежда…</p>';
  }

  function doSearch(query) {
    query = (query || '').trim();
    if (!query) return;
    query = translateQuery(query);
    tabsWrap.querySelectorAll('.cfg-clipart-tab').forEach(function (t) { t.classList.remove('is-active'); });
    if (activeXhr) { try { activeXhr.abort(); } catch (e) {} }
    showLoading();
    var xhr = new XMLHttpRequest();
    activeXhr = xhr;
    var MONO_SETS = 'mdi,ph,tabler,lucide,heroicons,carbon,bi,feather,iconoir,mingcute,ri,material-symbols,ion,fluent';
    xhr.open('GET', ICONIFY + '/search?query=' + encodeURIComponent(query) + '&limit=40&palette=false&prefixes=' + MONO_SETS, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      activeXhr = null;
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          renderIds(data.icons || []);
        } catch (e) { renderIds([]); }
      } else {
        gridWrap.innerHTML = '<p class="cfg-clipart-empty">Грешка при зареждане. Провери интернет връзката.</p>';
      }
    };
    xhr.onerror = function () {
      activeXhr = null;
      gridWrap.innerHTML = '<p class="cfg-clipart-empty">Няма връзка с библиотеката с икони.</p>';
    };
    xhr.send();
  }

  searchBtn.addEventListener('click', function () { doSearch(searchInput.value); });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(this.value); }
  });

  CLIPART_CATS.forEach(function (cat, idx) {
    var tab = document.createElement('button');
    tab.className = 'cfg-clipart-tab' + (idx === 0 ? ' is-active' : '');
    tab.type = 'button';
    tab.textContent = cat.label;
    tab.addEventListener('click', function () {
      tabsWrap.querySelectorAll('.cfg-clipart-tab').forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      searchInput.value = '';
      renderIds(cat.ids);
    });
    tabsWrap.appendChild(tab);
  });

  renderIds(CLIPART_CATS[0].ids);
};

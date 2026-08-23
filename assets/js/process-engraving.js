(function () {
  var root = document.querySelector("#process-engraving");
  if (!root) return;

  var frame = root.querySelector("[data-process-frame]");
  if (!frame) return;

  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var layout = root.querySelector(".process-layout");
  var swapWrap = root.querySelector("[data-process-swap]");
  var itemLabel = root.querySelector("[data-process-item]");
  var leadEl = root.querySelector("[data-process-lead]");
  var products = Array.prototype.slice.call(
    frame.querySelectorAll("[data-process-product]")
  );
  if (!track || !pin || products.length === 0) return;

  var COPY = {
    keychain: {
      item: "Ключодържател",
      lead: "Прецизно персонализиране върху дърво и други материали — надписът остава в материала, без мастило и без залепване."
    },
    freshener: {
      item: "Ароматизатор",
      lead: "Надписът седи в дървото на овала — траен, тънък и без лепило върху лицето."
    },
    pen: {
      item: "Химикалка",
      lead: "По бамбука остава чиста линия — името или логото влиза в материала."
    }
  };

  var lastId = null;
  var swapTimer = 0;

  function setCopy(id, instant) {
    var data = COPY[id];
    if (!data) return;
    if (instant || !swapWrap || lastId === null) {
      if (itemLabel) itemLabel.textContent = data.item;
      if (leadEl) leadEl.textContent = data.lead;
      lastId = id;
      return;
    }
    if (id === lastId) return;
    lastId = id;
    swapWrap.classList.remove("is-in");
    swapWrap.classList.add("is-out");
    window.clearTimeout(swapTimer);
    swapTimer = window.setTimeout(function () {
      if (itemLabel) itemLabel.textContent = data.item;
      if (leadEl) leadEl.textContent = data.lead;
      swapWrap.classList.remove("is-out");
      swapWrap.classList.add("is-in");
    }, 240);
  }

  function setActiveName(id, instant) {
    setCopy(id, instant);
    frame.setAttribute("data-active", id);
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    products.forEach(function (el, i) {
      el.style.setProperty("--process-reveal", i === 0 ? "1" : "0");
      el.classList.toggle("is-active", i === 0);
    });
    setActiveName(products[0].getAttribute("data-process-product"), true);
    if (layout) layout.classList.add("is-shown");
    return;
  }

  products.forEach(function (el) {
    el.style.setProperty("--process-reveal", "0");
  });

  function segmentState(p, index, count) {
    var start = index / count;
    var end = (index + 1) / count;
    var local = (p - start) / (end - start);
    var first = index === 0;
    var last = index === count - 1;
    var fadeInEnd = first ? 0 : 0.12;
    var fadeOutStart = last ? 1 : 0.88;

    var visibility = 0;
    if (local >= 0 && local < fadeInEnd) visibility = local / fadeInEnd;
    else if (local >= fadeInEnd && local < fadeOutStart) visibility = 1;
    else if (local >= fadeOutStart && local < 1) visibility = (1 - local) / (1 - fadeOutStart);
    else if (last && local >= 1) visibility = 1;

    var revealStart = first ? 0 : fadeInEnd;
    var revealEnd = Math.min(0.82, fadeOutStart);
    var reveal = 0;
    if (local <= revealStart) reveal = 0;
    else if (local >= revealEnd) reveal = 1;
    else reveal = (local - revealStart) / (revealEnd - revealStart);

    return { visibility: visibility, reveal: reveal, local: local };
  }

  function apply(progress) {
    var count = products.length;
    var bestId = products[0].getAttribute("data-process-product");
    var bestVis = -1;

    products.forEach(function (el, i) {
      var state = segmentState(progress, i, count);
      el.style.opacity = String(state.visibility);
      el.style.visibility = state.visibility > 0.02 ? "visible" : "hidden";
      el.classList.toggle("is-active", state.visibility > 0.5);
      el.style.setProperty("--process-reveal", String(state.reveal));

      var engraving = state.visibility > 0.7 && state.reveal > 0.08 && state.reveal < 0.96;
      el.classList.toggle("is-engraving", engraving);

      if (state.visibility >= bestVis) {
        bestVis = state.visibility;
        bestId = el.getAttribute("data-process-product");
      }
    });

    setActiveName(bestId, lastId === null);

    var sweeps = 10;
    var phase = (progress * count * sweeps) % 1;
    var x = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    frame.style.setProperty("--process-scan-x", x * 100 + "%");
  }

  function setup() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    var headerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-inner-h")
      ) || 72;

    apply(0);

    var tweenState = { p: 0 };
    gsap.to(tweenState, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: "top top+=" + headerH,
        end: function () {
          return "+=" + Math.max(1, track.offsetHeight - pin.offsetHeight);
        },
        scrub: 0.55,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          apply(self.progress);
        }
      }
    });
  }

  if (document.readyState === "complete") {
    setup();
  } else {
    window.addEventListener("load", setup);
  }
})();

(function () {
  var layouts = document.querySelectorAll(".process-layout");
  if (!layouts.length) return;

  function show(el) {
    el.classList.add("is-shown");
  }

  if (!("IntersectionObserver" in window)) {
    layouts.forEach(show);
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  layouts.forEach(function (el) {
    io.observe(el);
  });
})();

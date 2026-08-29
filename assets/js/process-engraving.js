(function () {
  var root = document.querySelector("#process-engraving");
  if (!root) return;

  var frame = root.querySelector("[data-process-frame]");
  if (!frame) return;

  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var layout = root.querySelector(".process-layout");
  var products = Array.prototype.slice.call(
    frame.querySelectorAll("[data-process-product]")
  );
  if (!track || !pin || products.length === 0) return;

  function setActiveName(id) {
    frame.setAttribute("data-active", id);
  }

  var chosen = products[Math.floor(Math.random() * products.length)];
  var chosenId = chosen.getAttribute("data-process-product");
  products.forEach(function (el) {
    var on = el === chosen;
    el.classList.toggle("is-active", on);
    el.style.opacity = on ? "1" : "0";
    el.style.visibility = on ? "visible" : "hidden";
    if (!on) el.setAttribute("hidden", "");
  });
  setActiveName(chosenId);
  products = [chosen];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    chosen.style.setProperty("--process-reveal", "1");
    if (layout) layout.classList.add("is-shown");
    return;
  }

  chosen.style.setProperty("--process-reveal", "0");

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

    setActiveName(bestId);

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

    function scrubRange() {
      var viewH = Math.max(1, window.innerHeight - headerH);
      var pinH = Math.min(pin.offsetHeight || 0, viewH);
      var travel = (track.offsetHeight || 0) - pinH;
      if (travel < 96) {
        return { start: "top 70%", end: "bottom 32%" };
      }
      return { start: "top top+=" + headerH, end: "+=" + Math.max(1, travel) };
    }

    var tweenState = { p: 0 };
    gsap.to(tweenState, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: function () {
          return scrubRange().start;
        },
        end: function () {
          return scrubRange().end;
        },
        scrub: 0.45,
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

  window.addEventListener("orientationchange", function () {
    if (typeof ScrollTrigger === "undefined") return;
    window.setTimeout(function () {
      ScrollTrigger.refresh();
    }, 280);
  });
})();

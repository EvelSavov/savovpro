(function () {
  var root = document.querySelector("#process-stickers");
  if (!root) return;

  var frame = root.querySelector("[data-sticker-frame]");
  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var cutSvg = root.querySelector(".process-sticker-cut");
  var layout = root.querySelector(".process-layout");
  var foil = root.querySelector(".process-vinyl-foil");
  if (!frame || !track || !pin || !cutSvg) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setHole() {
    if (!foil) return;
    var foilW = foil.offsetWidth;
    var foilH = foil.offsetHeight;
    if (!foilW || !foilH) return;
    var holeW = foilW * 0.86;
    var holeH = holeW * (429.25574 / 975.99323);
    frame.style.setProperty("--hole-w", holeW.toFixed(1) + "px");
    frame.style.setProperty("--hole-h", holeH.toFixed(1) + "px");
    frame.style.setProperty("--hole-x", ((foilW - holeW) / 2).toFixed(1) + "px");
    frame.style.setProperty("--hole-y", ((foilH - holeH) / 2).toFixed(1) + "px");
  }

  function setVars(unroll, fill, weed, lift, weedX, weedY) {
    frame.style.setProperty("--vinyl-unroll", String(unroll));
    frame.style.setProperty("--sticker-fill", String(fill));
    frame.style.setProperty("--sticker-weed", String(weed));
    frame.style.setProperty("--sticker-lift", lift.toFixed(1) + "px");
    frame.style.setProperty("--weed-x", (weedX || 0).toFixed(1) + "px");
    frame.style.setProperty("--weed-y", (weedY || 0).toFixed(1) + "px");
    setHole();
  }

  if (reduced) {
    setVars(1, 1, 1, 0);
    if (layout) layout.classList.add("is-shown");
    return;
  }

  setVars(0.42, 0, 0, 0);

  var NS = "http://www.w3.org/2000/svg";

  function buildCut(pathD) {
    var group = document.createElementNS(NS, "g");
    group.setAttribute("transform", "translate(-359.05523,-45.880921)");

    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", pathD);
    path.setAttribute("class", "process-sticker-cut-path");

    var blade = document.createElementNS(NS, "circle");
    blade.setAttribute("class", "process-sticker-blade");
    blade.setAttribute("r", "12");
    blade.setAttribute("cx", "0");
    blade.setAttribute("cy", "0");

    group.appendChild(path);
    group.appendChild(blade);
    cutSvg.appendChild(group);
    return { path: path, blade: blade };
  }

  function setup(path, blade) {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    var length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    function moveBlade(amount) {
      var drawn = Math.max(0, Math.min(1, amount));
      var point = path.getPointAtLength(drawn * length);
      blade.setAttribute("cx", String(point.x));
      blade.setAttribute("cy", String(point.y));
    }

    moveBlade(0);

    var headerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-inner-h")
      ) || 72;

    gsap.to({ p: 0 }, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: "top top+=" + headerH,
        end: function () {
          return "+=" + Math.max(1, track.offsetHeight - pin.offsetHeight);
        },
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          var unroll = 0.42 + 0.58 * Math.min(1, Math.max(0, p / 0.3));
          var cut = Math.min(1, Math.max(0, (p - 0.28) / 0.4));
          var fill = Math.min(1, Math.max(0, (p - 0.62) / 0.08));
          var weed = Math.min(1, Math.max(0, (p - 0.74) / 0.22));
          var lift = 0;
          var weedX = weed * frame.offsetWidth * 0.18;
          var weedY = -weed * frame.offsetHeight * 0.92;

          path.style.strokeDashoffset = String(length * (1 - cut));
          path.style.opacity = weed > 0.08 ? String(Math.max(0, 1 - (weed - 0.08) / 0.35)) : "1";
          setVars(unroll, fill, weed, lift, weedX, weedY);

          if (p > 0.28 && p < 0.7) {
            frame.classList.add("is-cutting");
          } else {
            frame.classList.remove("is-cutting");
          }
          if (fill > 0.12) {
            frame.classList.add("is-punched");
          } else {
            frame.classList.remove("is-punched");
          }
          if (weed > 0.02) {
            frame.classList.add("is-weeding");
          } else {
            frame.classList.remove("is-weeding");
          }
          if (weed > 0.94) {
            frame.classList.add("is-weeded");
          } else {
            frame.classList.remove("is-weeded");
          }
          moveBlade(cut);
        }
      }
    });
  }

  function start() {
    fetch("assets/logo/logo-vinyl.svg")
      .then(function (res) {
        return res.text();
      })
      .then(function (svgText) {
        var doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
        var src = doc.querySelector("path");
        if (!src) return;
        var parts = buildCut(src.getAttribute("d"));
        setup(parts.path, parts.blade);
      })
      .catch(function () {
        setVars(1, 1, 1, 0);
        if (layout) layout.classList.add("is-shown");
      });
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
})();

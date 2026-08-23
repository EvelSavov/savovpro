(function () {
  var root = document.querySelector("#process-stickers");
  if (!root) return;

  var frame = root.querySelector("[data-sticker-frame]");
  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var cutSvg = root.querySelector(".process-sticker-cut");
  var layout = root.querySelector(".process-layout");
  if (!frame || !track || !pin || !cutSvg) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    frame.style.setProperty("--sticker-fill", "1");
    frame.style.setProperty("--sticker-lift", "0px");
    if (layout) layout.classList.add("is-shown");
    return;
  }

  frame.style.setProperty("--sticker-fill", "0");
  frame.style.setProperty("--sticker-lift", "10px");

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
          var cut = Math.min(1, Math.max(0, (p - 0.06) / 0.56));
          var fill = Math.min(1, Math.max(0, (p - 0.38) / 0.36));
          var lift = 10 * (1 - fill);

          path.style.strokeDashoffset = String(length * (1 - cut));
          path.style.opacity = p > 0.78 ? String(Math.max(0, 1 - (p - 0.78) / 0.16)) : "1";
          frame.style.setProperty("--sticker-fill", String(fill));
          frame.style.setProperty("--sticker-lift", lift.toFixed(1) + "px");

          if (p > 0.05 && p < 0.82) {
            frame.classList.add("is-cutting");
          } else {
            frame.classList.remove("is-cutting");
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
        frame.style.setProperty("--sticker-fill", "1");
        frame.style.setProperty("--sticker-lift", "0px");
        if (layout) layout.classList.add("is-shown");
      });
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
})();

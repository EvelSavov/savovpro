(function () {
  var root = document.querySelector("#process-sublimation");
  if (!root) return;

  var frame = root.querySelector("[data-sub-frame]");
  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var layout = root.querySelector(".process-layout");
  if (!frame || !track || !pin) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    frame.style.setProperty("--sub-reveal", "1");
    if (layout) layout.classList.add("is-shown");
    return;
  }

  frame.style.setProperty("--sub-reveal", "0");

  function setup() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    var headerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-inner-h")
      ) || 72;

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
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          var draw = Math.min(1, p / 0.86);
          frame.style.setProperty("--sub-reveal", String(draw));

          var sweeps = 8;
          var phase = (draw * sweeps) % 1;
          var y = phase < 0.5 ? phase * 2 : 2 - phase * 2;
          frame.style.setProperty("--sub-scan-y", y * 100 + "%");

          if (draw > 0.06 && p < 0.9) {
            frame.classList.add("is-printing");
          } else {
            frame.classList.remove("is-printing");
          }
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

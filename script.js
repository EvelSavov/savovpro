(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = nav ? nav.querySelectorAll("a[href^=\"#\"]") : [];

  function setOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains("is-open"));
    });

    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 721px)").matches) setOpen(false);
  });

  var carousel = document.querySelector(".hero-carousel");
  if (carousel) {
    var slides = carousel.querySelectorAll(".hero-carousel-slide");
    var dotsWrap = carousel.querySelector(".hero-carousel-dots");
    var prevBtn = carousel.querySelector('[data-carousel-dir="prev"]');
    var nextBtn = carousel.querySelector('[data-carousel-dir="next"]');
    var total = slides.length;
    var index = 0;
    var timer = null;
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(step, absoluteIndex) {
      if (absoluteIndex !== undefined) {
        index = ((absoluteIndex % total) + total) % total;
      } else {
        index = ((index + step) % total + total) % total;
      }
      slides.forEach(function (slide, i) {
        var on = i === index;
        slide.classList.toggle("is-active", on);
        slide.setAttribute("aria-hidden", on ? "false" : "true");
      });
      var dots = dotsWrap ? dotsWrap.querySelectorAll(".hero-carousel-dot") : [];
      dots.forEach(function (dot, i) {
        var on = i === index;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-current", on ? "true" : "false");
      });
    }

    if (dotsWrap && total > 0) {
      for (var d = 0; d < total; d += 1) {
        (function (i) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "hero-carousel-dot" + (i === 0 ? " is-active" : "");
          dot.setAttribute("aria-label", "Снимка " + (i + 1) + " от " + total);
          dot.setAttribute("aria-current", i === 0 ? "true" : "false");
          dot.addEventListener("click", function () {
            go(0, i);
            restartAutoplay();
          });
          dotsWrap.appendChild(dot);
        })(d);
      }
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (prefersReduced || total <= 1) return;
      timer = setInterval(function () {
        go(1);
      }, 5500);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        go(-1);
        restartAutoplay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        go(1);
        restartAutoplay();
      });
    }

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", function () {
      if (!carousel.contains(document.activeElement)) startAutoplay();
    });

    startAutoplay();
  }

  var lightbox = document.getElementById("gallery-lightbox");
  if (lightbox) {
    var lightboxImg = lightbox.querySelector(".gallery-lightbox-img");
    var closeBtn = lightbox.querySelector(".gallery-lightbox-close");
    var prevBtn = lightbox.querySelector(".gallery-lightbox-prev");
    var nextBtn = lightbox.querySelector(".gallery-lightbox-next");
    var galleryLinks = Array.prototype.slice.call(document.querySelectorAll(".gallery-open"));
    var galleryIndex = 0;
    var showNav = galleryLinks.length > 1;

    function showGallerySlide(i) {
      if (!galleryLinks.length) return;
      galleryIndex = ((i % galleryLinks.length) + galleryLinks.length) % galleryLinks.length;
      var link = galleryLinks[galleryIndex];
      var thumb = link.querySelector("img");
      lightboxImg.src = link.getAttribute("href");
      lightboxImg.alt = thumb ? thumb.getAttribute("alt") || "" : "";
      if (prevBtn) prevBtn.hidden = !showNav;
      if (nextBtn) nextBtn.hidden = !showNav;
    }

    function openGallery(i) {
      showGallerySlide(i);
      if (typeof lightbox.showModal === "function") {
        lightbox.showModal();
      } else {
        lightbox.setAttribute("open", "");
      }
      document.body.classList.add("lightbox-open");
    }

    function isGalleryOpen() {
      return lightbox.open || lightbox.hasAttribute("open");
    }

    function closeGallery() {
      if (isGalleryOpen()) {
        if (typeof lightbox.close === "function") {
          lightbox.close();
        } else {
          lightbox.removeAttribute("open");
        }
      }
      document.body.classList.remove("lightbox-open");
      lightboxImg.removeAttribute("src");
    }

    galleryLinks.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        openGallery(i);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeGallery);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        showGallerySlide(galleryIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        showGallerySlide(galleryIndex + 1);
      });
    }

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeGallery();
    });

    lightbox.addEventListener("close", function () {
      document.body.classList.remove("lightbox-open");
      lightboxImg.removeAttribute("src");
    });

    lightbox.addEventListener("cancel", function (e) {
      e.preventDefault();
      closeGallery();
    });

    document.addEventListener("keydown", function (e) {
      if (!isGalleryOpen()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeGallery();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showGallerySlide(galleryIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showGallerySlide(galleryIndex + 1);
      }
    });
  }
})();

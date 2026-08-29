(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = nav ? nav.querySelectorAll("a[href^=\"#\"]") : [];

  function closeSubmenus() {
    document.querySelectorAll(".has-sub.is-open").forEach(function (item) {
      item.classList.remove("is-open");
      var btn = item.querySelector(".nav-sub-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function setOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
    if (!open) closeSubmenus();
  }

  document.querySelectorAll(".nav-sub-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var item = btn.closest(".has-sub");
      if (!item) return;
      var willOpen = !item.classList.contains("is-open");
      closeSubmenus();
      item.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  var navFile = (location.pathname.split("/").pop() || "").toLowerCase();
  if (navFile) {
    document.querySelectorAll(".nav-sub a, .footer-legal a").forEach(function (link) {
      var href = (link.getAttribute("href") || "").split("/").pop();
      if (href && href.toLowerCase() === navFile) {
        link.setAttribute("aria-current", "page");
      }
    });
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

  document.addEventListener("click", function (e) {
    if (e.target.closest(".has-sub")) return;
    closeSubmenus();
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setOpen(false);
      closeSubmenus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 721px)").matches) setOpen(false);
  });

  var GALLERY_TAGS = {
    engraving: true,
    sublimation: true,
    stickers: true,
    souvenirs: true,
    gifts: true,
    "3d": true,
    auto: true
  };

  var filterRoot = document.querySelector("[data-gallery-filters]");
  var galleryGrid = document.querySelector("[data-gallery-grid]");
  var galleryEmpty = document.querySelector("[data-gallery-empty]");
  var galleryCount = document.querySelector("[data-gallery-count]");
  var selectedGalleryTags = [];

  function isValidGalleryTag(tag) {
    return !!GALLERY_TAGS[String(tag || "").toLowerCase()];
  }

  function formatGalleryCount(n) {
    return n === 1 ? "1 продукт" : n + " продукта";
  }

  function collectGalleryTags(raw) {
    var tags = [];
    String(raw || "")
      .split(",")
      .forEach(function (part) {
        var tag = part.trim().toLowerCase().replace(/^tag=/, "");
        if (tag && tag !== "all" && isValidGalleryTag(tag) && tags.indexOf(tag) === -1) {
          tags.push(tag);
        }
      });
    return tags;
  }

  function parseGalleryTagsFromUrl() {
    var tags = [];
    try {
      var params = new URLSearchParams(window.location.search);
      var raw = params.getAll("tag");
      if (!raw.length) {
        var single = params.get("tag");
        if (single) raw = [single];
      }
      raw.forEach(function (value) {
        collectGalleryTags(value).forEach(function (tag) {
          if (tags.indexOf(tag) === -1) tags.push(tag);
        });
      });
      if (!tags.length) {
        collectGalleryTags((window.location.hash || "").replace(/^#/, "")).forEach(function (tag) {
          if (tags.indexOf(tag) === -1) tags.push(tag);
        });
      }
    } catch (err) {
      tags = [];
    }
    return tags;
  }

  function syncGalleryFilterUi() {
    if (!filterRoot) return;
    var hasSelection = selectedGalleryTags.length > 0;
    Array.prototype.forEach.call(filterRoot.querySelectorAll("[data-gallery-tag]"), function (btn) {
      var tag = btn.getAttribute("data-gallery-tag");
      var on = tag === "all" ? !hasSelection : selectedGalleryTags.indexOf(tag) !== -1;
      btn.classList.toggle("is-active", on);
      if (tag === "all") {
        if (on) btn.setAttribute("aria-current", "page");
        else btn.removeAttribute("aria-current");
      } else if (on) {
        btn.setAttribute("aria-current", "true");
      } else {
        btn.removeAttribute("aria-current");
      }
    });
  }

  function syncGalleryFilterUrl() {
    if (!window.history || typeof history.replaceState !== "function") return;
    var url = new URL(window.location.href);
    if (!selectedGalleryTags.length) url.searchParams.delete("tag");
    else url.searchParams.set("tag", selectedGalleryTags.join(","));
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }

  function applyGalleryFilters() {
    var items = galleryGrid
      ? galleryGrid.querySelectorAll(".gallery-item")
      : document.querySelectorAll(".gallery-item[data-tags]");
    var visible = 0;
    var hasSelection = selectedGalleryTags.length > 0;

    Array.prototype.forEach.call(items, function (item) {
      var tags = (item.getAttribute("data-tags") || "").trim().split(/\s+/);
      var show = !hasSelection;
      if (hasSelection) {
        for (var i = 0; i < selectedGalleryTags.length; i += 1) {
          if (tags.indexOf(selectedGalleryTags[i]) !== -1) {
            show = true;
            break;
          }
        }
      }
      item.hidden = !show;
      if (show) visible += 1;
    });

    if (galleryEmpty) galleryEmpty.hidden = visible > 0;
    if (galleryCount) {
      galleryCount.textContent = visible > 0 ? formatGalleryCount(visible) : "Няма снимки за избраните тагове";
    }

    syncGalleryFilterUi();
    syncGalleryFilterUrl();
  }

  function toggleGalleryTag(tag) {
    tag = String(tag || "").toLowerCase();
    if (tag === "all") {
      selectedGalleryTags = [];
      applyGalleryFilters();
      return;
    }
    if (!isValidGalleryTag(tag)) return;

    var index = selectedGalleryTags.indexOf(tag);
    if (index === -1) selectedGalleryTags.push(tag);
    else selectedGalleryTags.splice(index, 1);
    applyGalleryFilters();
  }

  if (filterRoot) {
    filterRoot.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-gallery-tag]");
      if (!btn || !filterRoot.contains(btn)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      toggleGalleryTag(btn.getAttribute("data-gallery-tag"));
    });

    if (galleryEmpty) {
      galleryEmpty.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-gallery-tag]");
        if (!btn) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
        e.preventDefault();
        toggleGalleryTag(btn.getAttribute("data-gallery-tag"));
      });
    }

    selectedGalleryTags = parseGalleryTagsFromUrl();
    applyGalleryFilters();
  }

  var lightbox = document.getElementById("gallery-lightbox");
  if (lightbox) {
    var lightboxImg = lightbox.querySelector(".gallery-lightbox-img");
    var closeBtn = lightbox.querySelector(".gallery-lightbox-close");
    var prevBtn = lightbox.querySelector(".gallery-lightbox-prev");
    var nextBtn = lightbox.querySelector(".gallery-lightbox-next");
    var galleryIndex = 0;

    function getGalleryLinks() {
      return Array.prototype.slice.call(document.querySelectorAll(".gallery-open")).filter(function (link) {
        var item = link.closest(".gallery-item");
        return !item || !item.hidden;
      });
    }

    function showGallerySlide(i) {
      var galleryLinks = getGalleryLinks();
      if (!galleryLinks.length) return;
      galleryIndex = ((i % galleryLinks.length) + galleryLinks.length) % galleryLinks.length;
      var link = galleryLinks[galleryIndex];
      var thumb = link.querySelector("img");
      lightboxImg.src = link.getAttribute("href");
      lightboxImg.alt = thumb ? thumb.getAttribute("alt") || "" : "";
      var showNav = galleryLinks.length > 1;
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

    document.addEventListener("click", function (e) {
      var link = e.target.closest(".gallery-open");
      if (!link) return;
      var item = link.closest(".gallery-item");
      if (item && item.hidden) return;
      var galleryLinks = getGalleryLinks();
      var i = galleryLinks.indexOf(link);
      if (i < 0) return;
      e.preventDefault();
      openGallery(i);
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

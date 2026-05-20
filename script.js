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

  var contactDialog = document.getElementById("contact-dialog");
  var contactForm = document.getElementById("contact-form");
  var contactSuccess = document.getElementById("contact-form-success");
  var contactStatus = document.getElementById("contact-form-status");
  var contactOpeners = document.querySelectorAll(".js-open-contact-form");
  var contactClosers = document.querySelectorAll("[data-close-contact]");
  var web3formsMeta = document.querySelector('meta[name="web3forms-access-key"]');
  var web3formsKey = web3formsMeta ? (web3formsMeta.getAttribute("content") || "").trim() : "";
  var contactAccessKeyHidden = document.getElementById("contact-form-access-key");
  var contactSubjectHidden = document.getElementById("contact-form-subject");
  var contactRedirectHidden = document.getElementById("contact-form-redirect");

  if (contactAccessKeyHidden && web3formsKey) {
    contactAccessKeyHidden.value = web3formsKey;
  }

  function buildContactReturnUrl() {
    var url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("contact", "sent");
    url.hash = window.location.hash || "contact";
    return url.toString();
  }

  function openContactDialogWithSuccess() {
    if (!contactDialog || typeof contactDialog.showModal !== "function") return;
    if (contactForm) contactForm.hidden = true;
    if (contactSuccess) contactSuccess.hidden = false;
    if (contactStatus) contactStatus.hidden = true;
    setOpen(false);
    contactDialog.showModal();
  }

  function showContactSubmitError(message) {
    if (contactStatus) {
      contactStatus.textContent =
        message ||
        "Изпращането не успя. Опитайте отново или пишете директно на info@savovpro.com.";
      contactStatus.classList.add("is-error");
      contactStatus.hidden = false;
    }
    var submitBtn = contactForm && contactForm.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  }

  function resetContactFormView() {
    if (!contactForm || !contactSuccess) return;
    contactForm.hidden = false;
    contactForm.reset();
    contactSuccess.hidden = true;
    if (contactStatus) {
      contactStatus.hidden = true;
      contactStatus.textContent = "";
      contactStatus.classList.remove("is-error");
    }
    var submitBtn = contactForm.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  }

  function openContactDialog() {
    if (!contactDialog || typeof contactDialog.showModal !== "function") return;
    resetContactFormView();
    setOpen(false);
    contactDialog.showModal();
    var firstField = contactForm && contactForm.querySelector("input:not([name='_honey'])");
    if (firstField) {
      window.setTimeout(function () {
        firstField.focus();
      }, 0);
    }
  }

  function closeContactDialog() {
    if (!contactDialog || !contactDialog.open) return;
    contactDialog.close();
  }

  contactOpeners.forEach(function (btn) {
    btn.addEventListener("click", openContactDialog);
  });

  contactClosers.forEach(function (btn) {
    btn.addEventListener("click", closeContactDialog);
  });

  if (contactDialog) {
    contactDialog.addEventListener("close", resetContactFormView);
    contactDialog.addEventListener("click", function (e) {
      if (e.target === contactDialog) closeContactDialog();
    });
  }

  if (new URLSearchParams(window.location.search).get("contact") === "sent") {
    openContactDialogWithSuccess();
    history.replaceState(null, "", window.location.pathname + (window.location.hash || "#contact"));
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var honey = contactForm.querySelector('[name="_honey"]');
      if (honey && honey.value.trim()) return;

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      var topic = contactForm.querySelector('[name="topic"]');
      var email = contactForm.querySelector('[name="email"]');
      var message = contactForm.querySelector('[name="message"]');

      if (!web3formsKey) {
        var topicVal = topic ? topic.value.trim() : "";
        var emailVal = email ? email.value.trim() : "";
        var messageVal = message ? message.value.trim() : "";
        var mailSubject = encodeURIComponent("[SAVOV PRO] " + (topicVal || "Запитване"));
        var mailBody = encodeURIComponent(
          "Имейл за обратна връзка: " + emailVal + "\n\n" + messageVal
        );
        window.location.href =
          "mailto:info@savovpro.com?subject=" + mailSubject + "&body=" + mailBody;
        closeContactDialog();
        contactForm.reset();
        return;
      }

      var submitBtn = contactForm.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
      }
      if (contactStatus) {
        contactStatus.hidden = true;
        contactStatus.classList.remove("is-error");
      }

      if (contactSubjectHidden) {
        contactSubjectHidden.value =
          "[SAVOV PRO] " + (topic ? topic.value.trim() : "Запитване");
      }
      if (contactRedirectHidden) {
        contactRedirectHidden.value = buildContactReturnUrl();
      }
      if (contactAccessKeyHidden) {
        contactAccessKeyHidden.value = web3formsKey;
      }

      HTMLFormElement.prototype.submit.call(contactForm);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (contactDialog && contactDialog.open) {
      closeContactDialog();
      return;
    }
    setOpen(false);
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
})();

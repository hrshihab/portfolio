/* ==========================================================================
   Habibur Rahman Shihab — Portfolio
   modern.js · shared interactions for every page (no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  // Run each feature in isolation so one failure never blocks the others.
  function safely(fn) {
    try {
      fn();
    } catch (error) {
      if (window.console) console.error(error);
    }
  }

  function onMediaChange(query, handler) {
    var mq = window.matchMedia(query);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  /* Scroll reveal ---------------------------------------------------------- */
  function initReveal() {
    var items = all("[data-reveal]");
    root.classList.add("reveal-ready");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries.filter(function (entry) {
          return entry.isIntersecting;
        });
        // Stagger elements that enter the viewport together.
        visible.forEach(function (entry, index) {
          var el = entry.target;
          var delay = el.dataset.delay ? Number(el.dataset.delay) : Math.min(index, 6) * 90;
          el.style.setProperty("--delay", delay + "ms");
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Header ----------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* Mobile navigation ------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      root.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!root.classList.contains("nav-open"));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && root.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    onMediaChange("(min-width: 961px)", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* Count-up numbers ------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = 1800;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = all("[data-count]");
    if (!counters.length || reduceMotion || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          animateCount(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      el.textContent = (el.dataset.prefix || "") + (0).toFixed(decimals) + (el.dataset.suffix || "");
      observer.observe(el);
    });
  }

  /* Marquee: clone groups so the loop is seamless at any width ------------- */
  function initMarquees() {
    all("[data-marquee]").forEach(function (marquee) {
      var track = marquee.querySelector(".marquee__track");
      var group = track && track.querySelector(".marquee__group");
      if (!group) return;

      var speed = Number(marquee.dataset.speed) || 70; // pixels per second
      var lastWidth = 0;

      function build() {
        var width = marquee.clientWidth;
        if (width === lastWidth) return;
        lastWidth = width;

        all("[data-clone]", track).forEach(function (clone) {
          clone.remove();
        });

        var groupWidth = group.getBoundingClientRect().width;
        if (!groupWidth) return;

        var copies = Math.max(1, Math.ceil(width / groupWidth));
        for (var i = 0; i < copies; i++) {
          var clone = group.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("data-clone", "");
          track.appendChild(clone);
        }

        track.style.setProperty("--marquee-shift", groupWidth + "px");
        track.style.setProperty("--marquee-duration", groupWidth / speed + "s");
      }

      build();

      // Web fonts change the measured width, so rebuild once they are ready.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          lastWidth = 0;
          build();
        });
      }

      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
      });
    });
  }

  /* Card spotlight follows the cursor -------------------------------------- */
  function initSpotlight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.addEventListener(
      "pointermove",
      function (event) {
        var card = event.target.closest && event.target.closest(".card");
        if (!card) return;
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", event.clientX - rect.left + "px");
        card.style.setProperty("--my", event.clientY - rect.top + "px");
      },
      { passive: true }
    );
  }

  /* Tabs (CV page) --------------------------------------------------------- */
  function initTabs() {
    all("[data-tabs]").forEach(function (tablist) {
      var tabs = all("[role='tab']", tablist);
      if (!tabs.length) return;

      function select(tab, updateHash) {
        tabs.forEach(function (item) {
          var active = item === tab;
          var panel = document.getElementById(item.getAttribute("aria-controls"));
          item.setAttribute("aria-selected", String(active));
          item.tabIndex = active ? 0 : -1;
          if (panel) panel.hidden = !active;
        });
        if (updateHash && window.history.replaceState) {
          window.history.replaceState(null, "", "#" + tab.dataset.tab);
        }
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
          select(tab, true);
        });

        tab.addEventListener("keydown", function (event) {
          var step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          var next = tabs[(index + step + tabs.length) % tabs.length];
          next.focus();
          select(next, true);
        });
      });

      var fromHash = tabs.filter(function (tab) {
        return "#" + tab.dataset.tab === window.location.hash;
      })[0];
      var initial = fromHash || tabs.filter(function (tab) {
        return tab.getAttribute("aria-selected") === "true";
      })[0] || tabs[0];

      select(initial, false);
    });
  }

  /* Collapsible CV contacts on small screens ------------------------------- */
  function initSidebarToggle() {
    all("[data-sidebar-toggle]").forEach(function (button) {
      var sidebar = button.closest(".cv-sidebar");
      var text = button.querySelector("[data-toggle-text]");
      if (!sidebar) return;

      button.addEventListener("click", function () {
        var open = sidebar.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(open));
        if (text) text.textContent = open ? "Hide Contacts" : "Show Contacts";
      });
    });
  }

  /* Contact form: submit in place, fall back to a normal post -------------- */
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form || !window.fetch || !window.FormData) return;

    var status = form.querySelector("[data-form-status]");
    var button = form.querySelector("[type='submit']");
    var label = button && button.querySelector("[data-label]");
    var idleLabel = label ? label.textContent : "";

    function setBusy(busy) {
      if (!button) return;
      button.disabled = busy;
      if (label) label.textContent = busy ? "Sending…" : idleLabel;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (status) status.hidden = true;
      setBusy(true);

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Form request failed: " + response.status);
          form.reset();
          setBusy(false);
          if (status) {
            status.classList.add("form-status--success");
            status.hidden = false;
          }
        })
        .catch(function () {
          // Let the browser post the form the classic way so the message still arrives.
          HTMLFormElement.prototype.submit.call(form);
        });
    });
  }

  /* Missing images become a styled placeholder ----------------------------- */
  function initMediaFallback() {
    all(".media img").forEach(function (img) {
      function markMissing() {
        var media = img.closest(".media");
        media.classList.add("media--missing");
        media.setAttribute("data-label", img.alt || "");
      }

      if (img.complete && img.naturalWidth === 0) markMissing();
      else img.addEventListener("error", markMissing);
    });
  }

  /* Small utilities -------------------------------------------------------- */
  function initUtilities() {
    var year = String(new Date().getFullYear());
    all("[data-year]").forEach(function (el) {
      el.textContent = year;
    });

    all("[data-print]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.print();
      });
    });
  }

  safely(initReveal);
  safely(initHeader);
  safely(initNav);
  safely(initCounters);
  safely(initMarquees);
  safely(initSpotlight);
  safely(initTabs);
  safely(initSidebarToggle);
  safely(initContactForm);
  safely(initMediaFallback);
  safely(initUtilities);
})();

/* Ember & Oak — interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav state ---------- */
  var nav = document.getElementById("siteNav");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
  }
  toggle.addEventListener("click", function () {
    setMenu(!document.body.classList.contains("menu-open"));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Animated stat counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    var dur = 1400, start = null;
    function frame(now) {
      if (!start) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObs.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Menu tabs + photo crossfade ---------- */
  var PHOTOS = {
    starters: {
      src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop",
      alt: "A seasonal starter, plated"
    },
    mains: {
      src: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop",
      alt: "Oak-fired meats resting on the board"
    },
    desserts: {
      src: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1000&auto=format&fit=crop",
      alt: "A burnt-honey dessert with berries"
    }
  };
  // Preload tab photos so the crossfade never flashes empty
  Object.keys(PHOTOS).forEach(function (k) {
    var im = new Image();
    im.src = PHOTOS[k].src;
  });

  var tabs = document.querySelectorAll(".tab");
  var photo = document.getElementById("menuPhoto");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      if (tab.classList.contains("active")) return;
      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      document.querySelectorAll(".menu-panel").forEach(function (panel) {
        var show = panel.id === "panel-" + tab.getAttribute("data-tab");
        panel.classList.toggle("active", show);
        panel.hidden = !show;
      });

      var key = tab.getAttribute("data-photo");
      var swap = function () {
        photo.src = PHOTOS[key].src;
        photo.alt = PHOTOS[key].alt;
        photo.classList.remove("fading");
      };
      if (reduceMotion) { swap(); return; }
      photo.classList.add("fading");
      setTimeout(swap, 320);
    });
  });

  /* ---------- Reservation form ---------- */
  var form = document.getElementById("reserveForm");
  var success = document.getElementById("reserveSuccess");
  var dateInput = document.getElementById("rDate");
  var today = new Date();
  var iso = today.toISOString().split("T")[0];
  dateInput.min = iso;
  dateInput.value = iso;

  var fields = {
    name: {
      input: document.getElementById("rName"),
      error: document.getElementById("err-name"),
      validate: function (v) {
        return v.trim().length >= 2 ? "" : "Please tell us your name.";
      }
    },
    email: {
      input: document.getElementById("rEmail"),
      error: document.getElementById("err-email"),
      validate: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email so we can confirm.";
      }
    },
    phone: {
      input: document.getElementById("rPhone"),
      error: document.getElementById("err-phone"),
      validate: function (v) {
        if (!v.trim()) return "";
        return /^[+\d][\d\s().-]{6,}$/.test(v.trim()) ? "" : "That phone number doesn't look right.";
      }
    },
    guests: {
      input: document.getElementById("rGuests"),
      error: document.getElementById("err-guests"),
      validate: function (v) { return v ? "" : "How many guests?"; }
    },
    date: {
      input: document.getElementById("rDate"),
      error: document.getElementById("err-date"),
      validate: function (v) {
        if (!v) return "Pick a date.";
        return v < iso ? "The date can't be in the past." : "";
      }
    },
    time: {
      input: document.getElementById("rTime"),
      error: document.getElementById("err-time"),
      validate: function (v) { return v ? "" : "Pick a time."; }
    }
  };

  function checkField(f) {
    var msg = f.validate(f.input.value);
    var wrap = f.input.closest(".field");
    f.error.textContent = msg;
    wrap.classList.toggle("invalid", !!msg);
    wrap.classList.toggle("valid", !msg && f.input.value.trim() !== "");
    f.input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  Object.keys(fields).forEach(function (key) {
    var f = fields[key];
    f.input.addEventListener("blur", function () { checkField(f); });
    f.input.addEventListener("input", function () {
      if (f.input.closest(".field").classList.contains("invalid")) checkField(f);
    });
    f.input.addEventListener("change", function () { checkField(f); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var firstBad = null;
    Object.keys(fields).forEach(function (key) {
      if (!checkField(fields[key])) {
        ok = false;
        if (!firstBad) firstBad = fields[key].input;
      }
    });
    if (!ok) {
      firstBad.focus();
      return;
    }
    var name = fields.name.input.value.trim().split(" ")[0];
    var guests = fields.guests.input.value;
    var date = new Date(fields.date.input.value + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric"
    });
    var time = fields.time.input.value;
    document.getElementById("successName").textContent = name;
    document.getElementById("successDetails").textContent =
      "Table for " + guests + " · " + date + " at " + time + ".";
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });

  document.getElementById("bookAnother").addEventListener("click", function () {
    form.reset();
    dateInput.value = iso;
    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      f.error.textContent = "";
      f.input.closest(".field").classList.remove("invalid", "valid");
      f.input.removeAttribute("aria-invalid");
    });
    success.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });
})();

/* ==========================================================================
   Matis Dembele — La fiche technique
   Modules JS vanilla :
     1. Intro guidée (overlay, une fois par session)
     2. Header, navigation mobile, barre de progression
     3. Apparitions au scroll (IntersectionObserver)
     4. Projets (rendu depuis assets/data/projects.json, filtres)
   ========================================================================== */

(function () {
  "use strict";

  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* 1. Intro guidée                                                     */
  /* ------------------------------------------------------------------ */

  var Intro = (function () {
    var el = document.getElementById("intro");
    var typedEl = document.getElementById("intro-typed");
    var LINE = "Matis Dembele — développeur full-stack. Dossier prêt à consulter.";
    var typingTimer = null;
    var alreadySeen = false;

    try { alreadySeen = sessionStorage.getItem("md-intro-vu") === "1"; } catch (e) { /* stockage indisponible */ }

    function typeLine(text) {
      var i = 0;
      typedEl.textContent = "";
      function step() {
        typedEl.textContent = text.slice(0, i);
        i += 1;
        if (i <= text.length) typingTimer = window.setTimeout(step, 30);
      }
      step();
    }

    function close() {
      if (!el || el.hidden) return;
      window.clearTimeout(typingTimer);
      el.classList.add("is-leaving");
      try { sessionStorage.setItem("md-intro-vu", "1"); } catch (e) { /* ignore */ }
      window.setTimeout(function () {
        el.hidden = true;
        document.body.style.overflow = "";
      }, 600);
      document.removeEventListener("keydown", onKey);
    }

    function onKey(ev) {
      if (ev.key === "Escape") close();
    }

    function open() {
      if (!el || alreadySeen) return;
      el.hidden = false;
      document.body.style.overflow = "hidden";
      if (REDUCED_MOTION) {
        typedEl.textContent = LINE;
      } else {
        typeLine(LINE);
      }
      document.addEventListener("keydown", onKey);
      var enter = document.getElementById("intro-enter");
      var skip = document.getElementById("intro-skip");
      if (enter) { enter.addEventListener("click", close); enter.focus(); }
      if (skip) skip.addEventListener("click", close);
      el.addEventListener("click", function (ev) {
        if (ev.target === el) close();
      });
    }

    return { open: open };
  })();

  /* ------------------------------------------------------------------ */
  /* 2. Header, navigation mobile, progression                          */
  /* ------------------------------------------------------------------ */

  var Header = (function () {
    var header = document.getElementById("site-header");
    var burger = document.getElementById("nav-burger");
    var nav = document.getElementById("site-nav");
    var progress = document.getElementById("scroll-progress");
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 24);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        progress.style.width = (ratio * 100).toFixed(2) + "%";
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    function init() {
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });

      if (burger && nav) {
        burger.addEventListener("click", function () {
          var open = nav.classList.toggle("is-open");
          burger.setAttribute("aria-expanded", String(open));
          burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
        });
        nav.addEventListener("click", function (ev) {
          if (ev.target.tagName === "A") {
            nav.classList.remove("is-open");
            burger.setAttribute("aria-expanded", "false");
          }
        });
      }
    }

    return { init: init };
  })();

  /* ------------------------------------------------------------------ */
  /* 3. Apparitions au scroll                                            */
  /* ------------------------------------------------------------------ */

  var Reveals = (function () {
    var observer = null;

    function show(el) { el.classList.add("is-visible"); }

    function observe(el) {
      if (REDUCED_MOTION || !("IntersectionObserver" in window)) {
        show(el);
        return;
      }
      if (!observer) {
        observer = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              show(entries[i].target);
              observer.unobserve(entries[i].target);
            }
          }
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      }
      observer.observe(el);
    }

    function init() {
      var nodes = document.querySelectorAll(".reveal");
      for (var i = 0; i < nodes.length; i++) observe(nodes[i]);
    }

    return { init: init, observe: observe };
  })();

  /* ------------------------------------------------------------------ */
  /* 4. Projets                                                          */
  /* ------------------------------------------------------------------ */

  var Projects = (function () {
    var grid = document.getElementById("projects-grid");
    var filtersEl = document.getElementById("project-filters");
    var emptyEl = document.getElementById("projects-empty");
    var errorEl = document.getElementById("projects-error");

    var data = null;
    var activeFilter = "all";

    var MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

    function formatDate(iso) {
      if (!iso) return "";
      var parts = iso.split("-");
      var m = parseInt(parts[1], 10);
      return (MONTHS[m - 1] || "") + " " + parts[0];
    }

    function el(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }

    function buildFramebar(split) {
      if (!split) return null;
      var wrap = el("div", "framebar");
      var track = el("div", "framebar__track");
      var defs = [
        { key: "front", cls: "is-front", label: "Front" },
        { key: "back", cls: "is-back", label: "Back" },
        { key: "data", cls: "is-data", label: "Données" }
      ];
      var legend = el("div", "framebar__legend");
      for (var i = 0; i < defs.length; i++) {
        var pct = split[defs[i].key] || 0;
        if (pct <= 0) continue;
        var seg = el("i", defs[i].cls);
        seg.style.width = pct + "%";
        track.appendChild(seg);
        legend.appendChild(el("span", defs[i].cls, defs[i].label + " " + pct + " %"));
      }
      wrap.appendChild(track);
      wrap.appendChild(legend);
      return wrap;
    }

    function buildShots(shots) {
      if (!shots || !shots.length) return null;
      var wrap = el("figure", "proj__shots");
      for (var i = 0; i < shots.length; i++) {
        var shot = shots[i];
        var a = el("a", "proj__shot");
        a.href = shot.src;
        a.target = "_blank";
        a.rel = "noreferrer";
        var img = el("img");
        img.src = shot.src;
        img.alt = shot.alt || "";
        img.loading = "lazy";
        img.decoding = "async";
        a.appendChild(img);
        if (shot.caption) a.appendChild(el("span", "proj__shot-cap mono", shot.caption));
        wrap.appendChild(a);
      }
      return wrap;
    }

    function buildCard(project) {
      var card = el("article", "proj" + (project.featured ? " proj--featured" : ""));

      var meta = el("div", "proj__meta");
      var ctx = (project.context || "") + (project.date ? " · " + formatDate(project.date) : "");
      meta.appendChild(el("span", "proj__context mono", ctx));
      if (project.status) meta.appendChild(el("span", "proj__status mono", project.status));
      card.appendChild(meta);

      card.appendChild(el("h3", "proj__title", project.title || ""));
      card.appendChild(el("p", "proj__desc", project.description || ""));

      var shots = buildShots(project.shots);
      if (shots) card.appendChild(shots);
      else if (project.note) card.appendChild(el("p", "proj__note mono", project.note));

      if (project.highlights && project.highlights.length) {
        var points = el("ul", "proj__points");
        for (var i = 0; i < project.highlights.length; i++) {
          points.appendChild(el("li", null, project.highlights[i]));
        }
        card.appendChild(points);
      }

      var bar = buildFramebar(project.split);
      if (bar) card.appendChild(bar);

      if (project.tags && project.tags.length) {
        var tags = el("ul", "proj__tags");
        for (var j = 0; j < project.tags.length; j++) {
          tags.appendChild(el("li", null, project.tags[j]));
        }
        card.appendChild(tags);
      }

      var links = project.links || {};
      var linkDefs = [
        { href: links.demo, label: "Voir en ligne" },
        { href: links.repo, label: "Dépôt GitHub" },
        { href: links.fiche, label: "Fiche E5 (PDF)" }
      ];
      var linksWrap = el("div", "proj__links");
      var hasLink = false;
      for (var k = 0; k < linkDefs.length; k++) {
        if (!linkDefs[k].href) continue;
        hasLink = true;
        var a = el("a", null, linkDefs[k].label);
        a.href = linkDefs[k].href;
        a.target = "_blank";
        a.rel = "noreferrer";
        linksWrap.appendChild(a);
      }
      if (hasLink) card.appendChild(linksWrap);

      return card;
    }

    function render() {
      if (!grid || !data) return;
      grid.textContent = "";

      var shown = 0;
      var list = (data.projects || []).slice().sort(function (a, b) {
        if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
        return (b.date || "").localeCompare(a.date || "");
      });

      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var cats = p.categories || [];
        if (activeFilter !== "all" && cats.indexOf(activeFilter) === -1) continue;
        var card = buildCard(p);
        card.classList.add("reveal");
        grid.appendChild(card);
        window.requestAnimationFrame(function (c) {
          return function () { c.classList.add("is-visible"); };
        }(card));
        shown += 1;
      }

      if (emptyEl) emptyEl.hidden = shown !== 0;
      renderFilters();
    }

    function renderFilters() {
      if (!filtersEl || !data) return;
      filtersEl.textContent = "";
      var cats = data.categories || [];
      for (var i = 0; i < cats.length; i++) {
        (function (cat) {
          var btn = el("button", "filters__btn" + (activeFilter === cat.id ? " is-active" : ""), cat.label);
          btn.type = "button";
          btn.setAttribute("aria-pressed", String(activeFilter === cat.id));
          btn.addEventListener("click", function () {
            activeFilter = cat.id;
            render();
          });
          filtersEl.appendChild(btn);
        })(cats[i]);
      }
    }

    function init() {
      if (!grid) return;
      fetch("assets/data/projects.json")
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (json) {
          data = json;
          render();
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
        });
    }

    return { init: init };
  })();

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    Header.init();
    Reveals.init();
    Projects.init();
    Intro.open();
  });
})();

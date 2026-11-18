(function () {
  "use strict";

  const PROJECTS = window.PORTFOLIO_PROJECTS || [];
  const YEARS = ["2026", "2025", "2024", "2023", "2022"];

  let currentCategory = "all";
  let currentProject = null;
  let lightboxImages = [];
  let lightboxIndex = 0;

  const els = {
    projectsView: document.getElementById("projectsView"),
    projectsContainer: document.getElementById("projectsContainer"),
    projectsHeading: document.getElementById("projectsHeading"),
    detailView: document.getElementById("detailView"),
    detailBackBtn: document.getElementById("detailBackBtn"),
    detailTitle: document.getElementById("detailTitle"),
    detailYear: document.getElementById("detailYear"),
    detailStatus: document.getElementById("detailStatus"),
    detailSpecs: document.getElementById("detailSpecs"),
    detailNotes: document.getElementById("detailNotes"),
    detailGallery: document.getElementById("detailGallery"),
    detailImageCount: document.getElementById("detailImageCount"),
    profileView: document.getElementById("profileView"),
    profileHeading: document.getElementById("profileHeading"),
    contactView: document.getElementById("contactView"),
    contactHeading: document.getElementById("contactHeading"),
    categoryBar: document.getElementById("categoryBar"),
    categoryMenu: document.getElementById("categoryMenu"),
    projectCount: document.getElementById("projectCount"),
    navProjects: document.getElementById("nav-projects"),
    navProfile: document.getElementById("nav-profile"),
    navContact: document.getElementById("nav-contact"),
    themeToggle: document.getElementById("themeToggle"),
    lightbox: document.getElementById("lightbox"),
    lightboxImg: document.getElementById("lightboxImg"),
    lightboxCaption: document.getElementById("lightboxCaption"),
    lightboxIndex: document.getElementById("lightboxIndex"),
    lightboxPrev: document.getElementById("lightboxPrev"),
    lightboxNext: document.getElementById("lightboxNext")
  };

  /* --------------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------------- */

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function runWithViewTransition(updateDom, onFinished) {
    if (!document.startViewTransition || prefersReducedMotion()) {
      updateDom();
      if (onFinished) onFinished();
      return;
    }
    const transition = document.startViewTransition(updateDom);
    if (onFinished) {
      transition.finished.finally(onFinished);
    }
  }

  function makePlaceholderDataUri(title) {
    const safeTitle = String(title)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
      <rect width="960" height="540" fill="#f2f1ec"/>
      <rect x="32" y="32" width="896" height="476" fill="none" stroke="#d8d6ce" stroke-width="1"/>
      <text x="480" y="276" text-anchor="middle" fill="#777671" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="400">${safeTitle}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function getCandidateUrls(imgEntry) {
    if (typeof imgEntry === "string") {
      return [imgEntry];
    }
    const folder = imgEntry.localFolder;
    const n = imgEntry.index;
    const pad = String(n).padStart(2, "0");
    const rawPaths = [
      `${folder}/${n}.jpg`,
      `${folder}/${n}.png`,
      `${folder}/${n}.JPG`,
      `${folder}/${n}.PNG`,
      `${folder}/${n}.jpeg`,
      `${folder}/${pad}.jpg`,
      `${folder}/${pad}.png`,
      `images/${folder}/${n}.jpg`,
      `images/${folder}/${n}.png`,
      `images/${folder}/${pad}.jpg`,
      `images/${folder}/${pad}.png`
    ];
    return rawPaths.map((p) => encodeURI(p));
  }

  function createProjectImage(imgEntry, altText, titleForFallback, options) {
    const opts = options || {};
    const img = document.createElement("img");
    const candidates = getCandidateUrls(imgEntry);
    let attempt = 0;

    img.alt = altText;
    img.decoding = "async";

    if (opts.highPriority) {
      img.setAttribute("fetchpriority", "high");
    } else if (opts.lazy !== false) {
      img.loading = "lazy";
    }

    img.addEventListener("error", function () {
      attempt += 1;
      if (attempt < candidates.length) {
        img.src = candidates[attempt];
      } else {
        img.src = makePlaceholderDataUri(titleForFallback);
      }
    });

    img.src = candidates[0];
    return img;
  }

  function getStatusTone(status) {
    const s = String(status || "").toLowerCase();
    if (s.includes("prize")) return "prize";
    if (s.includes("completed")) return "completed";
    return "progress";
  }

  function parseSpecLine(line) {
    const idx = line.indexOf(":");
    if (idx === -1) {
      return { label: "Note", value: line.trim() };
    }
    return {
      label: line.slice(0, idx).trim(),
      value: line.slice(idx + 1).trim()
    };
  }

  /* --------------------------------------------------------------------------
     Theme Management
     -------------------------------------------------------------------------- */

  function getEffectiveTheme() {
    const explicit = document.documentElement.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyStoredTheme() {
    try {
      const saved = localStorage.getItem("portfolio-theme");
      if (saved === "dark" || saved === "light") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch (_) {
      // Ignore storage errors under restricted file:// contexts
    }
  }

  function toggleTheme() {
    const next = getEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch (_) {
      // Ignore storage errors
    }
  }

  /* --------------------------------------------------------------------------
     Rendering: Projects List
     -------------------------------------------------------------------------- */

  function updateCategoryButtons() {
    const buttons = els.categoryMenu.querySelectorAll("button[data-cat]");
    buttons.forEach((btn) => {
      const active = btn.dataset.cat === currentCategory;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function renderProjectsList() {
    els.projectsContainer.innerHTML = "";
    let totalVisible = 0;
    let renderedCount = 0;

    YEARS.forEach((yr) => {
      const items = PROJECTS.filter((p) => {
        const matchYear = p.year === yr;
        const matchCat = currentCategory === "all" || p.category.includes(currentCategory);
        return matchYear && matchCat;
      });

      if (items.length === 0) return;
      totalVisible += items.length;

      const section = document.createElement("section");
      section.className = "year-section";
      section.setAttribute("aria-label", `${yr}년 프로젝트`);

      const heading = document.createElement("h2");
      heading.className = "year-heading";
      heading.textContent = yr;

      const grid = document.createElement("div");
      grid.className = "year-projects-grid";

      items.forEach((p) => {
        const article = document.createElement("article");
        article.className = "project-item";

        const link = document.createElement("a");
        link.className = "project-card-link";
        link.href = `#/project/${encodeURIComponent(p.slug)}`;
        link.dataset.slug = p.slug;

        const thumbWrap = document.createElement("div");
        thumbWrap.className = "project-thumb-wrap";

        if (p.images && p.images.length > 0) {
          const isFirst = renderedCount === 0;
          const isAboveFold = renderedCount < 3;
          const img = createProjectImage(p.images[0], p.title, p.title, {
            highPriority: isFirst,
            lazy: !isAboveFold
          });
          thumbWrap.appendChild(img);
        } else {
          const img = document.createElement("img");
          img.src = makePlaceholderDataUri(p.title);
          img.alt = p.title;
          thumbWrap.appendChild(img);
        }

        const meta = document.createElement("div");
        meta.className = "project-meta";

        const titleEl = document.createElement("div");
        titleEl.className = "project-item-title";
        titleEl.textContent = p.title;

        const statusEl = document.createElement("span");
        statusEl.className = "project-item-status";
        statusEl.textContent = p.status;

        meta.appendChild(titleEl);
        meta.appendChild(statusEl);

        link.appendChild(thumbWrap);
        link.appendChild(meta);
        article.appendChild(link);
        grid.appendChild(article);

        renderedCount += 1;
      });

      section.appendChild(heading);
      section.appendChild(grid);
      els.projectsContainer.appendChild(section);
    });

    els.projectCount.textContent = `${totalVisible} works`;
    updateCategoryButtons();
  }

  /* --------------------------------------------------------------------------
     Rendering: Project Detail
     -------------------------------------------------------------------------- */

  function renderProjectDetail(project) {
    currentProject = project;
    document.title = `${project.title} | Wonsik Lee`;

    els.detailYear.textContent = project.year;
    els.detailTitle.textContent = project.title;
    els.detailStatus.textContent = project.status;
    els.detailStatus.setAttribute("data-tone", getStatusTone(project.status));

    els.detailSpecs.innerHTML = "";
    (project.specs || []).forEach((line) => {
      const parsed = parseSpecLine(line);
      const row = document.createElement("div");
      row.className = "detail-spec-row";

      const dt = document.createElement("dt");
      dt.textContent = parsed.label;

      const dd = document.createElement("dd");
      dd.textContent = parsed.value;

      row.appendChild(dt);
      row.appendChild(dd);
      els.detailSpecs.appendChild(row);
    });

    els.detailNotes.innerHTML = "";
    (project.notes || []).forEach((note) => {
      const div = document.createElement("div");
      div.textContent = note;
      els.detailNotes.appendChild(div);
    });

    const images = project.images || [];
    els.detailImageCount.textContent = `${images.length} plates`;
    els.detailGallery.innerHTML = "";
    lightboxImages = [];

    images.forEach((imgEntry, idx) => {
      const fig = document.createElement("figure");
      fig.className = "gallery-figure";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-trigger";
      btn.setAttribute("aria-label", `${project.title} 이미지 ${idx + 1} 크게 보기`);

      const img = createProjectImage(imgEntry, `${project.title} — ${idx + 1}`, project.title, {
        highPriority: idx === 0,
        lazy: idx >= 2
      });

      if (idx === 0) {
        btn.style.viewTransitionName = "active-thumb";
      }

      btn.addEventListener("click", () => openLightbox(idx));
      btn.appendChild(img);
      fig.appendChild(btn);
      els.detailGallery.appendChild(fig);

      lightboxImages.push({
        entry: imgEntry,
        imgEl: img,
        caption: `${project.title} — ${idx + 1}`
      });
    });
  }

  /* --------------------------------------------------------------------------
     View Switching & Routing
     -------------------------------------------------------------------------- */

  function setNavActive(activeKey) {
    els.navProjects.classList.toggle("active", activeKey === "projects");
    els.navProfile.classList.toggle("active", activeKey === "profile");
    els.navContact.classList.toggle("active", activeKey === "contact");
    els.categoryBar.hidden = activeKey !== "projects";
  }

  function showOnlyView(viewEl) {
    els.projectsView.hidden = viewEl !== els.projectsView;
    els.detailView.hidden = viewEl !== els.detailView;
    els.profileView.hidden = viewEl !== els.profileView;
    els.contactView.hidden = viewEl !== els.contactView;
  }

  function clearTransitionNames() {
    document.querySelectorAll("[data-vt-active]").forEach((el) => {
      el.style.viewTransitionName = "";
      el.removeAttribute("data-vt-active");
    });
  }

  function navigateToRoute(hash) {
    const raw = (hash || "#/projects").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const section = parts[0] || "projects";

    if (section === "project" && parts[1]) {
      const slug = decodeURIComponent(parts.slice(1).join("/"));
      const project = PROJECTS.find((p) => p.slug === slug);
      if (project) {
        const clickedThumb = document.querySelector(`.project-card-link[data-slug="${CSS.escape(slug)}"] .project-thumb-wrap`);
        if (clickedThumb) {
          clearTransitionNames();
          clickedThumb.style.viewTransitionName = "active-thumb";
          clickedThumb.setAttribute("data-vt-active", "true");
        }

        runWithViewTransition(
          () => {
            setNavActive("detail");
            renderProjectDetail(project);
            showOnlyView(els.detailView);
            window.scrollTo({ top: 0, behavior: "instant" });
          },
          () => {
            clearTransitionNames();
            els.detailTitle.focus({ preventScroll: true });
          }
        );
        return;
      }
    }

    if (section === "profile") {
      runWithViewTransition(
        () => {
          document.title = "Profile | Wonsik Lee";
          setNavActive("profile");
          showOnlyView(els.profileView);
          window.scrollTo({ top: 0, behavior: "instant" });
        },
        () => {
          els.profileHeading.focus({ preventScroll: true });
        }
      );
      return;
    }

    if (section === "contact") {
      runWithViewTransition(
        () => {
          document.title = "Contact | Wonsik Lee";
          setNavActive("contact");
          showOnlyView(els.contactView);
          window.scrollTo({ top: 0, behavior: "instant" });
        },
        () => {
          els.contactHeading.focus({ preventScroll: true });
        }
      );
      return;
    }

    // Default: Projects list
    if (section === "projects" && parts[1]) {
      currentCategory = decodeURIComponent(parts[1]);
    }

    runWithViewTransition(
      () => {
        document.title = "Projects | Wonsik Lee";
        setNavActive("projects");
        renderProjectsList();
        showOnlyView(els.projectsView);
      },
      () => {
        clearTransitionNames();
      }
    );
  }

  /* --------------------------------------------------------------------------
     Native <dialog> Lightbox
     -------------------------------------------------------------------------- */

  function updateLightboxContent() {
    const item = lightboxImages[lightboxIndex];
    if (!item) return;

    const currentSrc = item.imgEl ? item.imgEl.currentSrc || item.imgEl.src : "";
    els.lightboxImg.src = currentSrc || getCandidateUrls(item.entry)[0];
    els.lightboxImg.alt = item.caption;
    els.lightboxCaption.textContent = item.caption;
    els.lightboxIndex.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;

    const hasMultiple = lightboxImages.length > 1;
    els.lightboxPrev.hidden = !hasMultiple;
    els.lightboxNext.hidden = !hasMultiple;
  }

  function openLightbox(index) {
    if (!lightboxImages.length) return;
    lightboxIndex = index;
    updateLightboxContent();
    if (!els.lightbox.open) {
      els.lightbox.showModal();
    }
  }

  function stepLightbox(delta) {
    if (lightboxImages.length <= 1) return;
    lightboxIndex = (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length;
    updateLightboxContent();
  }

  function setupLightbox() {
    els.lightboxPrev.addEventListener("click", () => stepLightbox(-1));
    els.lightboxNext.addEventListener("click", () => stepLightbox(1));

    els.lightbox.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepLightbox(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepLightbox(1);
      }
    });

    els.lightbox.addEventListener("close", () => {
      els.lightbox.returnValue = "";
    });

    // Fallback for browsers without <dialog closedby="any"> (e.g., Safari)
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const isOutside = (e, dialog) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      els.lightbox.addEventListener("pointerdown", (e) => {
        pressedOutside = isOutside(e, els.lightbox);
      });
      els.lightbox.addEventListener("pointerup", (e) => {
        if (pressedOutside && isOutside(e, els.lightbox)) {
          els.lightbox.close();
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     Event Listeners & Init
     -------------------------------------------------------------------------- */

  function init() {
    applyStoredTheme();
    setupLightbox();

    els.themeToggle.addEventListener("click", toggleTheme);

    els.categoryMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      currentCategory = btn.dataset.cat;
      const targetHash = currentCategory === "all" ? "#/projects" : `#/projects/${currentCategory}`;
      if (window.location.hash === targetHash) {
        navigateToRoute(targetHash);
      } else {
        window.location.hash = targetHash;
      }
    });

    els.detailBackBtn.addEventListener("click", () => {
      const targetHash = currentCategory === "all" ? "#/projects" : `#/projects/${currentCategory}`;
      window.location.hash = targetHash;
    });

    window.addEventListener("hashchange", () => {
      navigateToRoute(window.location.hash);
    });

    navigateToRoute(window.location.hash || "#/projects");
  }

  init();
})();

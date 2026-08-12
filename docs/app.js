(function () {
  const C = window.HVR_CONTENT;
  const STORAGE_KEY = "hvr-lab-progress-v1";

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }
  let progress = loadProgress();

  function esc(s) {
    return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  // ---------- Overview ----------
  function renderOverview() {
    const o = C.overview;
    const highlights = o.highlights.map(h => `
      <div class="card">
        <h3>${esc(h.title)}</h3>
        <p class="subtle">${h.body}</p>
      </div>`).join("");
    return `
      <h2>${esc(o.heading)}</h2>
      <p class="lede">${o.lede}</p>
      ${o.paragraphs.map(p => `<p>${p}</p>`).join("")}
      <div class="grid-2">${highlights}</div>
    `;
  }

  // ---------- Lesson Plan ----------
  function renderLessons() {
    const total = C.modules.length;
    const done = C.modules.filter(m => progress[m.id]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const modulesHtml = C.modules.map((m, i) => {
      const isDone = !!progress[m.id];
      const pills = m.concepts.map(c => `<span class="pill">${esc(c)}</span>`).join("");
      const steps = m.steps.map(s => `<li>${s}</li>`).join("");
      const commands = (m.commands || []).map(c => `<pre><code>${esc(c)}</code></pre>`).join("");
      return `
        <div class="module ${isDone ? "done" : ""}" data-id="${m.id}">
          <div class="module-head" onclick="HVRApp.toggleModule('${m.id}')">
            <span class="module-num">${String(i + 1).padStart(2, "0")}</span>
            <h3>${esc(m.title)}</h3>
            <span class="module-arrow">&#9656;</span>
          </div>
          <div class="module-body">
            <div class="concepts-row">${pills}</div>
            <p>${m.objective}</p>
            <ul class="steps">${steps}</ul>
            ${commands}
            <div class="module-check" onclick="event.stopPropagation(); HVRApp.toggleDone('${m.id}')" title="Mark complete">${isDone ? "&#10003;" : ""}</div>
            <span class="subtle" style="margin-left:8px; font-size:13px;">${isDone ? "Completed" : "Mark this module complete"}</span>
          </div>
        </div>`;
    }).join("");

    return `
      <h2>Lesson Plan</h2>
      <p class="lede">${C.lessonsIntro}</p>
      <div class="progress-label">${done} / ${total} modules complete</div>
      <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
      ${modulesHtml}
    `;
  }

  // ---------- Architecture ----------
  function renderArchitecture() {
    const a = C.architecture;
    return `
      <h2>${esc(a.heading)}</h2>
      <p class="lede">${a.lede}</p>
      <div class="arch-svg-wrap">${a.diagramSvg}</div>
      ${a.sections.map(s => `<h3>${esc(s.title)}</h3><p>${s.body}</p>`).join("")}
    `;
  }

  // ---------- Local Lab ----------
  function renderLab() {
    const l = C.lab;
    const prereqs = l.prerequisites.map(p => `<li>${p}</li>`).join("");
    const quickstart = l.quickstart.map(q => `<pre><code>${esc(q)}</code></pre>`).join("");
    return `
      <h2>${esc(l.heading)}</h2>
      <p class="lede">${l.lede}</p>
      <div class="callout warn"><strong>Note.</strong> ${l.macNote}</div>
      <h3>Prerequisites</h3>
      <ul class="steps">${prereqs}</ul>
      <h3>Quickstart</h3>
      ${quickstart}
      <h3>What's running</h3>
      <table class="ref">
        <tr><th>Service</th><th>Role</th><th>Access</th></tr>
        ${l.services.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.role)}</td><td><code>${esc(s.access)}</code></td></tr>`).join("")}
      </table>
      <h3>Troubleshooting</h3>
      <ul class="steps">${l.troubleshooting.map(t => `<li>${t}</li>`).join("")}</ul>
    `;
  }

  // ---------- Glossary ----------
  function renderGlossary() {
    const terms = C.glossary.map(g => `
      <div class="gterm">
        <dt>${esc(g.term)}</dt>
        <dd>${g.def}</dd>
      </div>`).join("");
    return `
      <h2>Glossary</h2>
      <p class="lede">The vocabulary HVR's docs assume you already know. Bookmark this tab.</p>
      <div class="glossary-grid">${terms}</div>
    `;
  }

  const RENDERERS = {
    overview: renderOverview,
    lessons: renderLessons,
    architecture: renderArchitecture,
    lab: renderLab,
    glossary: renderGlossary,
  };

  function renderView(name) {
    const el = document.getElementById("view-" + name);
    if (el && !el.dataset.rendered) {
      el.innerHTML = RENDERERS[name]();
      el.dataset.rendered = "1";
    } else if (el && (name === "lessons")) {
      // lessons view has mutable progress state; always re-render on entry
      el.innerHTML = RENDERERS[name]();
    }
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".tabs a").forEach(a => a.classList.remove("active"));
    const el = document.getElementById("view-" + name);
    const tab = document.querySelector(`.tabs a[data-view="${name}"]`);
    if (el) { renderView(name); el.classList.add("active"); }
    if (tab) tab.classList.add("active");
    history.replaceState(null, "", "#" + name);
  }

  window.HVRApp = {
    toggleModule(id) {
      const mod = document.querySelector(`.module[data-id="${id}"]`);
      if (mod) mod.classList.toggle("open");
    },
    toggleDone(id) {
      progress[id] = !progress[id];
      saveProgress(progress);
      const el = document.getElementById("view-lessons");
      el.dataset.rendered = "";
      renderView("lessons");
      // keep the module the user was looking at open after re-render
      const mod = document.querySelector(`.module[data-id="${id}"]`);
      if (mod) mod.classList.add("open");
    },
  };

  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-view]");
    if (!a) return;
    e.preventDefault();
    showView(a.dataset.view);
  });

  const initial = (location.hash || "#overview").slice(1);
  showView(RENDERERS[initial] ? initial : "overview");

  // Simple masthead diagram: source -> hub -> target, three boxes and two arrows.
  document.getElementById("masthead-diagram").innerHTML = `
    <svg viewBox="0 0 220 70" width="220" height="70" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="22" width="56" height="26" rx="4" fill="none" stroke="#58d6c4" stroke-width="1.4"/>
      <text x="30" y="39" font-size="9" fill="#58d6c4" text-anchor="middle" font-family="IBM Plex Mono, monospace">SOURCE</text>
      <rect x="82" y="14" width="56" height="42" rx="4" fill="none" stroke="#e8a35c" stroke-width="1.4"/>
      <text x="110" y="39" font-size="9" fill="#e8a35c" text-anchor="middle" font-family="IBM Plex Mono, monospace">HUB</text>
      <rect x="162" y="22" width="56" height="26" rx="4" fill="none" stroke="#58d6c4" stroke-width="1.4"/>
      <text x="190" y="39" font-size="9" fill="#58d6c4" text-anchor="middle" font-family="IBM Plex Mono, monospace">TARGET</text>
      <line x1="58" y1="35" x2="82" y2="35" stroke="#3d6068" stroke-width="1.4" marker-end="url(#arrow)"/>
      <line x1="138" y1="35" x2="162" y2="35" stroke="#3d6068" stroke-width="1.4" marker-end="url(#arrow)"/>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3d6068"/>
        </marker>
      </defs>
    </svg>`;
})();

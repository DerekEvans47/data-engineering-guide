/* ============================================================
   DATA ENGINEERING & AI PRACTITIONER'S GUIDE
   Shared JavaScript — guide.js
   Sidebar render, glossary, tooltips, responsive behavior
============================================================ */

/* ============================================================
   TABLE OF CONTENTS
   Add new sections here — sidebar auto-updates everywhere
============================================================ */
const TOC = [
  { id: 'part1', label: 'Part 1 · Data Platform Foundation', sections: [
    { id: '1.1', label: 'The Modern Data Stack',   file: '01-data-platform-foundation/1-1-modern-data-stack.html' },
    { id: '1.2', label: 'Medallion Architecture',  file: '01-data-platform-foundation/1-2-medallion-architecture.html' },
    { id: '1.3', label: 'Azure Data Lake Storage', file: '01-data-platform-foundation/1-3-adls.html' },
    { id: '1.4', label: 'Azure Data Factory',      file: '01-data-platform-foundation/1-4-adf.html' },
    { id: '1.5', label: 'Data Mesh',               file: '01-data-platform-foundation/1-5-data-mesh.html' },
  ]},
  { id: 'part2', label: 'Part 2 · Data Fundamentals', sections: [
    { id: '2.1', label: 'CTEs',               file: '02-data-fundamentals/2-1-ctes.html' },
    { id: '2.2', label: 'Partitions',         file: '02-data-fundamentals/2-2-partitions.html' },
    { id: '2.3', label: 'Data Terminology',   file: '02-data-fundamentals/2-3-data-terminology.html' },
    { id: '2.4', label: 'Glossary',           file: '02-data-fundamentals/2-4-glossary.html' },
  ]},
  { id: 'part3', label: 'Part 3 · Compute & Transform', sections: [
    { id: '3.1', label: 'YAML & Config Languages',   file: '03-compute-and-transformation/3-1-yaml.html' },
    { id: '3.2', label: 'Advanced SQL',              file: '03-compute-and-transformation/3-2-advanced-sql.html' },
    { id: '3.3', label: 'Python for Data',           file: '03-compute-and-transformation/3-3-python.html' },
    { id: '3.4', label: 'Spark & Databricks',        file: '03-compute-and-transformation/3-4-spark-databricks.html' },
    { id: '3.5', label: 'PySpark',                   file: '03-compute-and-transformation/3-5-pyspark.html' },
    { id: '3.6', label: 'Delta Lake & File Formats', file: '03-compute-and-transformation/3-6-delta-lake.html' },
    { id: '3.7', label: 'dbt',                       file: '03-compute-and-transformation/3-7-dbt.html' },
  ]},
  { id: 'part4', label: 'Part 4 · Analytics & Visualization', sections: [
    { id: '4.1', label: 'Dimensional Modeling', file: '04-analytics-and-visualisation/4-1-dimensional-modeling.html' },
    { id: '4.2', label: 'SCDs Types 0–7',       file: '04-analytics-and-visualisation/4-2-slowly-changing-dimensions.html' },
    { id: '4.3', label: 'Power BI',             file: '04-analytics-and-visualisation/4-3-power-bi.html' },
    { id: '4.4', label: 'DAX',                  file: '04-analytics-and-visualisation/4-4-dax.html' },
  ]},
  { id: 'part5', label: 'Part 5 · Delivery & Leadership', sections: [
    { id: '5.1', label: 'Agile for Data Teams',      file: '05-delivery-and-leadership/5-1-agile.html' },
    { id: '5.2', label: 'Git & GitHub',              file: '05-delivery-and-leadership/5-2-git-github.html' },
    { id: '5.3', label: 'MVP-Driven Delivery',       file: '05-delivery-and-leadership/5-3-mvp-delivery.html' },
    { id: '5.4', label: 'DataOps & CI/CD',           file: '05-delivery-and-leadership/5-4-dataops-cicd.html' },
    { id: '5.5', label: 'Stakeholder Communication', file: '05-delivery-and-leadership/5-5-stakeholder-communication.html' },
    { id: '5.6', label: 'Change Management',         file: '05-delivery-and-leadership/5-6-change-management.html' },
  ]},
  { id: 'part6', label: 'Part 6 · AI & Agentic Systems', sections: [
    { id: '6.1', label: 'How LLMs Work',          file: '06-ai-and-agentic-systems/6-1-how-llms-work.html' },
    { id: '6.2', label: 'MCP',                    file: '06-ai-and-agentic-systems/6-2-mcp.html' },
    { id: '6.3', label: 'RAG',                    file: '06-ai-and-agentic-systems/6-3-rag.html' },
    { id: '6.4', label: 'AI Agents & Sub-Agents', file: '06-ai-and-agentic-systems/6-4-ai-agents.html' },
    { id: '6.5', label: 'Agentic Data Pipelines', file: '06-ai-and-agentic-systems/6-5-agentic-data-pipelines.html' },
    { id: '6.6', label: 'LLM Fine-Tuning vs. Prompting', file: '06-ai-and-agentic-systems/6-6-llm-fine-tuning-vs-prompting.html' },
    { id: '6.7', label: 'NLP Task Types in Practice', file: '06-ai-and-agentic-systems/6-7-nlp-task-types-practice.html' },
  ]},
  { id: 'part7', label: 'Part 7 · Product Management Fundamentals', sections: [
    { id: '7.1', label: 'User Stories & Roadmaps',       file: '07-product-management-fundamentals/7-1-user-stories-roadmaps.html' },
    { id: '7.2', label: 'Jira, Confluence & Figma',      file: '07-product-management-fundamentals/7-2-jira-confluence-figma.html' },
    { id: '7.3', label: 'UX Principles for Data Products', file: '07-product-management-fundamentals/7-3-ux-principles-data-products.html' },
    { id: '7.4', label: 'The Software Development Lifecycle', file: '07-product-management-fundamentals/7-4-software-development-lifecycle.html' },
  ]},
  { id: 'part8', label: 'Part 8 · Classical ML & Statistics', sections: [
    { id: '8.1', label: 'Regression & Classification',        file: '08-classical-ml-and-statistics/8-1-regression-classification.html' },
    { id: '8.2', label: 'Clustering & Unsupervised Learning', file: '08-classical-ml-and-statistics/8-2-clustering-unsupervised-learning.html' },
    { id: '8.3', label: 'Model Evaluation Metrics',           file: '08-classical-ml-and-statistics/8-3-model-evaluation-metrics.html' },
    { id: '8.4', label: 'A/B Testing & Hypothesis Testing',   file: '08-classical-ml-and-statistics/8-4-ab-testing-hypothesis-testing.html' },
    { id: '8.5', label: 'Deep Learning Basics',               file: '08-classical-ml-and-statistics/8-5-deep-learning-basics.html' },
  ]},
  { id: 'part9', label: 'Part 9 · Supply Chain Analytics', sections: [
    { id: '9.1', label: 'Demand Forecasting Basics', file: '09-supply-chain-analytics/9-1-demand-forecasting-basics.html' },
    { id: '9.2', label: 'Inventory Optimization',     file: '09-supply-chain-analytics/9-2-inventory-optimization.html' },
  ]},
  { id: 'partA', label: 'Appendix', sections: [
    { id: 'A', label: 'Free Tier Resources',   file: 'appendix/A-free-tier-resources.html' },
    { id: 'B', label: 'Quick Reference Cards', file: 'appendix/B-quick-reference-cards.html' },
    { id: 'C', label: 'Security Fundamentals', file: 'appendix/C-security-fundamentals.html' },
    { id: 'D', label: 'Interview Prep Guide',  file: 'appendix/D-interview-prep.html' },
  ]},
];

/* ============================================================
   GLOSSARY DATA
   Add terms as new sections are written
============================================================ */
/* ============================================================
   GLOSSARY DATA — loaded at runtime from the shared
   content/glossary.json (single source of truth; the flashcards
   app at learn/flashcards/ reads the same file). Terms are
   populated into the GLOSSARY object below; consumers must await
   GLOSSARY_READY before reading it.
============================================================ */
const GLOSSARY = {};
// Resolve content/glossary.json relative to THIS script's URL, so it works
// from any guide page regardless of folder depth.
const GLOSSARY_READY = (function () {
  let url = '../../content/glossary.json';
  try {
    const s = document.currentScript ||
      [].slice.call(document.querySelectorAll('script')).filter(function (el) {
        return /guide\.js(\?|$)/.test(el.src || '');
      }).pop();
    if (s && s.src) url = new URL('../../content/glossary.json', s.src).href;
  } catch (e) { /* fall back to the relative default */ }
  return fetch(url)
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      (data.terms || data).forEach(function (t) {
        if (t && t.term) GLOSSARY[t.term] = { short: t.short, full: t.full };
      });
      return GLOSSARY;
    })
    .catch(function () { return GLOSSARY; });
})();
// Absolute URL of the top-level learning hub (repo-root index.html), likewise
// resolved from this script's location for depth-independent sidebar links.
const HUB_URL = (function () {
  try {
    const s = document.currentScript ||
      [].slice.call(document.querySelectorAll('script')).filter(function (el) {
        return /guide\.js(\?|$)/.test(el.src || '');
      }).pop();
    if (s && s.src) return new URL('../../index.html', s.src).href;
  } catch (e) {}
  return '../../index.html';
})();
window.GLOSSARY = GLOSSARY;
window.GLOSSARY_READY = GLOSSARY_READY;

/* ============================================================
   SIDEBAR RENDER
   Called once per page load. Reads TOC and builds nav HTML.
============================================================ */
function renderSidebar(activeSectionId) {
  const container = document.getElementById('sidebarNav');
  if (!container) return;

  // Find which part contains the active section
  let activePartId = null;
  TOC.forEach(part => {
    part.sections.forEach(sec => {
      if (sec.id === activeSectionId) activePartId = part.id;
    });
  });

  const root = (window.GUIDE_ROOT || '');
  const _dm = document.body.classList.contains('dark-mode');
  let html = `<div class="dm-row"><button class="dm-btn" id="darkModeBtn" onclick="toggleDarkMode()"><span class="dm-icon">${_dm ? '&#9728;' : '&#9790;'}</span><span>${_dm ? 'Light mode' : 'Dark mode'}</span></button></div>`;
  html += `<a href="${HUB_URL}" class="nav-home">&#8592; All Learning</a>`;
  html += `<a href="${root}index.html" class="nav-home">&#8592; Cover Page</a>`;
  TOC.forEach(part => {
    const isActivePart = part.id === activePartId;
    html += `<div class="nav-part ${isActivePart ? 'open' : ''}" id="${part.id}">`;
    html += `<div class="nav-part-head" onclick="togglePart('${part.id}')">`;
    html += `<span class="part-label">${part.label}</span>`;
    html += `<span class="part-chevron">&#9658;</span>`;
    html += `</div><div class="nav-items">`;

    part.sections.forEach(sec => {
      if (sec.id === activeSectionId) {
        html += `<a href="#" class="nav-link active">${sec.id} &nbsp;${sec.label}</a>`;
      } else if (sec.file) {
        html += `<a href="${(typeof window.GUIDE_ROOT!=='undefined'?window.GUIDE_ROOT:'') + sec.file}" class="nav-link done">${sec.id} &nbsp;${sec.label} <span class="ck">&#10003;</span></a>`;
      } else {
        html += `<span class="nav-link locked">${sec.id} &nbsp;${sec.label} <span class="lk">&#128274;</span></span>`;
      }
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

/* ============================================================
   GLOSSARY — TOOLTIP & DEFINITION CARD
============================================================ */
// Auto-link glossary terms: wrap the FIRST occurrence of each glossary term in
// the article body so every section gets click-enabled definitions without hand-
// marking each term. Case-sensitive (matches the term's canonical casing, so it
// won't light up common lowercase words); first occurrence per page only; skips
// code, headings, links, and anything already hand-marked. No lookbehind — older
// iOS Safari lacks it.
function autoLinkGlossary() {
  const root = document.querySelector('article.content');
  if (!root || !GLOSSARY || !Object.keys(GLOSSARY).length) return;

  // Longest terms first so multi-word terms win over their substrings.
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

  // Never add a second link for a term already hand-marked on the page.
  const linked = new Set();
  document.querySelectorAll('[data-term]').forEach(el => linked.add(el.dataset.term));

  const SKIP_TAGS = new Set(['CODE','PRE','A','H1','H2','H3','H4','H5','H6','SCRIPT','STYLE','BUTTON','TEXTAREA','SVG']);
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // (leading non-word | start)(term)(optional plural s)(non-word ahead)
  const reCache = new Map();
  const reFor = t => {
    if (!reCache.has(t)) reCache.set(t, new RegExp('(^|[^A-Za-z0-9])(' + escapeRe(t) + ')(s?)(?![A-Za-z0-9])'));
    return reCache.get(t);
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let p = node.parentElement; p && p !== root.parentElement; p = p.parentElement) {
        // Never wrap inside SVG (diagram labels) — HTML spans are invalid there.
        // SVG element tagNames are lowercase, so match by namespace, not name.
        if (p.namespaceURI === 'http://www.w3.org/2000/svg') return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.hasAttribute && p.hasAttribute('data-term')) return NodeFilter.FILTER_REJECT;
        if (p.className && typeof p.className === 'string') {
          // Keep links in always-visible prose only: skip collapsible deep-dives
          // and never double-wrap an existing .kt/.df/.gloss-link term.
          if (/\bdeep-dive/.test(p.className)) return NodeFilter.FILTER_REJECT;
          if (/\b(kt|df|gloss-link)\b/.test(p.className)) return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);

  for (const node of nodes) {
    let remaining = node;
    while (remaining && remaining.nodeValue) {
      const text = remaining.nodeValue;
      let best = null; // { term, index, length }
      for (const t of terms) {
        if (linked.has(t)) continue;
        const m = reFor(t).exec(text);
        if (!m) continue;
        const idx = m.index + m[1].length;       // where the term itself starts
        const len = m[2].length;                 // term length (excludes plural s)
        if (best === null || idx < best.index || (idx === best.index && len > best.length)) {
          best = { term: t, index: idx, length: len };
        }
      }
      if (!best) break;
      const matched = remaining.splitText(best.index);
      matched.splitText(best.length);            // trim to just the term
      const span = document.createElement('span');
      span.className = 'gloss-link';
      span.setAttribute('data-term', best.term);
      matched.parentNode.insertBefore(span, matched);
      span.appendChild(matched);
      linked.add(best.term);
      remaining = span.nextSibling;              // continue scanning the remainder
    }
  }
}

function initGlossary() {
  const tooltip = document.getElementById('tooltip');
  const defCard = document.getElementById('def-card');
  const defTerm = document.getElementById('def-term');
  const defBody = document.getElementById('def-body');

  // Term definitions arrive asynchronously from content/glossary.json — auto-link
  // terms in the body, then bind the tooltip/definition-card handlers, once ready.
  GLOSSARY_READY.then(() => {
    autoLinkGlossary();
    document.querySelectorAll('[data-term]').forEach(el => {
      const term = el.dataset.term;
      const entry = GLOSSARY[term];
      if (!entry) return;

      el.addEventListener('mouseenter', e => {
        if (window.innerWidth <= 768) return;
        tooltip.textContent = entry.short;
        tooltip.style.display = 'block';
        positionTooltip(e);
      });
      el.addEventListener('mousemove', positionTooltip);
      el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

      el.addEventListener('click', e => {
        e.stopPropagation();
        tooltip.style.display = 'none';
        defTerm.textContent = term;
        defBody.textContent = entry.full;
        defCard.style.display = 'block';
      });
    });
  });

  function positionTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 55;
    tooltip.style.left = Math.min(x, window.innerWidth - 260) + 'px';
    tooltip.style.top  = Math.max(y, 8) + 'px';
  }

  document.addEventListener('click', () => { tooltip.style.display = 'none'; });

  const closeBtn = document.getElementById('defClose');
  if (closeBtn) closeBtn.addEventListener('click', () => { defCard.style.display = 'none'; });
}

/* ============================================================
   SIDEBAR — DESKTOP TOGGLE
============================================================ */
function toggleSidebar() {
  if (isMobile()) {
    openMobileSidebar();
    return;
  }
  const sidebar  = document.getElementById('sidebar');
  const mainWrap = document.getElementById('mainWrap');
  const btn      = document.getElementById('sidebarToggleBtn');
  sidebar.classList.toggle('collapsed');
  mainWrap.classList.toggle('expanded');
  if (btn) btn.textContent = sidebar.classList.contains('collapsed') ? '\u25B6' : '\u25C0';
}

/* ============================================================
   SIDEBAR — MOBILE OVERLAY
============================================================ */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebarOverlay').classList.add('visible');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn) menuBtn.style.display = 'none';
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) toggleBtn.textContent = '\u2715';
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn && isMobile()) menuBtn.style.display = 'flex';
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) toggleBtn.textContent = '\u25C0';
}

/* ============================================================
   NAV PART COLLAPSE / EXPAND
============================================================ */
function togglePart(partId) {
  const el = document.getElementById(partId);
  if (el) el.classList.toggle('open');
}

/* ============================================================
   UTILITY
============================================================ */
function isMobile() { return window.innerWidth <= 768; }

window.addEventListener('resize', function() {
  if (!isMobile()) closeMobileSidebar();
});

/* ============================================================
   INIT — called from each HTML file
   Usage: initGuide('1.1')  or  initGuide('6.3')  etc.
============================================================ */


/* ============================================================
   LEARNING CHECK — QUIZ ENGINE
============================================================ */
function initQuiz() {
  const quizSection = document.querySelector('.quiz-section');
  if (!quizSection) return;

  let totalCorrect = 0;
  let totalAnswered = 0;
  const totalQuestions = quizSection.querySelectorAll('.quiz-question').length;

  quizSection.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', () => {
      const question = option.closest('.quiz-question');
      if (question.dataset.answered) return;

      question.dataset.answered = 'true';
      totalAnswered++;

      const isCorrect = option.dataset.correct === 'true';
      const allOptions = question.querySelectorAll('.quiz-option');

      allOptions.forEach(o => o.classList.add('locked'));

      if (isCorrect) {
        option.classList.add('correct');
        totalCorrect++;
      } else {
        option.classList.add('incorrect');
        question.querySelector('[data-correct="true"]').classList.add('reveal');
      }

      const exp = question.querySelector('.quiz-explanation');
      if (exp) exp.classList.add('visible');

      const scoreEl = quizSection.querySelector('.quiz-score-num');
      if (scoreEl) scoreEl.textContent = totalCorrect + '/' + totalQuestions;

      if (totalAnswered === totalQuestions) {
        setTimeout(() => showFinalResult(quizSection, totalCorrect, totalQuestions), 600);
      }
    });
  });

  const retryBtn = quizSection.querySelector('.quiz-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => resetQuiz(quizSection));
  }
}

function showFinalResult(quizSection, correct, total) {
  const final = quizSection.querySelector('.quiz-final');
  if (!final) return;

  const scoreEl = final.querySelector('.quiz-final-score');
  const msgEl   = final.querySelector('.quiz-final-msg');

  if (scoreEl) {
    scoreEl.innerHTML = correct + '<span class="denom">/' + total + '</span>';
  }

  const msgs = {
    perfect:  "Perfect score — these concepts are locked in. Move to the next section.",
    strong:   "Strong result. A quick look at the one you missed and you're ready to continue.",
    solid:    "Solid foundation. Review the explanations for the ones you missed before moving on.",
    revisit:  "Consider revisiting this section before continuing — these concepts underpin everything that follows."
  };

  let msg = msgs.revisit;
  if (correct === total)       msg = msgs.perfect;
  else if (correct >= total-1) msg = msgs.strong;
  else if (correct >= total-2) msg = msgs.solid;

  if (msgEl) msgEl.textContent = msg;

  final.classList.add('visible');
  final.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetQuiz(quizSection) {
  quizSection.querySelectorAll('.quiz-question').forEach(q => {
    delete q.dataset.answered;
  });
  quizSection.querySelectorAll('.quiz-option').forEach(o => {
    o.classList.remove('correct', 'incorrect', 'reveal', 'locked');
  });
  quizSection.querySelectorAll('.quiz-explanation').forEach(e => {
    e.classList.remove('visible');
  });

  const total = quizSection.querySelectorAll('.quiz-question').length;
  const scoreEl = quizSection.querySelector('.quiz-score-num');
  if (scoreEl) scoreEl.textContent = '0/' + total;

  quizSection.querySelector('.quiz-final')?.classList.remove('visible');
  quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  initQuiz();
}

/* ============================================================
   SCROLL-TRIGGERED FIGURE REVEAL
============================================================ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const figObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        figObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-scroll-figure]').forEach(fig => {
    fig.style.opacity = '0';
    fig.style.transform = 'translateY(18px)';
    fig.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    figObserver.observe(fig);
  });

  const fig2 = document.querySelector('[data-build-fig2]');
  if (fig2) {
    const layers = Array.from(fig2.querySelectorAll('.diagram-layer'));
    layers.sort((a, b) => parseFloat(b.getAttribute('y') || 0) - parseFloat(a.getAttribute('y') || 0));
    layers.forEach(layer => {
      layer.style.opacity = '0';
      layer.style.transition = 'opacity 0.7s ease';
    });

    const buildObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          layers.forEach((layer, i) => {
            setTimeout(() => { layer.style.opacity = '1'; }, i * 380);
          });
          buildObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    buildObserver.observe(fig2);
  }
}

/* ============================================================
   DEEP-DIVE COLLAPSIBLE BOXES
============================================================ */
function initDeepDives() {
  document.querySelectorAll('.deep-dive-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const box = trigger.closest('.deep-dive');
      box.classList.toggle('open');
    });
  });
}

/* ============================================================
   SORTABLE TABLES
============================================================ */
function initSortableTables() {
  document.querySelectorAll('.data-table.sortable').forEach(table => {
    const headers = table.querySelectorAll('th');
    headers.forEach((th, colIdx) => {
      th.addEventListener('click', () => {
        const isAsc = th.dataset.dir !== 'asc';
        headers.forEach(h => { h.classList.remove('sort-asc', 'sort-desc'); delete h.dataset.dir; });
        th.dataset.dir = isAsc ? 'asc' : 'desc';
        th.classList.add(isAsc ? 'sort-asc' : 'sort-desc');

        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        rows.sort((a, b) => {
          const aVal = a.cells[colIdx] ? a.cells[colIdx].textContent.trim() : '';
          const bVal = b.cells[colIdx] ? b.cells[colIdx].textContent.trim() : '';
          return isAsc ? aVal.localeCompare(bVal, undefined, {numeric: true})
                       : bVal.localeCompare(aVal, undefined, {numeric: true});
        });
        rows.forEach(row => table.appendChild(row));
      });
    });
  });
}

/* ============================================================
   PROGRESS TRACKING
============================================================ */
function initProgressTracking() {
  const sectionId = document.body.dataset.section;
  if (!sectionId) return;

  const btn = document.getElementById('markReadBtn');
  if (!btn) return;

  try {
    const reads = JSON.parse(localStorage.getItem('guide-reads') || '{}');
    if (reads[sectionId]) _setReadUI(btn, true);
  } catch(e) {}

  btn.addEventListener('click', () => {
    try {
      const reads = JSON.parse(localStorage.getItem('guide-reads') || '{}');
      if (reads[sectionId]) {
        delete reads[sectionId];
        localStorage.setItem('guide-reads', JSON.stringify(reads));
        _setReadUI(btn, false);
      } else {
        reads[sectionId] = new Date().toISOString();
        localStorage.setItem('guide-reads', JSON.stringify(reads));
        _setReadUI(btn, true);
      }
    } catch(e) {}
  });
}

function _setReadUI(btn, isRead) {
  const icon = btn.querySelector('.read-icon');
  const label = btn.querySelector('.read-label');
  if (isRead) {
    btn.classList.add('read');
    if (icon)  icon.textContent = '\u2713';
    if (label) label.textContent = 'Section Read';
  } else {
    btn.classList.remove('read');
    if (icon)  icon.textContent = '\u25CB';
    if (label) label.textContent = 'Mark as Read';
  }
}

/* ============================================================
   COPY BUTTONS (for code blocks)
============================================================ */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-wrap')?.querySelector('code')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        btn.textContent = 'Error';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    });
  });
}

/* ============================================================
   DARK MODE
============================================================ */
function initDarkMode() {
  try {
    if (localStorage.getItem('guide-dark-mode') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  } catch(e) {}
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  try { localStorage.setItem('guide-dark-mode', isDark ? 'dark' : 'light'); } catch(e) {}
  const btn = document.getElementById('darkModeBtn');
  if (btn) btn.innerHTML = isDark
    ? '<span class="dm-icon">&#9728;</span><span>Light mode</span>'
    : '<span class="dm-icon">&#9790;</span><span>Dark mode</span>';
}

function initGuide(activeSectionId) {
  initDarkMode();
  renderSidebar(activeSectionId);
  initGlossary();
  initDeepDives();
  initSortableTables();
  initCopyButtons();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initScrollReveal();
      initQuiz();
      initProgressTracking();
    });
  } else {
    initScrollReveal();
    initQuiz();
    initProgressTracking();
  }

  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  const menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn) menuBtn.addEventListener('click', openMobileSidebar);

  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'sidebarToggleBtn') {
      toggleSidebar();
    }
  });
}

// Apply saved theme before first paint to prevent flash of light mode
(function() {
  try {
    if (localStorage.getItem('guide-dark-mode') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  } catch(e) {}
})();

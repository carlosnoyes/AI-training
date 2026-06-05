/**
 * Challenges page renderer.
 * Fetches challenges.json and dynamically builds the challenge cards.
 */
import {
    initPanels,
    initSolutionReveal,
    initScrollReveal,
    initActiveNav,
    initSmoothScroll,
    initProgress,
    initPrint,
    loadConcepts,
    getConceptById,
    initConceptPopups
} from './shared.js';

/* ── SVG icons for panels ── */
const ICONS = {
    hint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="10" r="6"/><path d="M10 16v2a2 2 0 004 0v-2M9 20h6" stroke-linecap="round"/><path d="M12 4V2M4 10H2M22 10h-2M6 4l1.5 1.5M18 4l-1.5 1.5" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4" stroke-linecap="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>',
    lockClosed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4" stroke-linecap="round"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 14l-2 2a3 3 0 004.24 0l2-2a3 3 0 000-4.24M14 10l2-2a3 3 0 00-4.24 0l-2 2a3 3 0 000 4.24" stroke-linecap="round"/></svg>',
    arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'
};

/* ── Render a single challenge card ── */
function renderChallenge(challenge) {
    const prompts = challenge.solution.prompts.map(p =>
        `<div class="solution-prompt"><span class="prompt-label">${escapeHtml(p.label)}</span>${escapeHtml(p.text)}</div>`
    ).join('');

    // Render concept tags with IDs — lookup concept name from loaded concepts
    const conceptTags = challenge.linkedConcepts.map(conceptId => {
        const concept = getConceptById(conceptId);
        const name = concept ? concept.name : conceptId;
        return `<span class="concept-tag" data-concept-id="${escapeHtml(conceptId)}">${escapeHtml(name)}</span>`;
    }).join('');

    return `
        <div class="challenge-card reveal" id="challenge-${challenge.id}">
            <label class="challenge-check" title="Mark as completed">
                <input type="checkbox" data-challenge="${challenge.id}" />
            </label>
            <div class="challenge-header">
                <svg class="challenge-icon"><use href="#icon-${challenge.icon}"/></svg>
                <div class="challenge-meta">
                    <div class="challenge-number">Challenge ${challenge.id}</div>
                    <h2 class="challenge-title">${escapeHtml(challenge.name)}</h2>
                </div>
                <span class="challenge-type-badge">${escapeHtml(challenge.type)}</span>
            </div>
            <div class="challenge-body">
                <p class="challenge-scenario">${challenge.scenario}</p>

                <div class="panel">
                    <button class="panel-toggle" aria-expanded="false">
                        ${ICONS.hint}
                        Hints
                        ${ICONS.arrow}
                    </button>
                    <div class="panel-content"><div class="panel-inner">
                        <p class="hint-text">${challenge.hints}</p>
                    </div></div>
                </div>

                <div class="panel solution-panel">
                    <button class="panel-toggle" aria-expanded="false">
                        ${ICONS.lock}
                        Solution
                        ${ICONS.arrow}
                    </button>
                    <div class="panel-content"><div class="panel-inner">
                        <div class="solution-locked">
                            ${ICONS.lockClosed}
                            Give it a try first — reveal when you're ready
                        </div>
                        <button class="solution-reveal-btn">Reveal Solution</button>
                        <div class="solution-content">
                            ${prompts}
                            <p class="solution-note">${challenge.solution.note}</p>
                        </div>
                    </div></div>
                </div>

                <div class="panel concepts-panel">
                    <button class="panel-toggle" aria-expanded="false">
                        ${ICONS.link}
                        Linked Concepts
                        ${ICONS.arrow}
                    </button>
                    <div class="panel-content"><div class="panel-inner">
                        ${conceptTags}
                    </div></div>
                </div>
            </div>
        </div>`;
}

/* ── Build nav links ── */
function buildNavLinks(navList, challenges) {
    navList.innerHTML = challenges.map(c =>
        `<li><a href="#challenge-${c.id}">${c.id} &mdash; ${escapeHtml(c.name)}</a></li>`
    ).join('');
}

/* ── Escape HTML ── */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ── Main init ── */
async function init() {
    const contentEl = document.getElementById('challenges-content');
    const navList = document.querySelector('.nav-list');

    if (!contentEl) return;

    // Load concepts first so we can render concept names
    await loadConcepts();

    // Fetch challenges data
    const response = await fetch('data/challenges.json');
    const challenges = await response.json();

    // Build nav
    if (navList) buildNavLinks(navList, challenges);

    // Render intro + challenges
    let html = `
        <div class="challenges-intro">
            <h2>AI Prompt <em>Challenges</em></h2>
            <p>Put your prompting skills to the test. Five real-world scenarios, each designed to practice the concepts from the lesson.</p>
            <div class="how-it-works">
                <strong>How it works:</strong> Read each scenario and try to solve it with AI on your own first. Use the <strong>Hints</strong> panel if you get stuck, check the <strong>Concepts</strong> to see which techniques apply, and reveal the <strong>Solution</strong> only after you've given it a real try. Mark challenges complete as you go.
            </div>
        </div>
        <div class="challenge-section">`;

    challenges.forEach(c => {
        html += renderChallenge(c);
    });

    html += `
        </div>
        <footer>
            <h2>Nice work.</h2>
            <p>Head back to the lesson to review the concepts, or try these challenges again with different scenarios.</p>
        </footer>`;

    contentEl.innerHTML = html;

    // Initialize behaviors
    initPanels(contentEl);
    initSolutionReveal(contentEl);
    initScrollReveal();
    initActiveNav('.nav-list');
    initSmoothScroll('.nav-list');
    initProgress('challenge_progress');
    initPrint();

    // Initialize clickable concept popups
    await initConceptPopups(contentEl);
}

init();

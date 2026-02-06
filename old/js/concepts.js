/**
 * Concepts page renderer.
 * Fetches concepts.json and dynamically builds the AI Techniques sections.
 */
import {
    initScrollReveal,
    initActiveNav,
    initSmoothScroll,
    initFlipCards,
    initPrint
} from './shared.js';

/* ── Section metadata: maps category names to IDs and section numbers ── */
const SECTIONS = [
    { category: 'General Tips',                    id: 'general',   number: 1 },
    { category: 'Context Packaging',               id: 'context',   number: 2 },
    { category: 'Output Formatting & Structure',   id: 'output',    number: 3 },
    { category: 'Iteration & Refinement',          id: 'iteration', number: 4 },
    { category: 'Maximum Intelligence',            id: 'thinking',  number: 5 },
    { category: 'Analysis',                        id: 'analysis',  number: 6 },
    { category: 'Prompt Library',                  id: 'prompts',   number: 7 },
    { category: 'Quality Control & Verification',  id: 'quality',   number: 8 },
    { category: 'Safety, Ethics & Confidentiality', id: 'ethics',   number: 9 }
];

/* ── Categories that use the "principles" layout (numbered list, no examples) ── */
const PRINCIPLE_CATEGORIES = [
    'Prompt Library',
    'Quality Control & Verification',
    'Safety, Ethics & Confidentiality'
];

/* ── Section-level tips ── */
const SECTION_TIPS = {
    'Iteration & Refinement': '<strong>The key insight:</strong> Great outputs rarely come from a single prompt. Break work into steps, iterate on drafts, and AI to critique itself.'
};

/* ── Render a single concept card ── */
function renderConceptCard(concept) {
    const exampleHtml = concept.example
        ? `<div class="concept-example">${escapeHtml(concept.example).replace(/\n/g, '<br>')}</div>`
        : '';

    return `
        <div class="concept-card reveal">
            <h3 class="concept-name">${escapeHtml(concept.name)}</h3>
            <p class="concept-description">${escapeHtml(concept.description).replace(/\n/g, '<br>')}</p>
            ${exampleHtml}
        </div>`;
}

/* ── Render a featured concept (bold style) ── */
function renderFeaturedConcept(concept) {
    const exampleHtml = concept.example
        ? `<div class="concept-example">${escapeHtml(concept.example).replace(/\n/g, '<br>')}</div>`
        : '';

    return `
        <div class="featured-concept reveal">
            <h3 class="concept-name">${escapeHtml(concept.name)}</h3>
            <p class="concept-description">${escapeHtml(concept.description).replace(/\n/g, '<br>')}</p>
            ${exampleHtml}
        </div>`;
}

/* ── Render a principle item (numbered list format) ── */
function renderPrincipleItem(concept, index) {
    return `
        <div class="principle-item">
            <span class="principle-number">${index + 1}</span>
            <div class="principle-content">
                <h3>${escapeHtml(concept.name)}</h3>
                <p>${escapeHtml(concept.description)}</p>
            </div>
        </div>`;
}

/* ── Render a full section ── */
function renderSection(sectionMeta, concepts) {
    const isPrinciple = PRINCIPLE_CATEGORIES.includes(sectionMeta.category);
    const tip = SECTION_TIPS[sectionMeta.category];

    const boldConcepts = concepts.filter(c => c.style === 'bold');
    const standardConcepts = concepts.filter(c => c.style !== 'bold');

    let bodyHtml = '';

    // Featured concepts first
    boldConcepts.forEach(c => {
        bodyHtml += renderFeaturedConcept(c);
    });

    // Tip callout if exists
    if (tip) {
        bodyHtml += `<div class="tip reveal"><p>${tip}</p></div>`;
    }

    if (isPrinciple) {
        // For principle sections, the first bold concept is rendered as featured above,
        // and the rest as a numbered principle list
        const principleList = standardConcepts.map((c, i) => renderPrincipleItem(c, i)).join('');
        bodyHtml += `<div class="principles reveal">${principleList}</div>`;
    } else {
        // Standard card grid
        const useGrid = standardConcepts.length > 0;
        if (useGrid) {
            const gridClass = standardConcepts.length >= 2 ? 'concepts-grid two-col' : 'concepts-grid';
            bodyHtml += `<div class="${gridClass}">`;
            standardConcepts.forEach(c => {
                bodyHtml += renderConceptCard(c);
            });
            bodyHtml += '</div>';
        }
    }

    return `
        <section id="${sectionMeta.id}">
            <div class="section-header reveal">
                <span class="section-number">${sectionMeta.number}</span>
                <h2 class="section-title">${escapeHtml(sectionMeta.category)}</h2>
            </div>
            ${bodyHtml}
        </section>`;
}

/* ── Build sidebar nav links ── */
function buildNavLinks(navList) {
    navList.innerHTML = SECTIONS.map(s =>
        `<li><a href="#${s.id}">${escapeHtml(s.category)}</a></li>`
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
    const contentEl = document.getElementById('concepts-content');
    const navList = document.querySelector('.nav-list');

    if (!contentEl) return;

    // Fetch concepts data
    const response = await fetch('data/concepts.json');
    const concepts = await response.json();

    // Group by category
    const grouped = new Map();
    concepts.forEach(c => {
        if (!grouped.has(c.category)) grouped.set(c.category, []);
        grouped.get(c.category).push(c);
    });

    // Build nav
    if (navList) buildNavLinks(navList);

    // Render sections
    let html = '';
    SECTIONS.forEach(sectionMeta => {
        const sectionConcepts = grouped.get(sectionMeta.category) || [];
        html += renderSection(sectionMeta, sectionConcepts);
    });

    html += `
        <footer>
            <h2>Ready to level up?</h2>
            <p>Start applying these techniques in your next AI conversation. Remember: AI skills compound over time.</p>
        </footer>`;

    contentEl.innerHTML = html;

    // Initialize behaviors
    initFlipCards('#concepts-content');
    initScrollReveal();
    initActiveNav('.nav-list');
    initSmoothScroll('.nav-list');
    initPrint();
}

init();

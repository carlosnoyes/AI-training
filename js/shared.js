/**
 * Shared utilities for AI Training pages.
 * Provides reusable behaviors: panels, scroll-reveal, solution reveal,
 * progress tracking, active nav highlighting, and flip cards.
 */

/* ── Expandable Panels ── */
export function initPanels(root = document) {
    root.querySelectorAll('.panel-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.closest('.panel');
            const isOpen = panel.classList.contains('open');
            panel.classList.toggle('open');
            btn.setAttribute('aria-expanded', !isOpen);
        });
    });
}

/* ── Solution Reveal Buttons ── */
export function initSolutionReveal(root = document) {
    root.querySelectorAll('.solution-reveal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = btn.nextElementSibling;
            content.classList.add('revealed');
            btn.style.display = 'none';
            btn.previousElementSibling.style.display = 'none';
        });
    });
}

/* ── Scroll-triggered Reveal ── */
export function initScrollReveal() {
    const reveal = () => {
        const wh = window.innerHeight;
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < wh - 80) {
                el.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', reveal, { passive: true });
    window.addEventListener('load', reveal);
    requestAnimationFrame(reveal);

    return reveal;
}

/* ── Active Nav Highlighting (scroll spy) ── */
export function initActiveNav(navSelector) {
    const list = document.querySelector(navSelector);
    if (!list) return;

    const update = () => {
        const links = Array.from(list.querySelectorAll('a[href^="#"]'));
        const ids = links.map(a => a.getAttribute('href').slice(1));
        const sections = ids.map(id => document.getElementById(id)).filter(Boolean);

        const offset = window.innerHeight * 0.3;
        let current = sections[0]?.id;

        sections.forEach(s => {
            const top = s.getBoundingClientRect().top + window.scrollY;
            if (window.scrollY + offset >= top) {
                current = s.id;
            }
        });

        links.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('load', update);
    requestAnimationFrame(update);
}

/* ── Smooth Scroll for Nav Links ── */
export function initSmoothScroll(navSelector) {
    document.querySelectorAll(`${navSelector} a[href^="#"]`).forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(a.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

/* ── Challenge Progress Tracking ── */
export function initProgress(storageKey = 'challenge_progress') {
    const checkboxes = document.querySelectorAll('.challenge-check input[type="checkbox"]');
    const progressFill = document.getElementById('progressFill');
    const progressCount = document.getElementById('progressCount');

    if (!checkboxes.length || !progressFill || !progressCount) return;

    const total = checkboxes.length;

    const update = () => {
        const done = document.querySelectorAll('.challenge-check input:checked').length;
        progressFill.style.width = (done / total * 100) + '%';
        progressCount.textContent = done + ' / ' + total;
    };

    const save = () => {
        const state = {};
        checkboxes.forEach(cb => { state[cb.dataset.challenge] = cb.checked; });
        try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch(e) {}
    };

    const load = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
            checkboxes.forEach(cb => {
                if (saved[cb.dataset.challenge]) cb.checked = true;
            });
        } catch(e) {}
        update();
    };

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => { save(); update(); });
    });

    load();
}

/* ── Flip Cards (for concept cards with examples) ── */
export function initFlipCards(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.querySelectorAll('.concept-card').forEach(card => {
        const example = card.querySelector('.concept-example');
        if (!example) return;

        const frontChildren = [];
        Array.from(card.children).forEach(child => {
            if (!child.classList.contains('concept-example')) frontChildren.push(child);
        });

        const front = document.createElement('div');
        front.className = 'flip-card-front';
        frontChildren.forEach(child => front.appendChild(child));

        const back = document.createElement('div');
        back.className = 'flip-card-back';
        const label = document.createElement('div');
        label.className = 'flip-label';
        label.textContent = 'Example';
        back.appendChild(label);
        back.appendChild(example);

        const inner = document.createElement('div');
        inner.className = 'flip-card-inner';
        inner.appendChild(front);
        inner.appendChild(back);

        card.innerHTML = '';
        card.appendChild(inner);
        card.classList.add('flip-card');

        card.addEventListener('click', () => card.classList.toggle('flipped'));
    });

    // Sync flip card heights
    const sync = () => {
        container.querySelectorAll('.flip-card .flip-card-inner').forEach(inner => {
            inner.style.minHeight = '';
        });

        const gridContainers = new Set();
        container.querySelectorAll('.flip-card').forEach(card => {
            gridContainers.add(card.parentElement);
        });

        gridContainers.forEach(grid => {
            const cards = grid.querySelectorAll('.flip-card');
            let maxHeight = 0;

            cards.forEach(card => {
                const front = card.querySelector('.flip-card-front');
                const back = card.querySelector('.flip-card-back');
                if (front && back) {
                    maxHeight = Math.max(maxHeight, front.scrollHeight, back.scrollHeight);
                }
            });

            cards.forEach(card => {
                const inner = card.querySelector('.flip-card-inner');
                if (inner) inner.style.minHeight = maxHeight + 'px';
            });
        });
    };

    requestAnimationFrame(sync);
    window.addEventListener('resize', sync);
}

/* ── Print: show all ── */
export function initPrint() {
    window.addEventListener('beforeprint', () => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    });
}

/* ── Concept Popup ── */
let conceptsData = null;
let conceptPopupEl = null;

export async function loadConcepts() {
    if (conceptsData) return conceptsData;
    const response = await fetch('data/concepts.json');
    conceptsData = await response.json();
    return conceptsData;
}

export function getConceptById(id) {
    if (!conceptsData) return null;
    return conceptsData.find(c => c.concept_id === id);
}

export function createConceptPopup() {
    if (conceptPopupEl) return conceptPopupEl;

    const overlay = document.createElement('div');
    overlay.className = 'concept-popup-overlay';
    overlay.innerHTML = `
        <div class="concept-popup">
            <button class="concept-popup-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            <div class="concept-popup-header">
                <div class="concept-popup-category"></div>
                <h3 class="concept-popup-name"></h3>
            </div>
            <div class="concept-popup-body">
                <p class="concept-popup-description"></p>
                <div class="concept-popup-example-wrapper"></div>
                <a href="ai-training.html" class="concept-popup-link">
                    View all concepts
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    conceptPopupEl = overlay;

    // Close handlers
    overlay.querySelector('.concept-popup-close').addEventListener('click', closeConceptPopup);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeConceptPopup();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            closeConceptPopup();
        }
    });

    return overlay;
}

export function showConceptPopup(concept) {
    if (!conceptPopupEl) createConceptPopup();

    const popup = conceptPopupEl.querySelector('.concept-popup');
    popup.querySelector('.concept-popup-category').textContent = concept.category;
    popup.querySelector('.concept-popup-name').textContent = concept.name;
    popup.querySelector('.concept-popup-description').textContent = concept.description;

    const exampleWrapper = popup.querySelector('.concept-popup-example-wrapper');
    if (concept.example && concept.example.trim()) {
        exampleWrapper.innerHTML = `
            <div class="concept-popup-example">
                <div class="concept-popup-example-label">Example</div>
                ${escapeHtml(concept.example)}
            </div>
        `;
    } else {
        exampleWrapper.innerHTML = '';
    }

    conceptPopupEl.classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeConceptPopup() {
    if (conceptPopupEl) {
        conceptPopupEl.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
}

export async function initConceptPopups(root = document) {
    await loadConcepts();
    createConceptPopup();

    root.querySelectorAll('.concept-tag[data-concept-id]').forEach(tag => {
        tag.addEventListener('click', () => {
            const concept = getConceptById(tag.dataset.conceptId);
            if (concept) showConceptPopup(concept);
        });
    });
}

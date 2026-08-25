/**
 * ISERI TOOL HUB - Portal Interaction Script (Pure JS / High Performance)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Clock
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockEl.textContent = `${hours}:${minutes}:${seconds}`;
        };
        setInterval(updateClock, 1000);
        updateClock();
    }

    // 2. Filter & Search Logic
    let currentCategory = 'all';
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('tool-search');
    const toolCards = document.querySelectorAll('.tool-card');
    const noResultsEl = document.getElementById('no-results');

    window.filterCategory = function(cat) {
        currentCategory = cat;

        filterButtons.forEach(btn => {
            if (btn.id === `btn-cat-${cat}`) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        applyFilters();
    };

    window.handleSearch = function() {
        applyFilters();
    };

    function applyFilters() {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        let visibleCount = 0;

        toolCards.forEach(card => {
            const categories = (card.getAttribute('data-categories') || '').split(' ');
            const titleText = (card.getAttribute('data-title') || '').toLowerCase();

            const matchCat = (currentCategory === 'all') || categories.includes(currentCategory);
            const matchQuery = !query || titleText.includes(query);

            if (matchCat && matchQuery) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noResultsEl) {
            if (visibleCount === 0) {
                noResultsEl.classList.add('visible');
            } else {
                noResultsEl.classList.remove('visible');
            }
        }
    }
});

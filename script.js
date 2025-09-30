document.addEventListener("DOMContentLoaded", function() {
    const navItems = document.querySelectorAll(".main-nav .nav-item");
    const contentSections = document.querySelectorAll(".content-section");
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    navItems.forEach(item => {
        item.addEventListener("click", function() {
            // Remove 'active' class from current active nav item and content section
            document.querySelector(".main-nav .nav-item.active").classList.remove("active");
            document.querySelector(".content-section.active").classList.remove("active");

            // Add 'active' class to clicked nav item
            this.classList.add("active");

            // Show corresponding content section
            const targetSectionId = this.getAttribute("data-section");
            document.getElementById(targetSectionId).classList.add("active");
        });
    });

    // --- Fuzzy Search simples ---
    const index = Array.from(contentSections).map(section => ({
        id: section.id,
        title: section.querySelector("h2") ? section.querySelector("h2").textContent : section.id,
        text: section.textContent
    }));

    function normalize(str) {
        return (str || "")
            .toLowerCase()
            .normalize("NFD").replace(/\p{Diacritic}+/gu, "");
    }

    function scoreMatch(query, text) {
        // Pontua por presença de termos, começa-com, e proximidade simples
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        if (!terms.length) return 0;
        const hay = normalize(text);
        let score = 0;
        for (const t of terms) {
            if (hay.includes(t)) score += 2;
            if (hay.startsWith(t)) score += 1;
        }
        return score;
    }

    function renderResults(matches) {
        if (!matches.length) {
            searchResults.classList.remove("show");
            searchResults.innerHTML = "";
            return;
        }
        searchResults.innerHTML = matches.slice(0, 8).map(m => (
            `<div class="result-item" role="option" data-target="${m.id}"><strong>${m.title}</strong></div>`
        )).join("");
        searchResults.classList.add("show");
        Array.from(searchResults.querySelectorAll('.result-item')).forEach(el => {
            el.addEventListener('click', () => {
                navigateTo(el.getAttribute('data-target'));
                searchResults.classList.remove("show");
            });
        });
    }

    function navigateTo(sectionId) {
        const targetItem = document.querySelector(`.main-nav .nav-item[data-section="${sectionId}"]`);
        if (targetItem) targetItem.click();
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    let debounceTimer;
    function handleSearchInput() {
        clearTimeout(debounceTimer);
        const q = searchInput.value.trim();
        if (!q) { searchResults.classList.remove("show"); searchResults.innerHTML = ""; return; }
        debounceTimer = setTimeout(() => {
            const matches = index
                .map(entry => ({ id: entry.id, title: entry.title, s: scoreMatch(q, entry.title + " " + entry.text) }))
                .filter(e => e.s > 0)
                .sort((a,b) => b.s - a.s);
            renderResults(matches);
        }, 120);
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = searchResults.querySelector('.result-item');
                if (first) {
                    navigateTo(first.getAttribute('data-target'));
                    searchResults.classList.remove('show');
                }
            }
            if (e.key === 'Escape') {
                searchResults.classList.remove('show');
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchResults.contains(e.target) && e.target !== searchInput) {
                searchResults.classList.remove('show');
            }
        });
    }
});

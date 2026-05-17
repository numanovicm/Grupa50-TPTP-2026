document.addEventListener('DOMContentLoaded', () => {
    const pageContainer = document.querySelector('.container');
    const themeButton = document.getElementById('drugaBoja');
    const bodyElement = document.body;

    function getBooks() {
        return Array.from(document.querySelectorAll('#knjige-grid article.kartice'));
    }

    function updateCount() {
        const books = getBooks();
        const visibleCount = books.filter(book => book.style.display !== 'none').length;
        const countElement = document.getElementById('book-count');
        if (countElement) {
            countElement.textContent = visibleCount;
        }
    }

    window.filterBooks = function(category) {
        const normalizedCategory = category.toString().toLowerCase();
        const searchValue = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
        const books = getBooks();
        books.forEach(book => {
            const bookCategory = book.dataset.category ? book.dataset.category.toLowerCase() : '';
            const title = book.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = book.querySelector('p')?.textContent.toLowerCase() || '';
            const matchesCategory = normalizedCategory === 'svi' || bookCategory === normalizedCategory;
            const matchesSearch = searchValue === '' || title.includes(searchValue) || description.includes(searchValue);
            book.style.display = matchesCategory && matchesSearch ? '' : 'none';
        });
        updateGenreLinkStyles(normalizedCategory);
        saveGenrePreference(normalizedCategory);
        updateCount();
        return false;
    };

    function savePreference(key, value) {
        try {
            setCookie(key, value, 365);
        } catch (e) {
            console.warn(`Could not save ${key} cookie:`, e);
        }
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`Could not save ${key} to localStorage:`, e);
        }
    }

    function getSavedPreference(key) {
        let value = getCookie(key);
        if (value) {
            return value;
        }
        try {
            value = localStorage.getItem(key);
        } catch (e) {
            console.warn(`Could not read ${key} from localStorage:`, e);
        }
        return value;
    }

    function saveGenrePreference(genre) {
        savePreference('selectedGenre', genre);
    }

    function getSavedGenrePreference() {
        return getSavedPreference('selectedGenre');
    }

    function updateGenreLinkStyles(selectedGenre) {
        const genreLinks = document.querySelectorAll('#sporedniNav a[data-genre]');
        genreLinks.forEach(link => {
            link.classList.toggle('active-genre', link.dataset.genre === selectedGenre);
        });
    }

    function getSelectedIndexGenre() {
        const activeLink = document.querySelector('#sporedniNav a[data-genre].active-genre');
        if (activeLink && activeLink.dataset.genre) {
            return activeLink.dataset.genre;
        }
        return getSavedGenrePreference() || 'svi';
    }

    function restoreSelectedGenre() {
        if (!document.querySelector('#knjige-grid')) {
            return;
        }
        const selectedGenre = getSavedGenrePreference() || 'svi';
        const genreLink = document.querySelector(`#sporedniNav a[data-genre="${selectedGenre}"]`);
        if (genreLink) {
            window.filterBooks(selectedGenre);
        } else {
            window.filterBooks('svi');
        }
    }

    function applyCatalogFilters() {
        const searchInput = document.getElementById('searchInput');
        const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedGenre = document.getElementById('genreFilter')?.value || 'svi';
        const rows = Array.from(document.querySelectorAll('#tabela-naslova tbody tr'));

        rows.forEach(row => {
            const title = row.cells[0]?.textContent.toLowerCase() || '';
            const author = row.cells[1]?.textContent.toLowerCase() || '';
            const status = row.cells[3]?.textContent.toLowerCase() || '';
            const rowGenre = (row.dataset.category || row.getAttribute('data-category') || '').toLowerCase();
            const matchesText = searchValue === '' || title.includes(searchValue) || author.includes(searchValue) || status.includes(searchValue);
            const matchesGenre = selectedGenre === 'svi' || rowGenre === selectedGenre;
            row.style.display = matchesText && matchesGenre ? '' : 'none';
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            return;
        }

        searchInput.addEventListener('input', () => {
            if (document.querySelector('#knjige-grid')) {
                const searchValue = searchInput.value.trim().toLowerCase();
                const selectedGenre = getSelectedIndexGenre();
                const books = getBooks();
                books.forEach(book => {
                    const bookCategory = book.dataset.category ? book.dataset.category.toLowerCase() : '';
                    const title = book.querySelector('h3')?.textContent.toLowerCase() || '';
                    const description = book.querySelector('p')?.textContent.toLowerCase() || '';
                    const matchesCategory = selectedGenre === 'svi' || bookCategory === selectedGenre;
                    const matchesText = searchValue === '' || title.includes(searchValue) || description.includes(searchValue);
                    book.style.display = matchesCategory && matchesText ? '' : 'none';
                });
                updateCount();
            } else if (document.querySelector('#tabela-naslova tbody')) {
                applyCatalogFilters();
            }
        });
    }

    function setupKatalogFilters() {
        const genreFilter = document.getElementById('genreFilter');
        if (!genreFilter) {
            return;
        }
        const savedGenre = getSavedPreference('catalogGenre') || 'svi';
        genreFilter.value = savedGenre;
        genreFilter.addEventListener('change', () => {
            savePreference('catalogGenre', genreFilter.value);
            applyCatalogFilters();
        });
        applyCatalogFilters();
    }

    function setupIndexGenreFilters() {
        const genreLinks = Array.from(document.querySelectorAll('#sporedniNav a[data-genre]'));
        if (!genreLinks.length) {
            return;
        }
        genreLinks.forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                const genre = link.dataset.genre;
                if (genre) {
                    window.filterBooks(genre);
                }
            });
        });
    }

    function openGalleryModal(src, alt) {
        let modal = document.getElementById('gallery-lightbox');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'gallery-lightbox';
            modal.innerHTML = `
                <div class="gallery-lightbox-backdrop"></div>
                <div class="gallery-lightbox-content" role="dialog" aria-modal="true">
                    <button class="gallery-lightbox-close" aria-label="Zatvori">×</button>
                    <img src="" alt="">
                    <p class="gallery-lightbox-caption"></p>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.gallery-lightbox-close').addEventListener('click', closeGalleryModal);
            modal.querySelector('.gallery-lightbox-backdrop').addEventListener('click', closeGalleryModal);
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    closeGalleryModal();
                }
            });
        }

        const image = modal.querySelector('.gallery-lightbox-content img');
        const caption = modal.querySelector('.gallery-lightbox-caption');
        image.src = src;
        image.alt = alt || '';
        caption.textContent = alt || '';
        modal.classList.add('open');
    }

    function closeGalleryModal() {
        const modal = document.getElementById('gallery-lightbox');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    function setupGalleryLightbox() {
        const galleryImages = document.querySelectorAll('#galerija-knjiga .galerija img');
        if (!galleryImages.length) {
            return;
        }

        galleryImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => openGalleryModal(img.src, img.alt));
        });
    }

    function ensureShelfTooltip() {
        let tooltip = document.getElementById('interactive-shelf-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'interactive-shelf-tooltip';
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }

    function showShelfTooltip(text, x, y) {
        const tooltip = ensureShelfTooltip();
        tooltip.textContent = text;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.classList.add('visible');
    }

    function hideShelfTooltip() {
        const tooltip = document.getElementById('interactive-shelf-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    function ensureShelfInfo() {
        const shelfSection = document.getElementById('interaktivna-polica');
        if (!shelfSection) {
            return null;
        }
        let infoBox = shelfSection.querySelector('.interactive-shelf-info');
        if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.className = 'interactive-shelf-info';
            shelfSection.appendChild(infoBox);
        }
        return infoBox;
    }

    function updateShelfInfo(title, href) {
        const infoBox = ensureShelfInfo();
        if (!infoBox) {
            return;
        }
        infoBox.innerHTML = `<strong>Otvoreno:</strong> ${title} <a href="${href}" target="_blank" rel="noreferrer noopener">(otvori)</a>`;
    }

    function setupInteractiveShelf() {
        const shelfLinks = document.querySelectorAll('#interaktivna-polica .map-link');
        if (!shelfLinks.length) {
            return;
        }

        shelfLinks.forEach(link => {
            const label = link.dataset.tooltip || link.getAttribute('aria-label') || 'Pogledaj knjigu';
            link.setAttribute('title', label);
            link.style.cursor = 'pointer';

            link.addEventListener('mouseenter', event => {
                const rect = link.getBoundingClientRect();
                showShelfTooltip(label, rect.left + rect.width / 2, rect.top - 12);
            });
            link.addEventListener('mouseleave', hideShelfTooltip);
            link.addEventListener('focus', () => {
                const rect = link.getBoundingClientRect();
                showShelfTooltip(label, rect.left + rect.width / 2, rect.top - 12);
            });
            link.addEventListener('blur', hideShelfTooltip);

            link.addEventListener('click', event => {
                event.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    updateShelfInfo(label, href);
                    window.open(href, link.target || '_blank', 'noopener');
                }
            });
        });
    }

    window.applyCatalogFilters = applyCatalogFilters;

    function setCookie(name, value, days) {
        const expiration = new Date();
        expiration.setTime(expiration.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expiration.toUTCString()};path=/`;
    }

    function getCookie(name) {
        const cookieString = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
        return cookieString ? decodeURIComponent(cookieString.split('=')[1]) : null;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }

    function applySavedTheme() {
        let savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            savedTheme = getCookie('theme');
        }
        if (savedTheme === 'light') {
            bodyElement.classList.remove('dark-mode');
        } else {
            bodyElement.classList.add('dark-mode');
        }
        if (savedTheme) {
            localStorage.setItem('theme', savedTheme);
            setCookie('theme', savedTheme, 365);
        }
    }

    function toggleTheme() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        const themeName = isDarkMode ? 'dark' : 'light';
        localStorage.setItem('theme', themeName);
        setCookie('theme', themeName, 365);
    }

    if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
    }

    function syncVisitData() {
        const localCount = Number(localStorage.getItem('visitCount') || '0');
        const cookieCount = Number(getCookie('visitCount') || '0');
        const visitCount = Math.max(localCount, cookieCount) + 1;

        localStorage.setItem('visitCount', visitCount.toString());
        setCookie('visitCount', visitCount.toString(), 365);
        localStorage.setItem('lastVisited', location.pathname);
        setCookie('lastVisited', location.pathname, 365);

        return visitCount;
    }

    function showVisitData() {
        const visitCount = syncVisitData();
        console.log(`Ovo je vaša posjeta broj ${visitCount}.`);
        console.log(`Posljednja posjećena stranica: ${getCookie('lastVisited') || location.pathname}`);
    }

    function registerServiceWorker() {
        const secureContext = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if ('serviceWorker' in navigator && secureContext) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('Service worker registered.'))
                .catch(error => console.warn('Service worker registration failed:', error));
        } else if ('serviceWorker' in navigator) {
            console.warn('Service worker skipped: service workers must be served over HTTPS or localhost.');
        }
    }

    function showError(input, errorSpan, message) {
        if (input) {
            input.classList.add('input-greska');
        }
        if (errorSpan) {
            errorSpan.textContent = message;
        }
    }

    function clearError(input, errorSpan) {
        if (input) {
            input.classList.remove('input-greska');
        }
        if (errorSpan) {
            errorSpan.textContent = '';
        }
    }

    function validateEmailFormat(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function setupContactForm() {
        const contactForm = document.getElementById('kontaktForma');
        if (!contactForm) {
            return;
        }

        const nameInput = document.getElementById('ime');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('poruka');
        const successBox = document.getElementById('uspjehPoruka');

        function resetContactErrors() {
            clearError(nameInput, document.getElementById('imeGreska'));
            clearError(emailInput, document.getElementById('emailGreska'));
            clearError(messageInput, document.getElementById('porukaGreska'));
        }

        function validateContactForm() {
            let isValid = true;
            resetContactErrors();

            if (!nameInput || nameInput.value.trim().length < 3) {
                showError(nameInput, document.getElementById('imeGreska'), 'Unesite vaše ime i prezime (najmanje 3 znaka).');
                isValid = false;
            }

            if (!emailInput || emailInput.value.trim() === '') {
                showError(emailInput, document.getElementById('emailGreska'), 'Unesite vašu email adresu.');
                isValid = false;
            } else if (!validateEmailFormat(emailInput.value.trim())) {
                showError(emailInput, document.getElementById('emailGreska'), 'Unesite važeću email adresu.');
                isValid = false;
            }

            if (!messageInput || messageInput.value.trim().length < 10) {
                showError(messageInput, document.getElementById('porukaGreska'), 'Unesite poruku od najmanje 10 znakova.');
                isValid = false;
            }

            return isValid;
        }

        contactForm.addEventListener('submit', event => {
            event.preventDefault();
            if (validateContactForm()) {
                if (successBox) {
                    successBox.style.display = 'block';
                }
                contactForm.reset();
                resetContactErrors();
                setTimeout(() => {
                    if (successBox) {
                        successBox.style.display = 'none';
                    }
                }, 5000);
            } else if (successBox) {
                successBox.style.display = 'none';
            }
        });

        [nameInput, emailInput, messageInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    resetContactErrors();
                    if (successBox) {
                        successBox.style.display = 'none';
                    }
                });
            }
        });
    }

    function updateActiveNav(url) {
        document.querySelectorAll('nav ul li a').forEach(link => {
            if (!link.href) {
                return;
            }
            const linkUrl = new URL(link.href, location.origin);
            const currentUrl = new URL(url, location.origin);
            const linkPath = linkUrl.pathname.split('/').pop() || 'index.html';
            const currentPath = currentUrl.pathname.split('/').pop() || 'index.html';
            link.classList.toggle('active-nav', linkPath === currentPath);
        });
    }

    function shouldNavigateViaSpa(link) {
        const href = link.getAttribute('href');
        if (!link.href || link.target === '_blank') {
            return false;
        }
        if (href && href.startsWith('#')) {
            return false;
        }
        const url = new URL(link.href, location.origin);
        if (url.origin !== location.origin) {
            return false;
        }
        const currentPath = location.pathname.split('/').pop();
        const linkPath = url.pathname.split('/').pop();
        if (linkPath === currentPath && url.hash) {
            return false;
        }
        return url.pathname.endsWith('.html');
    }

    function parseHTML(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    }

    async function loadPage(url, pushHistory = true) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                window.location.href = url;
                return;
            }
            const html = await response.text();
            const parsed = parseHTML(html);
            const newContainer = parsed.querySelector('.container');
            if (newContainer && pageContainer) {
                pageContainer.innerHTML = newContainer.innerHTML;
                document.title = parsed.title || document.title;
                if (pushHistory) {
                    history.pushState({ url }, parsed.title, url);
                }
                initPageFeatures();
                updateCount();
                updateActiveNav(url);
                window.scrollTo(0, 0);
            } else {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Greška prilikom učitavanja stranice:', error);
            window.location.href = url;
        }
    }

    function interceptNavLinks() {
        document.body.addEventListener('click', event => {
            const anchor = event.target.closest('a');
            if (!anchor || !shouldNavigateViaSpa(anchor)) {
                return;
            }
            event.preventDefault();
            const href = anchor.getAttribute('href');
            if (href) {
                loadPage(href);
            }
        });
    }

    function isSamePageHashLink(anchor) {
        if (!anchor || !anchor.hash) {
            return false;
        }
        const href = anchor.getAttribute('href');
        if (!href) {
            return false;
        }
        if (href === '#') {
            return true;
        }
        if (href.startsWith('#')) {
            return true;
        }
        const url = new URL(anchor.href, location.origin);
        const currentPath = location.pathname.split('/').pop();
        const anchorPath = url.pathname.split('/').pop();
        return url.origin === location.origin && anchorPath === currentPath;
    }

    function setupSmoothScroll() {
        document.body.addEventListener('click', event => {
            const anchor = event.target.closest('a');
            if (!isSamePageHashLink(anchor) || shouldNavigateViaSpa(anchor)) {
                return;
            }

            event.preventDefault();
            const href = anchor.getAttribute('href');
            if (!href) {
                return;
            }

            if (href === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const hash = anchor.hash.substring(1);
            const target = document.getElementById(hash) || document.querySelector(`[name="${hash}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function initPageFeatures() {
        setupSearch();
        setupKatalogFilters();
        setupIndexGenreFilters();
        restoreSelectedGenre();
        setupGalleryLightbox();
        setupInteractiveShelf();
        setupContactForm();
        updateActiveNav(location.href);
        setupSmoothScroll();
    }

    interceptNavLinks();
    applySavedTheme();
    initPageFeatures();
    updateCount();
    showVisitData();
    registerServiceWorker();

    window.addEventListener('popstate', event => {
        const url = event.state?.url || location.href;
        loadPage(url, false);
    });
});




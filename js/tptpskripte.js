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
        const books = getBooks();
        books.forEach(book => {
            const bookCategory = book.dataset.category ? book.dataset.category.toLowerCase() : '';
            if (normalizedCategory === 'svi' || bookCategory === normalizedCategory) {
                book.style.display = '';
            } else {
                book.style.display = 'none';
            }
        });
        updateCount();
    };

    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            return;
        }

        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.trim().toLowerCase();
            const books = getBooks();
            books.forEach(book => {
                const title = book.querySelector('h3')?.textContent.toLowerCase() || '';
                const description = book.querySelector('p')?.textContent.toLowerCase() || '';
                const matches = title.includes(searchValue) || description.includes(searchValue);
                book.style.display = matches ? '' : 'none';
            });
            updateCount();
        });
    }

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            bodyElement.classList.remove('dark-mode');
        } else {
            bodyElement.classList.add('dark-mode');
        }
    }

    function toggleTheme() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }

    if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
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
        if (!link.href || link.target === '_blank') {
            return false;
        }
        const url = new URL(link.href, location.origin);
        return url.origin === location.origin && url.pathname.endsWith('.html');
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
        setupContactForm();
        updateActiveNav(location.href);
        setupSmoothScroll();
    }

    interceptNavLinks();
    applySavedTheme();
    initPageFeatures();
    updateCount();

    window.addEventListener('popstate', event => {
        const url = event.state?.url || location.href;
        loadPage(url, false);
    });
});




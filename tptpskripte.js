document.addEventListener('DOMContentLoaded', () => {
    const books = Array.from(document.querySelectorAll('#knjige-grid article.kartice'));
    const countElement = document.getElementById('book-count');
    const searchInput = document.getElementById('searchInput');

    function updateCount() {
        const visibleCount = books.filter(book => book.style.display !== 'none').length;
        if (countElement) {
            countElement.textContent = visibleCount;
        }
    }

    window.filterBooks = function(category) {
        const normalizedCategory = category.toString().toLowerCase();
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

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.trim().toLowerCase();
            books.forEach(book => {
                const title = book.querySelector('h3')?.textContent.toLowerCase() || '';
                const description = book.querySelector('p')?.textContent.toLowerCase() || '';
                const matches = title.includes(searchValue) || description.includes(searchValue);
                book.style.display = matches ? '' : 'none';
            });
            updateCount();
        });
    }

    const themeButton = document.getElementById('drugaBoja');
    const bodyElement = document.body;

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

    applySavedTheme();
    updateCount();
});




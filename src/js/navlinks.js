// Function to load navlinks
function loadNavLinks() {
    const navLinksContainer = document.getElementById('nav-links-container');
    if (!navLinksContainer) return;

    const navLinks = document.createElement('ul');
    navLinks.className = 'nav-links';
    navLinks.setAttribute('role', 'navigation');
    navLinks.setAttribute('aria-label', 'Main navigation');

const links = [
    { href: 'index.html', text: 'HOME' },  // This stays the same as it is at the root
    { href: 'pages/about.html', text: 'ABOUT' },  // Add 'pages/' to link to pages directory
    { href: 'pages/guide.html', text: 'GUIDE' },  // Same here
    { href: 'pages/staff.html', text: 'STAFF' },
    { href: 'pages/apply.html', text: 'APPLY' },
    { href: 'pages/donate.html', text: 'DONATE' }
];

    links.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.className = 'nav-link';
        a.setAttribute('role', 'menuitem');
        
        if (window.location.pathname.endsWith(link.href)) {
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        }
        
        li.appendChild(a);
        navLinks.appendChild(li);
    });

    navLinksContainer.appendChild(navLinks);
}

// Function to update active link based on current page
function updateActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath.endsWith(linkPath)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Add FX Toggle functionality
function initializeFxToggle() {
    // Create and add the FX toggle button to the body
    const fxToggle = document.createElement('div');
    fxToggle.className = 'nav-fx-toggle';
    const toggleButton = document.createElement('button');
    toggleButton.className = 'fx-toggle-button';
    toggleButton.innerHTML = '<i class="fas fa-eye"></i> Disable Effects';
    toggleButton.title = 'Toggle Visual Effects';
    fxToggle.appendChild(toggleButton);
    document.body.appendChild(fxToggle);

    // Check localStorage for saved preference
    const fxDisabled = localStorage.getItem('fxDisabled') === 'true';
    if (fxDisabled) {
        document.body.classList.add('no-fx');
        toggleButton.innerHTML = '<i class="fas fa-eye"></i> Enable Effects';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Disable Effects';
    }

    toggleButton.addEventListener('click', () => {
        const isDisabled = document.body.classList.toggle('no-fx');
        localStorage.setItem('fxDisabled', isDisabled);
        toggleButton.innerHTML = isDisabled 
            ? '<i class="fas fa-eye"></i> Enable Effects'
            : '<i class="fas fa-eye-slash"></i> Disable Effects';
        
        // Force stop all animations and transitions
        if (isDisabled) {
            document.body.style.animation = 'none';
            document.body.style.transition = 'none';
            document.querySelectorAll('*').forEach(el => {
                el.style.animation = 'none';
                el.style.transition = 'none';
            });
        } else {
            document.body.style.animation = '';
            document.body.style.transition = '';
            document.querySelectorAll('*').forEach(el => {
                el.style.animation = '';
                el.style.transition = '';
            });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadNavLinks();
    initializeFxToggle();
}); 
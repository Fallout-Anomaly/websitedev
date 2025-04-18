'use strict';

const bootMessages = {
	index: [
		"VAULT-TEC UNIFIED OPERATING SYSTEM",
		"COPYRIGHT 2077 VAULT-TEC INDUSTRIES",
		"ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM (VER 1.3.8)",
		"PIP-OS v7.1.0.8 INITIALIZING...",
		"LOADING CORE MODULES...",
		"VAULT NETWORK CONNECTION: ESTABLISHED",
		"RADIATION LEVELS: NOMINAL",
		"WARNING: CHECK HOLOTAPE DRIVE",
		"SYSTEM READY. PLEASE STAND BY..."
	],
	about: [
		"ACCESSING VAULT HISTORICAL ARCHIVES...",
		"DECRYPTING OVERSEER LOG ENTRY #42...",
		"DATA CORRUPTION SCAN INITIATED...",
		"SCAN COMPLETE. MINOR CORRUPTION DETECTED.",
		"INFOSEC DIRECTIVE 115 ACTIVE.",
		"LOADING VAULT INFORMATION DATABASE...",
		"DISPLAYING HISTORICAL RECORDS...",
		"WELCOME TO ARCHIVE TERMINAL 3B."
	],
	apply: [
		"INITIATING VAULT DWELLER APPLICATION PROTOCOL...",
		"ACCESSING CITIZENSHIP REGISTRY...",
		"SECURITY CLEARANCE CHECK: LEVEL OMEGA...",
		"WARNING: BIOMETRIC SCAN REQUIRED (BYPASSED)",
		"APPLICANT ASSESSMENT MODULE ONLINE.",
		"PREPARING G.O.A.T. INTERFACE...",
		"STANDBY FOR SKILL ASSESSMENT...",
		"AWAITING APPLICANT INPUT..."
	],
	donate: [
		"ACCESSING VAULT RESOURCE MANAGEMENT...",
		"CONNECTING TO CENTRAL TREASURY TERMINAL...",
		"VERIFYING VAULT-TEC SECURE TRANSACTION PROTOCOL...",
		"ENCRYPTION LAYER: ACTIVE (LVL 5)",
		"RESOURCE TRANSFER INTERFACE READY.",
		"YOUR CONTRIBUTION SUPPORTS VAULT SECURITY.",
		"REMEMBER: VAULT-TEC VALUES YOUR GENEROSITY!",
		"AWAITING TRANSACTION..."
	],
	guide: [
		"LOADING PIP-BOY USER MANUAL MK IV...",
		"ACCESSING VAULT SURVIVAL PROTOCOLS...",
		"CROSS-REFERENCING TECHNICAL SCHEMATICS...",
		"WARNING: HAZARD PROTOCOLS ENGAGED.",
		"STANDARD OPERATING PROCEDURES LOADED.",
		"PROCEDURAL GUIDE ACTIVE.",
		"SYSTEM READY. FOLLOW INSTRUCTIONS CAREFULLY, DWELLER."
	],
	staff: [
		"QUERYING VAULT PERSONNEL ROSTER...",
		"VERIFYING SECURITY CLEARANCE: USER LEVEL GAMMA",
		"LOADING PERSONNEL FILES: [CLASSIFIED]...",
		"WARNING: UNAUTHORIZED ACCESS WILL BE LOGGED.",
		"SORTING BY SECURITY RANK & ASSIGNMENT...",
		"VAULT STAFF DIRECTORY INITIALIZED.",
		"DISPLAYING AUTHORIZED PERSONNEL DATA..."
	]
};

// --- Utility Functions ---
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPageIdentifier() {
	const path = window.location.pathname;
	const filename = path.substring(path.lastIndexOf('/') + 1);
	if (filename === '' || /index\.html?$/.test(filename)) {
		return 'index';
	}
	const pageName = filename.replace(/\.html?$/, '');
	if (bootMessages.hasOwnProperty(pageName)) {
		return pageName;
	}
	console.warn(`No specific boot message key found for page: ${pageName}. Falling back to index.`);
	return 'index';
}


// --- Boot Sequence Functions ---

function displayAllBootMessagesInstantly(pageKey) {
	const pipOsBoot = document.querySelector('.pip-os-boot');
	if (!pipOsBoot) return;

	pipOsBoot.innerHTML = '';
	const messages = bootMessages[pageKey] || bootMessages['index'];
	if (!messages) {
		const line = document.createElement('div');
		line.className = 'pip-os-line visible';
		line.textContent = 'INITIALIZING SYSTEM...';
		pipOsBoot.appendChild(line);
		return;
	}

	messages.forEach(message => {
		const line = document.createElement('div');
		line.className = 'pip-os-line visible'; // Instantly visible
		line.textContent = message;
		pipOsBoot.appendChild(line);
	});
}

async function initializeBootMessagesWithTypewriter(pageKey, controller) {
	const pipOsBoot = document.querySelector('.pip-os-boot');
	if (!pipOsBoot) {
		if (!controller.skipped) controller.resolve();
		return;
	}
	pipOsBoot.innerHTML = '';

	const messages = bootMessages[pageKey] || bootMessages['index'];
	if (!messages) {
		const line = document.createElement('div');
		line.className = 'pip-os-line visible';
		line.textContent = 'INITIALIZING SYSTEM...';
		pipOsBoot.appendChild(line);
		if (!controller.skipped) controller.resolve();
		return;
	}

	const charDelay = 10;
	const lineDelay = 75;

	try {
		for (const message of messages) {
			if (controller.skipped) return;
			const line = document.createElement('div');
			line.className = 'pip-os-line';
			pipOsBoot.appendChild(line);
			let currentText = '';

			for (let i = 0; i < message.length; i++) {
				if (controller.skipped) return;
				currentText += message[i];
				line.textContent = currentText;
				await delay(charDelay);
				if (controller.skipped) return;
			}
			line.classList.add('visible');
			await delay(lineDelay);
			if (controller.skipped) return;
		}

		if (!controller.skipped) {
			controller.resolve(); // Resolve only if not skipped
		}
	} catch (error) {
		console.error("Error during boot message typing:", error);
		if (!controller.skipped) {
			controller.resolve(); // Resolve even on error
		}
	}
}

// --- Main Initialization Flow ---

document.addEventListener('DOMContentLoaded', async () => {
	const pageIdentifier = getPageIdentifier();
	const loadingScreen = document.querySelector('.loading-screen');
	const continuePrompt = document.querySelector('.continue-prompt'); // Get prompt element

	// Controller for boot sequence promise
	const bootController = {
		skipped: false,
		promise: null,
		resolve: null,
		reject: null
	};
	bootController.promise = new Promise((res, rej) => {
		bootController.resolve = res;
		bootController.reject = rej;
	});

	let skipHandler = null;

	// Setup skip functionality for the typewriter effect
	if (loadingScreen) {
		skipHandler = (event) => {
			if (bootController.skipped) return;
			const isSkipEvent = event.type === 'click' || (event.type === 'keydown' && ['Enter', ' ', 'Escape'].includes(event.key));
			if (isSkipEvent) {
				event.preventDefault(); // Prevent default actions
				bootController.skipped = true;
				displayAllBootMessagesInstantly(pageIdentifier);
				bootController.resolve(); // Resolve the boot promise immediately

				// Clean up this specific skip handler
				loadingScreen.removeEventListener('click', skipHandler);
				document.removeEventListener('keydown', skipHandler);
                skipHandler = null; // Ensure it's cleared
			}
		};
		loadingScreen.addEventListener('click', skipHandler);
		document.addEventListener('keydown', skipHandler);
	}

	// Start the typewriter
	initializeBootMessagesWithTypewriter(pageIdentifier, bootController);

	// Initialize non-visual elements early
	initializeFXToggleIfNeeded();
	initializeTerminalColorSwitcher();

	// --- Stage 1: Wait for Boot Messages to Display ---
	try {
		await bootController.promise;
	} catch (error) {
		console.error("Boot sequence promise rejected:", error);
		// Ensure instant display if typewriter failed but wasn't skipped
        if (!bootController.skipped) {
            displayAllBootMessagesInstantly(pageIdentifier);
        }
	}

    // Boot messages are now fully displayed (typed or skipped)
    // Clean up the initial skip listener if it's still attached
    if (skipHandler && loadingScreen) {
		loadingScreen.removeEventListener('click', skipHandler);
		document.removeEventListener('keydown', skipHandler);
	}

	// --- Stage 2: Wait for User "Continue" Action ---
	if (continuePrompt) {
		continuePrompt.classList.remove('hidden'); // Show the prompt

		// Create a new promise that resolves on user interaction
		const continuePromise = new Promise((resolveContinue) => {
			const continueHandler = (event) => {
                // Prevent trigger if clicking on interactive elements inside loading screen
                if (event.target && event.target.closest('a, button') && event.target !== loadingScreen) return;

				event.preventDefault();
				continuePrompt.classList.add('hidden'); // Hide prompt
				// Remove listeners immediately
				document.removeEventListener('keydown', continueHandler);
				loadingScreen?.removeEventListener('click', continueHandler);
				resolveContinue(); // Resolve the promise to proceed
			};

			// Add listeners for the continue action
			document.addEventListener('keydown', continueHandler);
			loadingScreen?.addEventListener('click', continueHandler); // Use optional chaining
		});

		await continuePromise; // Wait here until the user interacts

	} else {
        console.warn("'.continue-prompt' element not found. Proceeding automatically after a short delay.");
        await delay(500); // Fallback delay if prompt is missing
    }

	// --- Stage 3: Initialize Site ---
	// User has chosen to continue (or fallback delay passed)
	try {
		await initializeSite(); // No promise needed here anymore
	} catch(error) {
		console.error("Failed to initialize site after continue signal:", error);
        // Attempt basic recovery
        const mainContent = document.querySelector('.main-content');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden'); // Force hide
        }
        if (mainContent && !mainContent.classList.contains('visible')) {
            mainContent.classList.add('visible'); // Force show
        }
	}

	// Load page-specific data AFTER main site initialization is complete
	if (pageIdentifier === 'staff') {
		loadStaffData();
	}
});

// InitializeSite now assumes the wait is over.
async function initializeSite() {
	const loadingScreen = document.querySelector('.loading-screen');
	const mainContent = document.querySelector('.main-content');

	if (!mainContent) {
		console.error('Critical Error: .main-content element not found! Site cannot display.');
		if (loadingScreen) loadingScreen.innerHTML = '<div class="pip-os-boot"><div class="pip-os-line">FATAL ERROR: Main content missing.</div></div>';
		return;
	}

    // Hide loading screen smoothly
	if (loadingScreen) {
		if (!loadingScreen.classList.contains('hidden')) {
            // Use CSS transition for fade-out
            loadingScreen.style.opacity = '0';
            // Wait for transition to finish before setting visibility: hidden or display: none
            await delay(700); // Match transition duration in CSS (0.7s)
            loadingScreen.classList.add('hidden'); // Use 'hidden' class which should set display:none or visibility:hidden
            loadingScreen.style.opacity = ''; // Reset inline style
		}
	}

	// Show main content smoothly
	requestAnimationFrame(() => {
		if (!mainContent.classList.contains('visible')) {
			mainContent.classList.add('visible');
		}
	});

    // Allow a moment for visibility transition to start if any
	await delay(50);

	// Initialize components that depend on main content being visible
	loadFooter();
	initializeCardObserver();
	initializeTabs();
	initializeButtonHoverEffects();
}


// --- Component Initializers & Data Loaders ---

function initializeFXToggleIfNeeded() {
    if (!document.querySelector('.fx-toggle-button')) {
        initializeFXToggle();
    }
}

async function loadFooter() {
	if (document.querySelector('.fallout-footer') || document.body.classList.contains('footer-loading')) {
		return;
	}
	document.body.classList.add('footer-loading');
	try {
		const path = window.location.pathname;
		const isPagesDir = path.includes('/pages/');
		const footerPath = isPagesDir ? '../src/components/footer.html' : 'src/components/footer.html';

		const response = await fetch(footerPath);
		if (!response.ok) throw new Error(`Failed to load footer: ${response.status} ${response.statusText} from ${footerPath}`);
		const footerHtml = await response.text();
		const footerContainer = document.createElement('div');
		footerContainer.innerHTML = footerHtml;
		const footerElement = footerContainer.querySelector('.fallout-footer');
		if (footerElement && !document.querySelector('.fallout-footer')) {
			document.body.appendChild(footerElement);
		} else if (!footerElement) {
			console.error('Footer HTML file seems empty or invalid (missing .fallout-footer).');
		}
	} catch (error) {
		console.error('Error loading footer:', error);
		if (!document.querySelector('.fallout-footer')) {
			const errorFooter = document.createElement('footer');
			errorFooter.className = 'fallout-footer error-footer';
			errorFooter.innerHTML = '<p>Error loading footer content.</p>';
			document.body.appendChild(errorFooter);
		}
	} finally {
		document.body.classList.remove('footer-loading');
	}
}

async function loadStaffData() {
	const staffSectionsContainer = document.getElementById('staff-sections-container');
	if (!staffSectionsContainer) return;

	staffSectionsContainer.innerHTML = '<div class="fallout-card error-card"><p class="terminal-text error-message"><i class="fas fa-spinner fa-spin icon"></i> Loading staff roster...</p></div>';
	try {
		const response = await fetch('../src/data/staff.json');
		if (!response.ok) {
			throw new Error(`HTTP error fetching staff.json: ${response.status} ${response.statusText}`);
		}
		const staffList = await response.json();
		staffSectionsContainer.innerHTML = ''; // Clear loading message

		if (!Array.isArray(staffList) || staffList.length === 0) {
			staffSectionsContainer.innerHTML = '<div class="fallout-card error-card"><p class="terminal-text error-message"><i class="fas fa-exclamation-triangle icon"></i> No staff members found or data is invalid.</p></div>';
			return;
		}

		const groupedStaff = staffList.reduce((acc, staff) => {
			const rank = staff.rank || 'Unranked';
			if (!acc[rank]) acc[rank] = [];
			acc[rank].push(staff);
			return acc;
		}, {});

		const rankOrder = ["Lead Developer", "Head Admin", "Assistant Lead Developer", "Senior Developer", "Developer","Website Dev", "Community Manager", "Moderator", "Media Team", "Developer (On Leave)"];
		const processedRanks = new Set();

		const createStaffCard = (staff) => {
			const card = document.createElement('div');
			card.className = 'fallout-card staff-card';

			const image = document.createElement('img');
			image.className = 'staff-image';
			image.src = staff.image || '';
			image.alt = staff.name ? `${staff.name}'s profile picture` : 'Staff member profile picture';
			image.loading = 'lazy';
			image.onerror = function() {
				this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="40" fill="%23666"%3E👤%3C/text%3E%3C/svg%3E';
				this.style.filter = 'none'; this.style.objectFit = 'contain';
			};
			card.appendChild(image);

			const infoDiv = document.createElement('div');
			infoDiv.className = 'staff-info';

			const nameH3 = document.createElement('h3');
			nameH3.className = 'staff-name';
			nameH3.textContent = staff.name || 'Unnamed Staff';
			infoDiv.appendChild(nameH3);

			const rankP = document.createElement('p');
			rankP.className = 'staff-rank';
			rankP.textContent = staff.rank || 'No Rank';
			infoDiv.appendChild(rankP);

			const rolesContainer = document.createElement('div');
			rolesContainer.className = 'staff-roles-container';
			let roles = [];
			if (typeof staff.role === 'string') {
				roles = staff.role.split(',').map(role => role.trim()).filter(Boolean);
			} else if (Array.isArray(staff.role)) {
				roles = staff.role.filter(role => typeof role === 'string' && role.trim());
			}

			if (roles.length > 0) {
				roles.forEach(roleText => {
					const roleTag = document.createElement('span');
					roleTag.className = 'staff-role-tag';
					roleTag.textContent = roleText;
					rolesContainer.appendChild(roleTag);
				});
			} else {
				const noRoleTag = document.createElement('span');
				noRoleTag.className = 'staff-role-tag inactive';
				noRoleTag.textContent = 'No Roles Listed';
				rolesContainer.appendChild(noRoleTag);
			}
			infoDiv.appendChild(rolesContainer);
			card.appendChild(infoDiv);
			return card;
		};

		const createRankSection = (rank, staffMembers) => {
			const sectionDiv = document.createElement('div');
			sectionDiv.className = 'rank-section';

			const headerDiv = document.createElement('div');
			headerDiv.className = 'rank-header';
			const headerCard = document.createElement('div');
			headerCard.className = 'fallout-card-header';
			const headerIcon = document.createElement('i');
			headerIcon.className = `fas ${getIconForRank(rank)} icon`;
			const headerTitle = document.createElement('h2');
			headerTitle.textContent = rank;
			headerCard.appendChild(headerIcon);
			headerCard.appendChild(headerTitle);
			headerDiv.appendChild(headerCard);
			sectionDiv.appendChild(headerDiv);

			const membersGrid = document.createElement('div');
			membersGrid.className = 'rank-members staff-grid';
			staffMembers.forEach(staff => {
				membersGrid.appendChild(createStaffCard(staff));
			});
			sectionDiv.appendChild(membersGrid);
			return sectionDiv;
		};

		rankOrder.forEach(rank => {
			if (groupedStaff[rank] && groupedStaff[rank].length > 0) {
				staffSectionsContainer.appendChild(createRankSection(rank, groupedStaff[rank]));
				processedRanks.add(rank);
			}
		});

		Object.keys(groupedStaff).sort().forEach(rank => {
			if (!processedRanks.has(rank) && groupedStaff[rank] && groupedStaff[rank].length > 0) {
				staffSectionsContainer.appendChild(createRankSection(rank, groupedStaff[rank]));
			}
		});

		initializeCardObserver();

	} catch (error) {
		console.error('Failed to load or process staff data:', error);
		staffSectionsContainer.innerHTML = '<div class="fallout-card error-card"><p class="terminal-text error-message"><i class="fas fa-exclamation-triangle icon"></i> Error loading staff roster. Details in console.</p></div>';
	}
}

function getIconForRank(rank) {
	const lowerRank = rank?.toLowerCase() || '';
	if (lowerRank.includes('lead') || lowerRank.includes('head')) return 'fa-crown';
	if (lowerRank.includes('senior')) return 'fa-user-shield';
	if (lowerRank.includes('developer') || lowerRank.includes('website') || lowerRank.includes('dev')) return 'fa-code';
	if (lowerRank.includes('admin')) return 'fa-user-cog';
	if (lowerRank.includes('manager')) return 'fa-comments';
	if (lowerRank.includes('media')) return 'fa-camera-retro';
	if (lowerRank.includes('leave')) return 'fa-user-clock';
	return 'fa-user';
}

function initializeTabs() {
	const tabContainers = document.querySelectorAll('.tab-container');
	if (tabContainers.length === 0) return;

	tabContainers.forEach(container => {
		const tabButtons = container.querySelectorAll('.tab-button');
		const tabContents = container.querySelectorAll(':scope > .tab-content');

		if (tabButtons.length > 0 && tabContents.length > 0) {
			const switchTab = (tabId) => {
				const targetContent = container.querySelector(`#${tabId}`);
				const targetButton = container.querySelector(`.tab-button[data-tab="${tabId}"]`);

				tabContents.forEach(content => content.classList.remove('active'));
				tabButtons.forEach(button => button.classList.remove('active'));

				if (targetContent) {
					targetContent.classList.add('active');
				} else {
					console.warn(`Tab content with id "${tabId}" not found in container`, container);
				}
				if (targetButton) {
					targetButton.classList.add('active');
				} else {
					console.warn(`Tab button with data-tab "${tabId}" not found in container`, container);
				}
			};

			tabButtons.forEach(button => {
				button.addEventListener('click', (event) => {
					const tabId = event.currentTarget.getAttribute('data-tab');
					if (tabId) {
                        if (history.pushState) {
                           history.pushState(null, null, `#${tabId}`);
                        } else {
                           location.hash = `#${tabId}`;
                        }
						switchTab(tabId);
					} else {
						console.warn('Tab button missing data-tab attribute:', button);
					}
				});
			});

			const handleHashChange = () => {
				const hash = window.location.hash.substring(1);
				const buttonForHash = container.querySelector(`.tab-button[data-tab="${hash}"]`);
				if (hash && buttonForHash) {
					switchTab(hash);
				} else {
                    const currentlyActiveButton = container.querySelector('.tab-button.active');
                    if (!currentlyActiveButton && tabButtons.length > 0) {
                        const firstTabId = tabButtons[0].getAttribute('data-tab');
                        if (firstTabId) switchTab(firstTabId);
                    }
				}
			};

			handleHashChange();
			window.addEventListener('hashchange', handleHashChange, false);
		}
	});
}

function initializeButtonHoverEffects() {} // Keep structure, CSS handles hover

let cardObserverInstance = null;
function initializeCardObserver() {
	if (cardObserverInstance) {
		cardObserverInstance.disconnect();
	}
	const cards = document.querySelectorAll(
		'.fallout-card:not(.visible), .feature-card:not(.visible), .application-card:not(.visible), .staff-card:not(.visible), .donation-card:not(.visible)'
	);
	if (cards.length === 0) return;

	if ('IntersectionObserver' in window && !document.body.classList.contains('no-fx')) {
		const observerCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
					observer.unobserve(entry.target);
				}
			});
		};
		cardObserverInstance = new IntersectionObserver(observerCallback, {
			root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1
		});
		cards.forEach(card => cardObserverInstance.observe(card));
	} else {
		if (!('IntersectionObserver' in window)) { console.warn('IntersectionObserver not supported...'); }
		cards.forEach(card => card.classList.add('visible'));
		cardObserverInstance = null;
	}
}

function initializeTerminalColorSwitcher() {
	const T = {
		s: { i: '', t: false },
		c: { bg: '--terminal-bg', tx: '--terminal-text', hl: '--terminal-highlight', bd: '--terminal-border' },
		p: { bg: '#101410', tx: '#40FF40', hl: '#60FF60', bd: '#30bb30' },
		e: { bg: '#0a0a1a', tx: '#82aaff', hl: '#b794f4', bd: '#82aaff' },
		init() { document.addEventListener('keydown', (e) => this.k(e)); },
		k(e) {
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
			if (e.key.length > 1 && e.key !== 'Backspace') return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
			if (e.key === 'Backspace') { this.s.i = this.s.i.slice(0, -1); }
			else if (!e.repeat) { this.s.i += e.key.toLowerCase(); this.s.i = this.s.i.slice(-10); this.c(); }
		},
		c() { const trigger = "fliptheme"; if (this.s.i.endsWith(trigger)) { this.s.t = !this.s.t; this.u(); this.s.i = ''; console.log(`Theme toggled to: ${this.s.t ? 'Enclave' : 'Pip-Boy'}`); } },
		u() { const themeToApply = this.s.t ? this.s.e : this.s.p; Object.keys(themeToApply).forEach(key => { document.documentElement.style.setProperty(this.c[key], themeToApply[key]); }); }
	}; T.init();
}

function initializeFXToggle() {
	if (document.querySelector('.fx-toggle-button')) return;
	const fxToggleContainer = document.createElement('div'); fxToggleContainer.className = 'nav-fx-toggle';
	const toggleButton = document.createElement('button'); toggleButton.className = 'fx-toggle-button';
	fxToggleContainer.appendChild(toggleButton); document.body.appendChild(fxToggleContainer);
	const body = document.body;
	const updateButton = () => { const fxDisabled = body.classList.contains('no-fx'); if (fxDisabled) { toggleButton.innerHTML = '<i class="fas fa-eye icon"></i> Enable FX'; toggleButton.setAttribute('aria-pressed', 'false'); toggleButton.title = "Enable visual effects (scanlines, animations)"; } else { toggleButton.innerHTML = '<i class="fas fa-eye-slash icon"></i> Disable FX'; toggleButton.setAttribute('aria-pressed', 'true'); toggleButton.title = "Disable visual effects for performance or preference"; } };
	if (localStorage.getItem('fxDisabled') === 'true') { body.classList.add('no-fx'); } else { body.classList.remove('no-fx'); } updateButton();
	toggleButton.addEventListener('click', () => { body.classList.toggle('no-fx'); const fxDisabled = body.classList.contains('no-fx'); localStorage.setItem('fxDisabled', fxDisabled ? 'true' : 'false'); updateButton(); initializeCardObserver(); console.log(`Visual FX ${fxDisabled ? 'Disabled' : 'Enabled'}`); });
}
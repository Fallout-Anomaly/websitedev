const bootMessages = {
	index: ["BOOTING PIP-OS v2.7.0...", "TERMINAL INTERFACE ONLINE...", "VAULT DATABASE SYNC INITIATED...", "SECURE TERMINAL ACCESS GRANTED...", "ANOMALY PROTOCOLS ENGAGED...", "SECURITY SYSTEMS ACTIVATED...", "VAULT NETWORK LINK ESTABLISHED...", "UI MODULE INITIALIZED...", "SYSTEM STABLE. WELCOME, USER."],
	about: ["ACCESSING SYSTEM ARCHIVES...", "VAULT DATABASE LINK ONLINE...", "INFOSEC PROTOCOLS ACTIVE...", "MAINFRAME SYNC COMPLETE...", "INTERFACE MODULE INITIALIZED...", "WELCOME TO THE ABOUT TERMINAL."],
	apply: ["ACTIVATING APPLICATION INTERFACE...", "QUERYING PERSONNEL DATABASE...", "SECURITY CHECKS PASSED...", "ENCLAVE COMM LINK STABLE...", "FORM MODULE INITIALIZED...", "READY FOR APPLICATION INPUT."],
	donate: ["ENGAGING DONOR MODULE...", "VAULT-TEC LEDGERS LINKED...", "ENCRYPTION VERIFIED...", "SECURE CONNECTION ESTABLISHED...", "DONATION INTERFACE ONLINE...", "THANK YOU FOR YOUR CONTRIBUTION."],
	guide: ["ACCESSING USER MANUAL ARCHIVE...", "LINKING TO INSTALLATION PROTOCOLS...", "LOADING TECHNICAL PROCEDURES...", "SAFETY PROTOCOLS ENABLED...", "GUIDE INTERFACE INITIALIZED...", "SYSTEM READY. FOLLOW PROCEDURE."],
	staff: ["ACCESSING PERSONNEL DATABASE...", "VERIFYING SECURITY CLEARANCE...", "LOADING STAFF ROSTER...", "CLASSIFYING PERSONNEL BY RANK...", "STAFF DIRECTORY INITIALIZED.", "DISPLAYING TEAM INFORMATION..."]
};

function initializeBootMessages(pageKey) {
	const pipOsBoot = document.querySelector('.pip-os-boot');
	if(!pipOsBoot) {
		console.warn('Could not find .pip-os-boot element to add messages.');
		return;
	}
	pipOsBoot.innerHTML = '';
	const messages = bootMessages[pageKey] || bootMessages['index'];
	if(!messages) {
		console.error(`No boot messages defined for page key: ${pageKey}`);
		const line = document.createElement('div');
		line.className = 'pip-os-line';
		line.textContent = 'INITIALIZING SYSTEM...';
		pipOsBoot.appendChild(line);
		return;
	}
	messages.forEach(message => {
		const line = document.createElement('div');
		line.className = 'pip-os-line';
		line.textContent = message;
		pipOsBoot.appendChild(line);
	});
}

function getPageIdentifier() {
	const path = window.location.pathname;
	const filename = path.substring(path.lastIndexOf('/') + 1);
	if(filename === '' || /index\.html?$/.test(filename)) {
		return 'index';
	}
	const pageName = filename.replace(/\.html?$/, '');
	if(bootMessages.hasOwnProperty(pageName)) {
		return pageName;
	}
	console.warn(`No specific boot message key found for page: ${pageName}. Falling back to index.`);
	return 'index';
}
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM Content Loaded');
	const pageIdentifier = getPageIdentifier();
	console.log(`Determined page identifier: ${pageIdentifier}`);
	initializeBootMessages(pageIdentifier);
	initializeSite();
	if(pageIdentifier === 'staff') {
		loadStaffData();
	}
});

function initializeSite() {
	console.log('Initializing general site features...');
	const loadingScreen = document.querySelector('.loading-screen');
	const mainContent = document.querySelector('.main-content');
	const pipOsLines = document.querySelectorAll('.pip-os-boot .pip-os-line');
	console.log('Elements found:', {
		loadingScreen: !!loadingScreen,
		mainContent: !!mainContent,
		pipOsLines: pipOsLines.length
	});
	if(!mainContent) {
		console.error('Critical Error: .main-content element not found! Site cannot display.');
		if(loadingScreen) loadingScreen.innerHTML = '<div class="pip-os-boot"><div class="pip-os-line">FATAL ERROR: Main content missing.</div></div>';
		return;
	}
	if(loadingScreen && pipOsLines.length > 0) {
		console.log(`Loading screen found with ${pipOsLines.length} boot messages. Starting timed sequence.`);
		loadingScreen.classList.remove('hidden');
		const bootMessageCount = pipOsLines.length;
		const bootMessageDuration = (bootMessageCount * 200);
		const buffer = 1000;
		const loadingDuration = bootMessageDuration + buffer;
		console.log(`Calculated loading screen duration: ${loadingDuration}ms`);
		setTimeout(() => {
			console.log('Timeout complete: Hiding loading screen and showing main content...');
			if(loadingScreen) {
				loadingScreen.classList.add('hidden');
			}
			requestAnimationFrame(() => {
				const currentMainContent = document.querySelector('.main-content');
				if(currentMainContent) {
					currentMainContent.classList.add('visible');
					loadFooter();
					initializeCardObserver();
				} else {
					console.error("Main content disappeared during timeout!");
				}
			});
		}, loadingDuration);
	} else {
		console.log('No loading screen or no boot messages found - showing main content directly.');
		if(loadingScreen) loadingScreen.classList.add('hidden');
		mainContent.classList.add('visible');
		loadFooter();
		initializeCardObserver();
	}
	initializeTabs();
	initializeButtonHoverEffects();
	initializeTerminalColorSwitcher();
	initializeFXToggle();
}
async function loadFooter() {
	if(document.querySelector('.fallout-footer') || document.body.classList.contains('footer-loading')) {
		return;
	}
	document.body.classList.add('footer-loading');
	try {
		const response = await fetch('src/components/footer.html');
		if(!response.ok) throw new Error(`Failed to load footer: ${response.status} ${response.statusText}`);
		const footerHtml = await response.text();
		const footerContainer = document.createElement('div');
		footerContainer.innerHTML = footerHtml;
		const footerElement = footerContainer.querySelector('.fallout-footer');
		if(footerElement && !document.querySelector('.fallout-footer')) {
			document.body.appendChild(footerElement);
		} else if(!footerElement) {
			console.error('Footer HTML file seems empty or invalid (missing .fallout-footer).');
		} else {}
	} catch(error) {
		console.error('Error loading footer:', error);
		if(!document.querySelector('.fallout-footer')) {
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
	if(!staffSectionsContainer) {
		return;
	}
	console.log('Staff sections container found, attempting to load staff data...');
	staffSectionsContainer.innerHTML = '<div class="fallout-card error-card" style="grid-column: 1 / -1; text-align: center;"><div class="terminal-text"><p><i class="fas fa-spinner fa-spin icon"></i> Loading staff roster...</p></div></div>';
	try {
		const response = await fetch('../src/data/staff.json');
		if(!response.ok) {
			throw new Error(`HTTP error fetching staff.json: ${response.status} ${response.statusText}`);
		}
		const staffList = await response.json();
		console.log('Staff data fetched successfully:', staffList.length, 'members');
		staffSectionsContainer.innerHTML = '';
		if(!Array.isArray(staffList) || staffList.length === 0) {
			console.warn('Staff data is empty or not an array.');
			staffSectionsContainer.innerHTML = '<div class="fallout-card error-card" style="grid-column: 1 / -1;"><p class="terminal-text error-message"><i class="fas fa-exclamation-triangle icon"></i> No staff members found or data is invalid.</p></div>';
			return;
		}
		const groupedStaff = staffList.reduce((acc, staff) => {
			const rank = staff.rank || 'Unranked';
			if(!acc[rank]) acc[rank] = [];
			acc[rank].push(staff);
			return acc;
		}, {});
		const rankOrder = ["Lead Developer", "Head Admin", "Assistant Lead Developer", "Senior Developer", "Developer", "Community Manager", "Media Team", "Website Dev", "Developer (On Leave)"];
		const createStaffCard = (staff) => {
			const card = document.createElement('div');
			card.className = 'fallout-card staff-card';
			const image = document.createElement('img');
			image.className = 'staff-image';
			image.src = staff.image || '';
			image.alt = staff.name ? `${staff.name}'s profile picture` : 'Staff member profile picture';
			image.loading = 'lazy';
			image.onerror = function() {
				console.warn(`Failed to load image for ${staff.name || 'unknown'}: ${this.src}`);
				this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23333"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="40" fill="%23666"%3E👤%3C/text%3E%3C/svg%3E';
				this.style.filter = 'none';
				this.style.objectFit = 'contain';
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
			if(typeof staff.role === 'string') {
				roles = staff.role.split(',').map(role => role.trim()).filter(role => role !== '');
			} else if(Array.isArray(staff.role)) {
				roles = staff.role.filter(role => typeof role === 'string' && role.trim() !== '');
			}
			if(roles.length > 0) {
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
		const processedRanks = new Set();
		rankOrder.forEach(rank => {
			if(groupedStaff[rank] && groupedStaff[rank].length > 0) {
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
				groupedStaff[rank].forEach(staff => {
					membersGrid.appendChild(createStaffCard(staff));
				});
				sectionDiv.appendChild(membersGrid);
				staffSectionsContainer.appendChild(sectionDiv);
				processedRanks.add(rank);
			}
		});
		Object.keys(groupedStaff).forEach(rank => {
			if(!processedRanks.has(rank) && groupedStaff[rank] && groupedStaff[rank].length > 0) {
				console.log(`Adding section for unprocessed rank: ${rank}`);
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
				groupedStaff[rank].forEach(staff => {
					membersGrid.appendChild(createStaffCard(staff));
				});
				sectionDiv.appendChild(membersGrid);
				staffSectionsContainer.appendChild(sectionDiv);
			}
		});
		console.log(`Staff sections added to the container.`);
		initializeCardObserver();
	} catch(error) {
		console.error('Failed to load or process staff data:', error);
		staffSectionsContainer.innerHTML = `<div class="fallout-card error-card" style="grid-column: 1 / -1;"><p class="terminal-text error-message"><i class="fas fa-exclamation-triangle icon"></i> Error loading staff roster. Details in console.</p></div>`;
	}
}

function getIconForRank(rank) {
	const lowerRank = rank.toLowerCase();
	if(lowerRank.includes('lead') || lowerRank.includes('head')) return 'fa-crown';
	if(lowerRank.includes('senior')) return 'fa-user-shield';
	if(lowerRank.includes('developer') || lowerRank.includes('website')) return 'fa-code';
	if(lowerRank.includes('admin')) return 'fa-user-cog';
	if(lowerRank.includes('manager')) return 'fa-comments';
	if(lowerRank.includes('media')) return 'fa-camera-retro';
	if(lowerRank.includes('leave')) return 'fa-user-clock';
	return 'fa-user';
}

function initializeTabs() {
	const tabContainers = document.querySelectorAll('.tab-container');
	if(tabContainers.length === 0) return;
	tabContainers.forEach(container => {
		const tabButtons = container.querySelectorAll('.tab-button');
		const tabContents = container.querySelectorAll(':scope > .tab-content');
		if(tabButtons.length > 0 && tabContents.length > 0) {
			const switchTab = (tabId) => {
				const selectedTab = container.querySelector(`#${tabId}`);
				const selectedButton = container.querySelector(`.tab-button[data-tab="${tabId}"]`);
				tabContents.forEach(content => content.classList.remove('active'));
				tabButtons.forEach(button => button.classList.remove('active'));
				if(selectedTab) {
					selectedTab.classList.add('active');
				} else {
					console.warn(`Tab content with id "${tabId}" not found in container`, container);
				}
				if(selectedButton) {
					selectedButton.classList.add('active');
				} else {
					console.warn(`Tab button with data-tab "${tabId}" not found in container`, container);
				}
			};
			tabButtons.forEach(button => {
				button.addEventListener('click', (event) => {
					const tabId = event.currentTarget.getAttribute('data-tab');
					if(tabId) {
						switchTab(tabId);
					} else {
						console.warn('Tab button missing data-tab attribute:', button);
					}
				});
			});
			const handleHashChange = () => {
				const hash = window.location.hash.substring(1);
				const buttonForHash = container.querySelector(`.tab-button[data-tab="${hash}"]`);
				if(hash && buttonForHash) {
					switchTab(hash);
				} else {
					const firstButton = tabButtons[0];
					const activeButton = container.querySelector('.tab-button.active');
					if(!activeButton && firstButton) {
						const firstTabId = firstButton.getAttribute('data-tab');
						if(firstTabId) switchTab(firstTabId);
					}
				}
			};
			handleHashChange();
			window.addEventListener('hashchange', handleHashChange);
		}
	});
}

function initializeButtonHoverEffects() {
	const buttons = document.querySelectorAll('.terminal-button, .fallout-btn, .fallout-btn-discord, .fx-toggle-button');
	if(buttons.length > 0) {
		buttons.forEach(button => {
			button.addEventListener('mouseenter', () => {
				if(!document.body.classList.contains('no-fx')) {}
			});
			button.addEventListener('mouseleave', () => {});
		});
	}
}
let cardObserverInstance = null;

function initializeCardObserver() {
	if(cardObserverInstance) {
		cardObserverInstance.disconnect();
	}
	const cards = document.querySelectorAll('.fallout-card, .feature-card, .application-card, .staff-card, .donation-card');
	if(cards.length === 0) {
		return;
	}
	if('IntersectionObserver' in window && !document.body.classList.contains('no-fx')) {
		const observerCallback = (entries, observer) => {
			entries.forEach(entry => {
				if(entry.isIntersecting) {
					entry.target.classList.add('visible');
					observer.unobserve(entry.target);
				}
			});
		};
		cardObserverInstance = new IntersectionObserver(observerCallback, {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		});
		cards.forEach(card => {
			cardObserverInstance.observe(card);
		});
	} else {
		if(!('IntersectionObserver' in window)) {
			console.warn('IntersectionObserver not supported. Making all cards visible immediately.');
		} else {}
		cards.forEach(card => card.classList.add('visible'));
		cardObserverInstance = null;
	}
}

function initializeTerminalColorSwitcher() {
	const T = {
		s: {
			i: '',
			t: false,
			c: {
				bg: '--terminal-bg',
				tx: '--terminal-text',
				hl: '--terminal-highlight',
				bd: '--terminal-border'
			},
			p: {
				bg: '#101410',
				tx: '#40FF40',
				hl: '#60FF60',
				bd: '#30bb30'
			},
			e: {
				bg: '#0a0a1a',
				tx: '#82aaff',
				hl: '#b794f4',
				bd: '#82aaff'
			}
		},
		init() {
			document.addEventListener('keydown', (e) => this.k(e));
			this.r();
		},
		k(e) {
			if(e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
				this.s.i += e.key;
				this.s.i = this.s.i.slice(-10);
				this.c();
			} else if(e.key === 'Backspace') {
				this.s.i = this.s.i.slice(0, -1);
			}
		},
		c() {
			const trigger = "fliptheme";
			if(this.s.i.toLowerCase().endsWith(trigger)) {
				this.s.t = !this.s.t;
				this.u();
				this.s.i = '';
			}
		},
		u() {
			const themeToApply = this.s.t ? this.s.e : this.s.p;
			Object.keys(themeToApply).forEach(key => {
				document.documentElement.style.setProperty(this.s.c[key], themeToApply[key]);
			});
		},
		r() {
			setInterval(() => {
				if(this.s.i.length > 15) this.s.i = '';
			}, 5000);
		}
	};
	T.init();
}

function initializeFXToggle() {
	const toggleButton = document.querySelector('.fx-toggle-button');
	const body = document.body;
	if(!toggleButton) {
		return;
	}
	const updateButton = () => {
		if(body.classList.contains('no-fx')) {
			toggleButton.innerHTML = '<i class="fas fa-magic icon"></i> Enable FX';
			toggleButton.setAttribute('aria-pressed', 'false');
			toggleButton.title = "Enable visual effects (scanlines, animations)";
		} else {
			toggleButton.innerHTML = '<i class="fas fa-ban icon"></i> Disable FX';
			toggleButton.setAttribute('aria-pressed', 'true');
			toggleButton.title = "Disable visual effects for performance or preference";
		}
	};
	if(localStorage.getItem('fxDisabled') === 'true') {
		body.classList.add('no-fx');
	} else {
		body.classList.remove('no-fx');
	}
	updateButton();
	toggleButton.addEventListener('click', () => {
		body.classList.toggle('no-fx');
		const fxDisabled = body.classList.contains('no-fx');
		localStorage.setItem('fxDisabled', fxDisabled ? 'true' : 'false');
		updateButton();
		initializeCardObserver();
		console.log(`Visual FX ${fxDisabled ? 'Disabled' : 'Enabled'}`);
	});
}
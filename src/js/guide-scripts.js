// Back to Top functionality
      function scrollToTop() {
         window.scrollTo({
            top: 0,
            behavior: 'smooth'
         });
      }
      
      // AI Assistant functionality
      document.addEventListener('DOMContentLoaded', function() {
         const buildBtn = document.getElementById('generate-build-btn');
         const backstoryBtn = document.getElementById('generate-backstory-btn');
         const buildPrompt = document.getElementById('build-prompt');
         const backstoryPrompt = document.getElementById('backstory-prompt');
         const buildResult = document.getElementById('build-result');
         const backstoryResult = document.getElementById('backstory-result');
         
         if (buildBtn && buildPrompt && buildResult) {
            buildBtn.addEventListener('click', function() {
               generateCharacterBuild();
            });
         }
         
         if (backstoryBtn && backstoryPrompt && backstoryResult) {
            backstoryBtn.addEventListener('click', function() {
               generateCharacterBackstory();
            });
         }
      });
      
      function generateCharacterBuild() {
         const prompt = document.getElementById('build-prompt').value.trim();
         const resultBox = document.getElementById('build-result');
         const button = document.getElementById('generate-build-btn');
         
         if (!prompt) {
            resultBox.textContent = "Please enter a playstyle description first.";
            return;
         }
         
         // Show loading state
         button.disabled = true;
         button.innerHTML = '<span class="ai-loading"></span>Generating...';
         resultBox.textContent = "Analyzing your playstyle preferences...";
         
         // Simulate AI generation with realistic delay
         setTimeout(() => {
            const build = generateBuildFromPrompt(prompt);
            resultBox.textContent = build;
            button.disabled = false;
            button.textContent = 'Generate Build';
         }, 2000 + Math.random() * 2000); // 2-4 second delay
      }
      
      function generateCharacterBackstory() {
         const prompt = document.getElementById('backstory-prompt').value.trim();
         const resultBox = document.getElementById('backstory-result');
         const button = document.getElementById('generate-backstory-btn');
         
         if (!prompt) {
            resultBox.textContent = "Please enter some character keywords first.";
            return;
         }
         
         // Show loading state
         button.disabled = true;
         button.innerHTML = '<span class="ai-loading"></span>Generating...';
         resultBox.textContent = "Crafting your character's story...";
         
         // Simulate AI generation with realistic delay
         setTimeout(() => {
            const backstory = generateBackstoryFromPrompt(prompt);
            resultBox.textContent = backstory;
            button.disabled = false;
            button.textContent = 'Generate Backstory';
         }, 2000 + Math.random() * 2000); // 2-4 second delay
      }
      
      function generateBuildFromPrompt(prompt) {
         const builds = {
            // Sniper builds
            sniper: `🎯 SNIPER SPECIALIST BUILD
                     
SPECIAL Distribution:
• Perception: 8 (Essential for VATS accuracy and rifle damage)
• Agility: 7 (AP for VATS and stealth)
• Intelligence: 6 (Mod crafting and energy weapons)
• Strength: 3 (Minimal carry weight)
• Endurance: 4 (Survival basics)
• Charisma: 2 (Lone wanderer)
• Luck: 6 (Critical hits and better loot)

Key Perks:
• Rifleman (Perception) - Core damage perk
• Sniper (Perception) - VATS accuracy and range
• Sneak (Agility) - Essential for stealth
• Ninja (Agility) - Massive sneak attack damage
• Concentrated Fire (Perception) - VATS targeting
• Better Criticals (Luck) - Enhanced critical damage

Recommended Weapons:
• Hunting Rifle (early game)
• Gauss Rifle (end game)
• .50 Cal Sniper Rifle
• Plasma Rifle (energy option)

Playstyle Tips:
• Use high ground for better sight lines
• Invest in stealth boys for difficult encounters
• Focus on headshots for maximum damage
• Keep distance from enemies
• Use VATS for guaranteed hits on moving targets`,

            // Melee builds
            melee: `⚔️ MELEE BRUTE BUILD
                    
SPECIAL Distribution:
• Strength: 10 (Maximum melee damage and carry weight)
• Endurance: 8 (Survival and damage resistance)
• Agility: 6 (AP for power attacks and movement)
• Intelligence: 3 (Minimal crafting)
• Perception: 2 (Basic awareness)
• Charisma: 2 (Lone wanderer)
• Luck: 5 (Critical hits and loot)

Key Perks:
• Big Leagues (Strength) - Core melee damage
• Rooted (Strength) - Damage bonus when standing still
• Pain Train (Strength) - Power armor charge attacks
• Iron Fist (Strength) - Unarmed damage (alternative)
• Toughness (Endurance) - Damage resistance
• Life Giver (Endurance) - Extra health

Recommended Weapons:
• Super Sledge (highest damage)
• Baseball Bat (early game)
• Power Fist (unarmed option)
• Deathclaw Gauntlet (unique unarmed)

Playstyle Tips:
• Charge into combat aggressively
• Use power armor for protection
• Focus on strength and endurance
• Use chems for damage boosts
• Target multiple enemies with sweeping attacks`,

            // Charismatic leader builds
            leader: `👑 CHARISMATIC LEADER BUILD
                     
SPECIAL Distribution:
• Charisma: 10 (Maximum companion benefits and settlement)
• Intelligence: 7 (Settlement building and crafting)
• Endurance: 5 (Survival basics)
• Agility: 4 (Basic combat)
• Strength: 4 (Carry weight for settlement materials)
• Perception: 3 (Basic awareness)
• Luck: 3 (Minimal investment)

Key Perks:
• Local Leader (Charisma) - Settlement supply lines
• Cap Collector (Charisma) - Better vendor prices
• Inspirational (Charisma) - Companion damage boost
• Party Boy/Girl (Charisma) - Alcohol benefits
• Gun Nut (Intelligence) - Weapon crafting
• Science! (Intelligence) - Advanced crafting

Recommended Weapons:
• Combat Rifle (versatile)
• Laser Rifle (energy option)
• Automatic weapons for companions

Playstyle Tips:
• Focus on settlement building
• Use companions effectively
• Invest in charisma-based dialogue
• Build supply lines between settlements
• Use alcohol for temporary charisma boosts`,

            // Stealth builds
            stealth: `🥷 STEALTH ASSASSIN BUILD
                      
SPECIAL Distribution:
• Agility: 10 (Maximum stealth and AP)
• Perception: 7 (Detection and VATS)
• Intelligence: 6 (Crafting and energy weapons)
• Endurance: 4 (Basic survival)
• Strength: 3 (Minimal carry weight)
• Charisma: 2 (Lone wanderer)
• Luck: 4 (Critical hits)

Key Perks:
• Sneak (Agility) - Core stealth ability
• Ninja (Agility) - Massive sneak attack damage
• Mister Sandman (Agility) - Sleeping enemy damage
• Pickpocket (Agility) - Theft and sabotage
• Demolition Expert (Perception) - Explosive traps
• Action Boy/Girl (Agility) - More AP

Recommended Weapons:
• Combat Knife (silent melee)
• Deliverer (silent pistol)
• Suppressed weapons
• Throwing knives
• Explosives for traps

Playstyle Tips:
• Stay hidden at all times
• Use shadows and cover
• Set up traps before combat
• Pickpocket enemies for sabotage
• Focus on one-shot kills`,

            // Default balanced build
            default: `⚖️ BALANCED SURVIVOR BUILD
                      
SPECIAL Distribution:
• Strength: 5 (Moderate carry weight)
• Perception: 5 (Good awareness)
• Endurance: 5 (Decent survival)
• Charisma: 5 (Basic social skills)
• Intelligence: 5 (Good crafting)
• Agility: 5 (Moderate stealth and AP)
• Luck: 5 (Balanced loot and crits)

Key Perks:
• Gun Nut (Intelligence) - Weapon crafting
• Armorer (Intelligence) - Armor crafting
• Local Leader (Charisma) - Settlement building
• Lone Wanderer (Charisma) - Solo survival
• Scrapper (Intelligence) - Better materials
• Scrounger (Luck) - More ammo

Recommended Weapons:
• Combat Rifle (versatile)
• Shotgun (close combat)
• Laser weapons (energy option)

Playstyle Tips:
• Adapt to different situations
• Focus on crafting and settlement building
• Use companions when needed
• Balance stealth and direct combat
• Invest in multiple weapon types`
         };
         
         // Analyze prompt and select appropriate build
         const lowerPrompt = prompt.toLowerCase();
         
         if (lowerPrompt.includes('sniper') || lowerPrompt.includes('rifle') || lowerPrompt.includes('long range')) {
            return builds.sniper;
         } else if (lowerPrompt.includes('melee') || lowerPrompt.includes('close') || lowerPrompt.includes('brute') || lowerPrompt.includes('sledge')) {
            return builds.melee;
         } else if (lowerPrompt.includes('charismatic') || lowerPrompt.includes('leader') || lowerPrompt.includes('settlement') || lowerPrompt.includes('build')) {
            return builds.leader;
         } else if (lowerPrompt.includes('stealth') || lowerPrompt.includes('sneak') || lowerPrompt.includes('assassin') || lowerPrompt.includes('silent')) {
            return builds.stealth;
         } else {
            return builds.default;
         }
      }
      
      function generateBackstoryFromPrompt(prompt) {
         // Create a seed based on prompt + current time for uniqueness
         const seed = prompt.toLowerCase().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
         }, Date.now());
         
         // Simple seeded random number generator
         function seededRandom(seed) {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
         }
         
         // Get random element from array using seed
         function getRandomElement(array, seed) {
            const index = Math.floor(seededRandom(seed) * array.length);
            return array[index];
         }
         
         // Character name generators
         const firstNames = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Avery', 'Quinn', 'Blake', 'Sage', 'River', 'Phoenix', 'Skyler', 'Dakota', 'Cameron'];
         const lastNames = ['Stone', 'Rivers', 'Winters', 'Storm', 'Black', 'Gray', 'Fox', 'Wolf', 'Hawk', 'Reed', 'Banks', 'Cross', 'Frost', 'Moon', 'Star'];
         
         // Background elements
         const preWarJobs = ['engineer', 'teacher', 'soldier', 'nurse', 'mechanic', 'scientist', 'business owner', 'artist', 'musician', 'chef', 'lawyer', 'pilot'];
         const locations = ['Boston', 'Cambridge', 'Lexington', 'Concord', 'Salem', 'Gloucester', 'Marblehead', 'Quincy', 'Newton', 'Brookline'];
         const turningPoints = [
            'witnessed the death of a loved one',
            'discovered a hidden truth about your past',
            'found an old family heirloom',
            'met someone who changed your perspective',
            'survived a near-death experience',
            'made a choice that haunted you',
            'discovered you had a hidden talent',
            'learned something that shattered your worldview'
         ];
         
         const motivations = [
            'seeking redemption for past mistakes',
            'protecting those who cannot protect themselves',
            'finding your place in the world',
            'uncovering the truth about your origins',
            'building something better than what was lost',
            'proving your worth to yourself and others',
            'making amends for a terrible choice',
            'discovering what it means to be human'
         ];
         
         const skills = [
            'expert marksmanship with pistols',
            'exceptional hand-to-hand combat',
            'brilliant tactical mind',
            'natural leadership abilities',
            'incredible survival instincts',
            'masterful lockpicking skills',
            'superior hacking abilities',
            'exceptional charisma and persuasion',
            'advanced medical knowledge',
            'expertise with explosives',
            'superior stealth and infiltration',
            'masterful bartering and negotiation'
         ];
         
         const personalityTraits = [
            'fiercely loyal to those you trust',
            'haunted by past decisions',
            'driven by an unshakeable moral code',
            'struggling with inner demons',
            'possessing an unquenchable thirst for knowledge',
            'burdened by survivor\'s guilt',
            'motivated by a desire to protect the innocent',
            'seeking to prove your worth',
            'driven by a need for justice',
            'possessing an iron will and determination',
            'struggling with trust issues',
            'motivated by a quest for truth'
         ];
         
         const currentGoals = [
            'establishing a safe haven for survivors',
            'hunting down those who wronged you',
            'discovering the fate of your family',
            'building a new community from the ashes',
            'uncovering the secrets of the old world',
            'protecting a specific group of people',
            'seeking revenge against your enemies',
            'finding a cure for radiation sickness',
            'restoring hope to the wasteland',
            'proving that humanity can be better'
         ];
         
         // Generate character details
         const firstName = getRandomElement(firstNames, seed + 1);
         const lastName = getRandomElement(lastNames, seed + 2);
         const preWarJob = getRandomElement(preWarJobs, seed + 3);
         const location = getRandomElement(locations, seed + 4);
         const turningPoint = getRandomElement(turningPoints, seed + 5);
         const motivation = getRandomElement(motivations, seed + 6);
         const skill = getRandomElement(skills, seed + 7);
         const personality = getRandomElement(personalityTraits, seed + 8);
         const goal = getRandomElement(currentGoals, seed + 9);
         
         // Determine character type based on prompt
         const lowerPrompt = prompt.toLowerCase();
         let characterType = 'survivor';
         let emoji = '🌟';
         
         if (lowerPrompt.includes('raider') || lowerPrompt.includes('ex-raider') || lowerPrompt.includes('regretful') || lowerPrompt.includes('redemption') || lowerPrompt.includes('guilt')) {
            characterType = 'redeemed raider';
            emoji = '🔥';
         } else if (lowerPrompt.includes('scientist') || lowerPrompt.includes('smart') || lowerPrompt.includes('scared') || lowerPrompt.includes('avoids') || lowerPrompt.includes('research') || lowerPrompt.includes('intelligent') || lowerPrompt.includes('nerd')) {
            characterType = 'fearful scientist';
            emoji = '🧪';
         } else if (lowerPrompt.includes('vault') || lowerPrompt.includes('dweller') || lowerPrompt.includes('outcast') || lowerPrompt.includes('vault-tec') || lowerPrompt.includes('underground')) {
            characterType = 'vault outcast';
            emoji = '🏠';
         } else if (lowerPrompt.includes('mercenary') || lowerPrompt.includes('hired') || lowerPrompt.includes('professional') || lowerPrompt.includes('contractor') || lowerPrompt.includes('soldier') || lowerPrompt.includes('military')) {
            characterType = 'professional mercenary';
            emoji = '💰';
         } else if (lowerPrompt.includes('brotherhood') || lowerPrompt.includes('steel') || lowerPrompt.includes('paladin') || lowerPrompt.includes('knight') || lowerPrompt.includes('outcast') || lowerPrompt.includes('betrayal') || lowerPrompt.includes('maxson') || lowerPrompt.includes('elder') || lowerPrompt.includes('scribe') || lowerPrompt.includes('initiate')) {
            characterType = 'brotherhood outcast';
            emoji = '⚔️';
         } else if (lowerPrompt.includes('minutemen') || lowerPrompt.includes('general') || lowerPrompt.includes('militia') || lowerPrompt.includes('settlement') || lowerPrompt.includes('freedom') || lowerPrompt.includes('liberty') || lowerPrompt.includes('patriot') || lowerPrompt.includes('garvey')) {
            characterType = 'minutemen veteran';
            emoji = '🎖️';
         } else if (lowerPrompt.includes('railroad') || lowerPrompt.includes('freedom') || lowerPrompt.includes('underground') || lowerPrompt.includes('spy') || lowerPrompt.includes('agent') || lowerPrompt.includes('deacon') || lowerPrompt.includes('glory') || lowerPrompt.includes('tinker')) {
            characterType = 'railroad operative';
            emoji = '🚂';
         } else if (lowerPrompt.includes('institute') || lowerPrompt.includes('director') || lowerPrompt.includes('scientist') || lowerPrompt.includes('division') || lowerPrompt.includes('courser') || lowerPrompt.includes('x6-88') || lowerPrompt.includes('father') || lowerPrompt.includes('shaun')) {
            characterType = 'institute defector';
            emoji = '🏛️';
         } else if (lowerPrompt.includes('enclave') || lowerPrompt.includes('president') || lowerPrompt.includes('colonel') || lowerPrompt.includes('autumn') || lowerPrompt.includes('eden') || lowerPrompt.includes('oilrig') || lowerPrompt.includes('navarro') || lowerPrompt.includes('remnants')) {
            characterType = 'enclave remnant';
            emoji = '🦅';
         } else if (lowerPrompt.includes('ncr') || lowerPrompt.includes('republic') || lowerPrompt.includes('ranger') || lowerPrompt.includes('trooper') || lowerPrompt.includes('bear') || lowerPrompt.includes('kimball') || lowerPrompt.includes('hanlon') || lowerPrompt.includes('mojave')) {
            characterType = 'ncr veteran';
            emoji = '🐻';
         } else if (lowerPrompt.includes('legion') || lowerPrompt.includes('caesar') || lowerPrompt.includes('legate') || lowerPrompt.includes('centurion') || lowerPrompt.includes('lanius') || lowerPrompt.includes('vulpes') || lowerPrompt.includes('slaver') || lowerPrompt.includes('crucifixion')) {
            characterType = 'legion deserter';
            emoji = '⚡';
         } else if (lowerPrompt.includes('followers') || lowerPrompt.includes('apocalypse') || lowerPrompt.includes('doctor') || lowerPrompt.includes('research') || lowerPrompt.includes('knowledge') || lowerPrompt.includes('boneyard') || lowerPrompt.includes('julie') || lowerPrompt.includes('arcade')) {
            characterType = 'followers scholar';
            emoji = '📚';
         } else if (lowerPrompt.includes('great') || lowerPrompt.includes('khans') || lowerPrompt.includes('tribe') || lowerPrompt.includes('biker') || lowerPrompt.includes('drug') || lowerPrompt.includes('raider') || lowerPrompt.includes('jackal') || lowerPrompt.includes('vipers')) {
            characterType = 'tribal warrior';
            emoji = '🏍️';
         } else if (lowerPrompt.includes('ghoul') || lowerPrompt.includes('radiation') || lowerPrompt.includes('immortal') || lowerPrompt.includes('ancient') || lowerPrompt.includes('decayed') || lowerPrompt.includes('mutant') || lowerPrompt.includes('feral') || lowerPrompt.includes('glowing')) {
            characterType = 'ancient ghoul';
            emoji = '☢️';
         } else if (lowerPrompt.includes('synth') || lowerPrompt.includes('android') || lowerPrompt.includes('robot') || lowerPrompt.includes('artificial') || lowerPrompt.includes('institute') || lowerPrompt.includes('synthetic') || lowerPrompt.includes('gen3') || lowerPrompt.includes('nick')) {
            characterType = 'awakened synth';
            emoji = '🤖';
         } else if (lowerPrompt.includes('trader') || lowerPrompt.includes('merchant') || lowerPrompt.includes('business') || lowerPrompt.includes('caravan') || lowerPrompt.includes('caps') || lowerPrompt.includes('deal') || lowerPrompt.includes('barter') || lowerPrompt.includes('vendor')) {
            characterType = 'wandering merchant';
            emoji = '💼';
         } else if (lowerPrompt.includes('mechanic') || lowerPrompt.includes('engineer') || lowerPrompt.includes('repair') || lowerPrompt.includes('fix') || lowerPrompt.includes('scrap') || lowerPrompt.includes('workshop') || lowerPrompt.includes('tinker') || lowerPrompt.includes('jury')) {
            characterType = 'scrap mechanic';
            emoji = '🔧';
         } else if (lowerPrompt.includes('doctor') || lowerPrompt.includes('medic') || lowerPrompt.includes('healer') || lowerPrompt.includes('medical') || lowerPrompt.includes('hospital') || lowerPrompt.includes('nurse') || lowerPrompt.includes('surgeon') || lowerPrompt.includes('chemist')) {
            characterType = 'wasteland healer';
            emoji = '🏥';
         } else if (lowerPrompt.includes('super') || lowerPrompt.includes('mutant') || lowerPrompt.includes('behemoth') || lowerPrompt.includes('master') || lowerPrompt.includes('unity') || lowerPrompt.includes('mariposa') || lowerPrompt.includes('nightkin') || lowerPrompt.includes('mutie')) {
            characterType = 'mutant outcast';
            emoji = '🧬';
         } else if (lowerPrompt.includes('vault') || lowerPrompt.includes('dweller') || lowerPrompt.includes('outcast') || lowerPrompt.includes('vault-tec') || lowerPrompt.includes('underground') || lowerPrompt.includes('experiment') || lowerPrompt.includes('overseer') || lowerPrompt.includes('security')) {
            characterType = 'vault outcast';
            emoji = '🏠';
         }
         
         // Generate unique backstory
         const backstory = `${emoji} THE ${characterType.toUpperCase()}
                      
Before the bombs fell, you were ${firstName} ${lastName}, a ${preWarJob} living in ${location}. Your life was ordinary until the day everything changed. You ${turningPoint}, and that moment has defined everything you've become.

Now, you wander the wasteland ${motivation}. Your ${skill} has kept you alive when others have fallen, but it's your ${personality} that drives you forward through the chaos.

The wasteland has taught you that survival requires more than just strength - it requires purpose. You're currently focused on ${goal}, and every decision you make brings you closer to that goal.

Your past in ${location} feels like a distant dream, but the lessons you learned there still guide you. The person you were before the war is gone, but the core of who you are remains - ${personality}.

The Commonwealth is your home now, and you're determined to make it a better place, one choice at a time.`;

         return backstory;
      }
      
      // Global Search Functionality
      document.addEventListener('DOMContentLoaded', function() {
         const searchInput = document.getElementById('global-search');
         const searchResults = document.getElementById('search-results');
         const clearBtn = document.getElementById('clear-search');
         let searchTimeout;
         
         if (searchInput && searchResults && clearBtn) {
            searchInput.addEventListener('input', function() {
               clearTimeout(searchTimeout);
               const query = this.value.trim();
               
               if (query.length < 2) {
                  hideSearchResults();
                  return;
               }
               
               searchTimeout = setTimeout(() => {
                  performSearch(query);
               }, 300);
            });
            
            clearBtn.addEventListener('click', function() {
               searchInput.value = '';
               hideSearchResults();
               searchInput.focus();
            });
            
            // Hide results when clicking outside
            document.addEventListener('click', function(e) {
               if (!e.target.closest('.search-container')) {
                  hideSearchResults();
               }
            });
         }
      });
      
      function performSearch(query) {
         const results = [];
         const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
         
         // Search through all content sections
         const searchableElements = document.querySelectorAll('.tab-content, .terminal-list-item, .info-card, .ai-feature-box, .collapsible-content, .sub-collapsible-content');
         
         searchableElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            const title = element.querySelector('h1, h2, h3, h4, h5, h6, .card-header, .collapsible-header')?.textContent || '';
            const section = getSectionName(element);
            
            // Check if all search terms are found
            const matches = searchTerms.every(term => text.includes(term));
            
            if (matches) {
               const preview = getTextPreview(element.textContent, query);
               const relevance = calculateRelevance(text, title, query);
               
               results.push({
                  element: element,
                  title: title || 'Content Section',
                  preview: preview,
                  section: section,
                  relevance: relevance
               });
            }
         });
         
         // Sort by relevance
         results.sort((a, b) => b.relevance - a.relevance);
         
         displaySearchResults(results, query);
      }
      
      function getSectionName(element) {
         // Try to find the section name from various selectors
         const tabContent = element.closest('.tab-content');
         if (tabContent) {
            const tabButton = document.querySelector(`[data-tab="${tabContent.id}"]`);
            if (tabButton) {
               return tabButton.textContent.trim();
            }
         }
         
         const collapsible = element.closest('.collapsible-section');
         if (collapsible) {
            const header = collapsible.querySelector('.collapsible-header');
            if (header) {
               return header.textContent.replace(/[^\w\s]/g, '').trim();
            }
         }
         
         return 'Guide Content';
      }
      
      function getTextPreview(text, query) {
         const maxLength = 150;
         const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());
         
         if (queryIndex === -1) {
            return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
         }
         
         const start = Math.max(0, queryIndex - 50);
         const end = Math.min(text.length, start + maxLength);
         let preview = text.substring(start, end);
         
         if (start > 0) preview = '...' + preview;
         if (end < text.length) preview = preview + '...';
         
         return preview;
      }
      
      function calculateRelevance(text, title, query) {
         let score = 0;
         const queryLower = query.toLowerCase();
         const textLower = text.toLowerCase();
         const titleLower = title.toLowerCase();
         
         // Title matches are worth more
         if (titleLower.includes(queryLower)) score += 10;
         
         // Exact phrase matches
         if (textLower.includes(queryLower)) score += 5;
         
         // Word boundary matches
         const words = queryLower.split(' ');
         words.forEach(word => {
            if (titleLower.includes(word)) score += 3;
            if (textLower.includes(word)) score += 1;
         });
         
         return score;
      }
      
      function displaySearchResults(results, query) {
         const searchResults = document.getElementById('search-results');
         const clearBtn = document.getElementById('clear-search');
         
         if (!searchResults || !clearBtn) return;
         
         if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No results found for "' + query + '"</div>';
         } else {
            let html = `<div class="search-stats">${results.length} result${results.length !== 1 ? 's' : ''} found</div>`;
            
            results.slice(0, 10).forEach((result, index) => {
               const highlightedPreview = highlightText(result.preview, query);
               const highlightedTitle = highlightText(result.title, query);
               
               html += `
                  <div class="search-result-item" onclick="navigateToSearchResult(${index})">
                     <div class="search-result-title">${highlightedTitle}</div>
                     <div class="search-result-preview">${highlightedPreview}</div>
                     <div class="search-result-section">${result.section}</div>
                  </div>
               `;
            });
            
            searchResults.innerHTML = html;
            
            // Store results globally for navigation
            window.searchResults = results;
         }
         
         searchResults.style.display = 'block';
         clearBtn.style.display = 'block';
      }
      
      function highlightText(text, query) {
         if (!query) return text;
         
         const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
         return text.replace(regex, '<span class="search-highlight">$1</span>');
      }
      
      function hideSearchResults() {
         const searchResults = document.getElementById('search-results');
         const clearBtn = document.getElementById('clear-search');
         
         if (searchResults) searchResults.style.display = 'none';
         if (clearBtn) clearBtn.style.display = 'none';
      }
      
      function navigateToSearchResult(resultIndex) {
         if (!window.searchResults || !window.searchResults[resultIndex]) {
            hideSearchResults();
            return;
         }
         
         const result = window.searchResults[resultIndex];
         const element = result.element;
         
         // Find which tab this element belongs to
         const tabContent = element.closest('.tab-content');
         if (tabContent) {
            const tabId = tabContent.id;
            const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
            
            if (tabButton) {
               // Switch to the correct tab
               switchTab(tabId);
               
               // Wait for tab switch to complete, then navigate to element
               setTimeout(() => {
                  navigateToElement(element);
               }, 100);
            }
         } else {
            // If not in a tab, just navigate directly
            navigateToElement(element);
         }
         
         hideSearchResults();
      }
      
      function navigateToElement(element) {
         // If it's in a collapsible section, expand it first
         const collapsible = element.closest('.collapsible-section');
         if (collapsible) {
            const header = collapsible.querySelector('.collapsible-header');
            if (header) {
               const content = collapsible.querySelector('.collapsible-content');
               if (content && (content.style.display === 'none' || content.style.display === '')) {
                  toggleCollapsible(header);
               }
            }
         }
         
         // If it's in a sub-collapsible section, expand it too
         const subCollapsible = element.closest('.sub-collapsible');
         if (subCollapsible) {
            const header = subCollapsible.querySelector('.sub-collapsible-header');
            if (header) {
               const content = subCollapsible.querySelector('.sub-collapsible-content');
               if (content && (content.style.display === 'none' || content.style.display === '')) {
                  toggleSubCollapsible(header);
               }
            }
         }
         
         // Scroll to element
         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
         
         // Highlight the element briefly
         element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
         setTimeout(() => {
            element.style.backgroundColor = '';
         }, 2000);
      }
      
      function switchTab(tabId) {
         // Hide all tab contents
         const allTabContents = document.querySelectorAll('.tab-content');
         allTabContents.forEach(content => {
            content.classList.remove('active');
         });
         
         // Remove active class from all tab buttons
         const allTabButtons = document.querySelectorAll('.tab-button');
         allTabButtons.forEach(button => {
            button.classList.remove('active');
         });
         
         // Show the target tab content
         const targetTabContent = document.getElementById(tabId);
         if (targetTabContent) {
            targetTabContent.classList.add('active');
         }
         
         // Activate the target tab button
         const targetTabButton = document.querySelector(`[data-tab="${tabId}"]`);
         if (targetTabButton) {
            targetTabButton.classList.add('active');
         }
      }
      
      // Collapsible functionality for Step 5 sections
      function toggleCollapsible(header) {
         const content = header.nextElementSibling;
         const icon = header.querySelector('.collapsible-icon i');
         
         if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
         } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
         }
      }
      
      // Sub-collapsible functionality
      function toggleSubCollapsible(header) {
         const content = header.nextElementSibling;
         const icon = header.querySelector('.sub-collapsible-icon i');
         
         if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
         } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
         }
      }
      
      // Initialize collapsible sections - all closed by default
      document.addEventListener('DOMContentLoaded', function() {
         const collapsibleContents = document.querySelectorAll('.collapsible-content');
         collapsibleContents.forEach(content => {
            content.style.display = 'none';
         });
         
         const subCollapsibleContents = document.querySelectorAll('.sub-collapsible-content');
         subCollapsibleContents.forEach(content => {
            content.style.display = 'none';
         });
         
         // Initialize search functionality
         const searchInput = document.getElementById('step5Search');
         if (searchInput) {
            searchInput.addEventListener('input', performSearch);
         }
         
      });
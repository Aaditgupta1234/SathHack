
/* ========= DATA & STATE ========= */
const SAT = {
    events: [
        { id: 'e1', title: 'EDM Night', time: 'Today 8:00 PM', venue: 'Main Stage', tag: 'music', points: 15, desc: 'High-energy set with guest DJ.' },
        { id: 'e2', title: 'Robo Wars', time: 'Today 2:00 PM', venue: 'LT-2 Arena', tag: 'tech', points: 20, desc: 'Robots battle in the arena.' },
        { id: 'e3', title: 'Hackathon Finals', time: 'Tomorrow 11:00 AM', venue: 'Auditorium', tag: 'tech', points: 25, desc: 'Top teams pitch to judges.' },
        { id: 'e4', title: 'Comedy Night', time: 'Tomorrow 7:30 PM', venue: 'Open Air Theatre', tag: 'fun', points: 10, desc: 'Standup acts from campus.' },
        { id: 'e5', title: 'Food Fest', time: 'Today 12:00 PM', venue: 'Food Court', tag: 'food', points: 8, desc: 'Stalls from around the city.' },
        { id: 'e6', title: 'Drone Show', time: 'Tomorrow 8:45 PM', venue: 'Football Ground', tag: 'show', points: 18, desc: 'Light formations in the sky.' },
    ],
    zones: [
        { id: 'z1', name: 'Main Stage', x: 18, y: 18, description: 'The main performance area with capacity for 5000+ people', icon: '🎵', mapQuery: 'Main Stage Thapar University' },
        { id: 'z2', name: 'Food Court', x: 58, y: 24, description: 'Multiple food stalls offering various cuisines', icon: '🍔', mapQuery: 'Food Court Thapar University' },
        { id: 'z3', name: 'LT-2 Arena', x: 14, y: 62, description: 'Technical competition venue with modern facilities', icon: '🤖', mapQuery: 'LT-2 Arena Thapar University' },
        { id: 'z4', name: 'Auditorium', x: 53, y: 66, description: 'Indoor venue for presentations and talks', icon: '🎤', mapQuery: 'Auditorium Thapar University' },
        { id: 'z5', name: 'OAT', x: 78, y: 44, description: 'Open Air Theatre for cultural performances', icon: '🎭', mapQuery: 'Open Air Theatre Thapar University' }
    ],
    rewards: [
        { id: 'r1', title: 'Free Coffee', cost: 30 },
        { id: 'r2', title: 'Merch ₹100 Off', cost: 60 },
        { id: 'r3', title: 'Backstage Pass', cost: 120 }
    ],
    qrCatalog: { // demo QR codes → points
        'SAT-EDM-15': { type: 'event', ref: 'e1', points: 15 },
        'SAT-ROBO-20': { type: 'event', ref: 'e2', points: 20 },
        'SAT-FOOD-5': { type: 'spot', ref: 'z2', points: 5 },
        'SAT-BONUS-25': { type: 'bonus', ref: 'any', points: 25 }
    }
};

const store = {
    get: (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def)),
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    remove: (k) => localStorage.removeItem(k)
};

const state = {
    view: 'home',
    user: store.get('sb_user', { name: 'Aadit', xp: 0, level: 1, plan: [], scans: [], zoneCounts: {}, reels: [] }),
    selectedRole: 'participant', // Default role selection
    isAdminView: false, // Track if admin is in admin view or user view
    selectedZone: null, // Currently selected zone for map modal
};

/* ========= AUTHENTICATION ========= */
const auth = {
    user: null,
    users: store.get('users', []),

    init() {
        // Check if user is already logged in
        const savedUser = store.get('currentUser');
        if (savedUser) {
            this.user = savedUser;
            this.updateUI();
        }

        // Add default admin if no users exist
        if (this.users.length === 0) {
            this.users.push({
                id: 'admin-1',
                name: 'Fest Admin',
                email: 'admin@festifyxr.com',
                password: 'admin123',
                role: 'admin'
            });
            store.set('users', this.users);
        }

        // Setup form handlers
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.signup();
            });
        }

        // Setup user menu
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', () => {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('active');
                }
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        const switchViewBtn = document.getElementById('switchViewBtn');
        if (switchViewBtn) {
            switchViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.classList.remove('active');
                }
            }
        });
    },

    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const role = state.selectedRole;

        const user = this.users.find(u =>
            u.email === email &&
            u.password === password &&
            u.role === role
        );

        if (user) {
            this.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            store.set('currentUser', this.user);

            // Set admin view based on role
            if (user.role === 'admin') {
                state.isAdminView = true;
            } else {
                state.isAdminView = false;
            }

            this.updateUI();
            hideAuth();
            toast(`Welcome back, ${user.name}!`);

            // Load user-specific data
            const userKey = `sb_user_${user.id}`;
            state.user = store.get(userKey, {
                name: user.name,
                xp: 0,
                level: 1,
                plan: [],
                scans: [],
                zoneCounts: {},
                reels: []
            });

            render();
        } else {
            toast('Invalid credentials or user not found');
        }
    },

    signup() {
        console.log('Signup CALLED');
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const role = state.selectedRole;

        // Check if user already exists
        if (this.users.some(u => u.email === email)) {
            toast('Email already registered');
            return;
        }

        const newUser = {
            id: 'user-' + Date.now(),
            name,
            email,
            password,
            role
        };

        this.users.push(newUser);
        store.set('users', this.users);

        // Auto login after signup
        this.user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        };

        store.set('currentUser', this.user);

        // Set admin view based on role
        if (newUser.role === 'admin') {
            state.isAdminView = true;
        } else {
            state.isAdminView = false;
        }

        this.updateUI();
        hideAuth();
        toast(`Account created! Welcome, ${name}!`);

        // Initialize user data
        state.user = {
            name: name,
            xp: 0,
            level: 1,
            plan: [],
            scans: [],
            zoneCounts: {},
            reels: []
        };
        store.set(`sb_user_${newUser.id}`, state.user);

        render();
    },

    logout() {
        // Clear current user
        this.user = null;
        store.remove('currentUser');

        // Reset view state
        state.isAdminView = false;
        state.view = 'home';

        // Update UI
        this.updateUI();

        // Show login screen
        showAuth();
        toast('You have been logged out');
    },

    switchView() {
        if (this.user && this.user.role === 'admin') {
            state.isAdminView = !state.isAdminView;

            if (state.isAdminView) {
                state.view = 'admin';
                document.getElementById('switchViewBtn').textContent = 'Switch to User View';
            } else {
                state.view = 'home';
                document.getElementById('switchViewBtn').textContent = 'Switch to Admin View';
            }

            // Update navigation
            qsa('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));

            // Close dropdown
            document.getElementById('userDropdown').classList.remove('active');

            render();
            toast(`Switched to ${state.isAdminView ? 'Admin' : 'User'} View`);
        }
    },

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const adminBtn = document.getElementById('adminBtn');
        const userAvatar = document.getElementById('userAvatar');
        const switchViewBtn = document.getElementById('switchViewBtn');

        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userAvatar) userAvatar.textContent = this.user.name.charAt(0).toUpperCase();

            if (this.user.role === 'admin') {
                if (adminBtn) adminBtn.style.display = 'block';
                if (switchViewBtn) {
                    switchViewBtn.style.display = 'block';
                    switchViewBtn.textContent = state.isAdminView ? 'Switch to User View' : 'Switch to Admin View';
                }
            } else {
                if (adminBtn) adminBtn.style.display = 'none';
                if (switchViewBtn) switchViewBtn.style.display = 'none';
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
            if (switchViewBtn) switchViewBtn.style.display = 'none';
        }
    }
};

/* ========= CHATBOT ========= */
let chatInitialized = false;

function initChat() {
    if (chatInitialized) return;
    chatInitialized = true;

    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    // Clear previous content
    chatContainer.innerHTML = '';

    const userName = auth.user ? auth.user.name : 'there';

    // Add welcome message
    addChatBubble(`Hey ${userName}! I'm FestifyXR 👋`);

    setTimeout(() => {
        addChatBubble("Try asking me about events, your points, or navigation. Here are some examples:");
        showSuggestions();
    }, 1000);
}

function addChatBubble(text, who = 'bot') {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${who === 'me' ? 'me' : 'bot'}`;
    bubble.textContent = text;

    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showSuggestions() {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggestions';
    suggestionsDiv.innerHTML = `
    <div class="suggestion" onclick="useSuggestion(this)">What's my XP?</div>
    <div class="suggestion" onclick="useSuggestion(this)">Navigate to Main Stage</div>
    <div class="suggestion" onclick="useSuggestion(this)">What events are happening?</div>
    <div class="suggestion" onclick="useSuggestion(this)">What's my plan?</div>
  `;

    chatContainer.appendChild(suggestionsDiv);
}

function useSuggestion(element) {
    const text = element.textContent;
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = text;
        sendChatMessage();
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (!message) return;

    addChatBubble(message, 'me');
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Process and respond to the message
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateChatResponse(message);
        addChatBubble(response, 'bot');
    }, 800 + Math.random() * 800);
}

function showTypingIndicator() {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator active';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
    <span>FestifyXR is typing</span>
    <span class="typing-dots"></span>
    <span class="typing-dots"></span>
    <span class="typing-dots"></span>
  `;

    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function generateChatResponse(question) {
    const q = question.toLowerCase();

    // Check for XP/points related questions
    if (/xp|points|score|how many points/.test(q)) {
        const responses = [
            `You have ${state.user.xp} XP and are Level ${state.user.level}. Keep going!`,
            `Current XP: ${state.user.xp} | Level: ${state.user.level}`,
            `You've earned ${state.user.xp} XP so far. Great job!`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check for navigation related questions
    if (/navigate|route|where|direction|how to get to/.test(q)) {
        const event = SAT.events.find(e => q.includes(e.title.toLowerCase())) || null;
        if (event) {
            setTimeout(() => navToVenue(event.venue), 1000);
            return `Opening navigation to ${event.venue} for ${event.title}.`;
        }

        const zone = SAT.zones.find(z => q.includes(z.name.toLowerCase()));
        if (zone) {
            setTimeout(() => navToVenue(zone.name), 1000);
            return `Opening navigation to ${zone.name}.`;
        }

        const responses = [
            `Tell me the event or venue, e.g., "navigate to Main Stage".`,
            `Which venue would you like to navigate to?`,
            `I can help you navigate to any event or venue. Just tell me the name.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check for events related questions
    if (/events|show|list|what's happening|what events/.test(q)) {
        const tag = ['music', 'tech', 'fun', 'food', 'show'].find(t => q.includes(t));
        const pool = tag ? SAT.events.filter(e => e.tag === tag) : SAT.events;

        if (pool.length > 0) {
            const eventList = pool.slice(0, 3).map(e => `${e.title} (${e.time})`).join(', ');
            return `Here are some events: ${eventList}`;
        } else {
            return `I couldn't find any events matching your query.`;
        }
    }

    // Check for schedule/plan related questions
    if (/schedule|plan|my plan|what am i doing|what's my schedule/.test(q)) {
        const plannedEvents = SAT.events.filter(e => state.user.plan.includes(e.id));
        if (plannedEvents.length > 0) {
            const planList = plannedEvents.map(e => `${e.title} at ${e.time}`).join(', ');
            return `You planned: ${planList}`;
        } else {
            return `Your plan is empty. Add some events from the Events tab!`;
        }
    }

    // Check for rewards related questions
    if (/rewards|what can i get|redeem|what rewards/.test(q)) {
        const affordableRewards = SAT.rewards.filter(r => state.user.xp >= r.cost);
        if (affordableRewards.length > 0) {
            const rewardList = affordableRewards.map(r => `${r.title} (${r.cost} XP)`).join(', ');
            return `You can redeem: ${rewardList}`;
        } else {
            return `You need more XP to redeem rewards. Keep scanning QR codes!`;
        }
    }

    // Check for greetings
    if (/help|hi|hello|hey|how are you|good morning|good afternoon|good evening/.test(q)) {
        const userName = auth.user ? auth.user.name : 'there';
        const greetings = [
            `Hey ${userName}! I'm FestifyXR 👋 Try "events for music", "my points", or "navigate to Main Stage".`,
            `Hello! I'm here to help with your festival experience.`,
            `Hi there! Ask me about events, points, navigation, or your schedule.`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Check for thanks
    if (/thank|thanks|thank you|appreciate it/.test(q)) {
        const responses = [
            `You're welcome! Let me know if you need anything else.`,
            `Happy to help! Enjoy the festival!`,
            `No problem! Have a great time at the festival!`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check for help
    if (/what can you do|help me|how do you work|capabilities/.test(q)) {
        return `I can help you with:
- Checking your XP and level
- Navigating to events and venues
- Finding events by category
- Viewing your planned schedule
- Checking available rewards
- And much more! Just ask me anything about the festival.`;
    }

    // Default response
    const defaultResponses = [
        `I'm not sure how to respond to that. Try asking about events, points, or navigation.`,
        `I'm still learning! Try "my points", "events for music", or "navigate to Main Stage".`,
        `Hmm, I didn't understand that. Can you try asking differently?`
    ];
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/* ========= AUTH UI FUNCTIONS ========= */
function showAuth() {
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    document.querySelector('footer').style.display = 'none';

    selectRole('participant');

    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
}

function hideAuth() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.querySelector('footer').style.display = 'block';
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.querySelector('.auth-tab:nth-child(1)');
    const signupTab = document.querySelector('.auth-tab:nth-child(2)');
    const authFooterText = document.getElementById('authFooterText');

    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        authFooterText.innerHTML = 'Don\'t have an account? <a href="#" onclick="switchAuthTab(\'signup\')">Sign up</a>';
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
        authFooterText.innerHTML = 'Already have an account? <a href="#" onclick="switchAuthTab(\'login\')">Login</a>';
    }
}

function selectRole(role) {
    state.selectedRole = role;

    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        if (option.dataset.role === role) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

/* ========= UTIL ========= */
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
function toast(msg, ms = 2200) { const t = qs('#toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', ms); }
function setXP(delta) {
    state.user.xp = Math.max(0, (state.user.xp || 0) + delta);
    const level = Math.floor(1 + state.user.xp / 100);
    state.user.level = level;

    if (auth.user) {
        store.set(`sb_user_${auth.user.id}`, state.user);
    }

    qs('#xpFoot').textContent = state.user.xp;
}
function greet() {
    const h = new Date().getHours();
    const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const name = auth.user ? auth.user.name : state.user.name;
    qs('#greet').textContent = `Good ${part}, ${name}!`;
}
function pickHeatClass(n) { return n >= 40 ? 'heat-4' : n >= 28 ? 'heat-3' : n >= 16 ? 'heat-2' : n >= 6 ? 'heat-1' : 'heat-0'; }
function ensureZoneCounts() {
    if (!state.user.zoneCounts) state.user.zoneCounts = {};
    SAT.zones.forEach(z => { if (!(z.id in state.user.zoneCounts)) state.user.zoneCounts[z.id] = Math.floor(Math.random() * 14); });
    store.set('sb_user', state.user);
}

/* ========= ROUTER ========= */
const VIEWS = {
    home() {
        return `
    <div class="grid grid-3">
      <section class="card">
        <h3>Today at a glance ✨</h3>
        <div class="body">
          <div class="kpis">
            <div class="kpi"><div class="muted">XP</div><b>${state.user.xp}</b><div class="muted">Level ${state.user.level}</div></div>
            <div class="kpi"><div class="muted">My Events</div><b>${state.user.plan.length}</b><div class="muted">planned</div></div>
            <div class="kpi"><div class="muted">Rewards</div><b>${SAT.rewards.length}</b><div class="muted">available</div></div>
          </div>
          <div style="height:12px"></div>
          <div class="row">
            <button class="btn" onclick="goto('events')">Browse Events</button>
            <button class="btn alt" onclick="openQR()">Scan QR</button>
            <button class="btn ghost" onclick="goto('map')">Live Crowd Map</button>
          </div>
        </div>
      </section>
      <section class="card">
        <h3>Quick Recommendations 🧠</h3>
        <div class="body list">
          ${recommend().map(ev => eventLine(ev, true)).join('')}
        </div>
      </section>
      <section class="card">
        <h3>Announcements 📣</h3>
        <div class="body">
          <ul>
            <li>Food Court happy hour 4–5 PM (double XP on scans!)</li>
            <li>Drone Show rehearsal at 6 PM near Football Ground.</li>
            <li>Use <span class="tag">SAT-BONUS-25</span> once per user 😉</li>
          </ul>
        </div>
      </section>
    </div>
  `;
    },
    events() {
        const q = (qs('#search').value || '').toLowerCase();
        const filtered = SAT.events.filter(e => e.title.toLowerCase().includes(q) || e.tag.includes(q));
        return `
      <section class="card">
        <h3>All Events</h3>
        <div class="body list">
          ${filtered.map(e => `
            <div class="item">
              <div class="meta">
                <b>${e.title}</b>
                <span class="muted">${e.time} · ${e.venue} · <span class="tag">${e.tag}</span></span>
              </div>
              <div class="row">
                <span class="pill">+${e.points} XP</span>
                ${state.user.plan.includes(e.id)
                ? `<button class="btn ghost" onclick="removeFromPlan('${e.id}')">Remove</button>`
                : `<button class="btn" onclick="addToPlan('${e.id}')">Add</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
    },
    plan() {
        const planned = SAT.events.filter(e => state.user.plan.includes(e.id));
        return `
      <section class="card">
        <h3>My Plan</h3>
        <div class="body list">
          ${planned.length ? planned.map(e => `
            <div class="item">
              <div class="meta">
                <b>${e.title}</b>
                <span class="muted">${e.time} · ${e.venue}</span>
              </div>
              <div class="row">
                <button class="btn ghost" onclick="navToVenue('${e.venue}')">Navigate</button>
                <button class="btn" onclick="checkInEvent('${e.id}')">Check-in (+${e.points} XP)</button>
                <button class="btn ghost" onclick="removeFromPlan('${e.id}')">Remove</button>
              </div>
            </div>
          `).join('') : `<div class="muted">No events yet. Go to <a class="inline" href="#" onclick="goto('events')">Events</a> to add some.</div>`}
        </div>
      </section>
    `;
    },
    map() {
        ensureZoneCounts();
        return `
      <section class="card">
        <h3>Live Crowd Heatmap</h3>
        <div class="body">
          <div class="toolbar">
            <button class="btn" onclick="pingHere()">I am here (contribute)</button>
            <button class="btn ghost" onclick="decrowd()">Clear crowd (demo)</button>
          </div>
          <div style="height:10px"></div>
          <div class="heatmap" id="heat">
            ${SAT.zones.map(z => {
            const n = state.user.zoneCounts[z.id] || 0;
            return `
                <div class="zone ${pickHeatClass(n)}" style="left:${z.x}%; top:${z.y}%" onclick="showZoneInfo('${z.id}')">
                  <span class="badge">${n}</span>
                  ${z.name}
                </div>
              `;
        }).join('')}
          </div>
          <div style="height:10px"></div>
          <div class="muted">Tip: press "I am here" near a zone to simulate anonymous pings. Colors: green → calm, red → crowded. Click on any zone to see details and navigate.</div>
        </div>
      </section>
    `;
    },
    rewards() {
        const scans = state.user.scans || [];
        return `
      <div class="grid grid-2">
        <section class="card">
          <h3>Rewards Center 🎁</h3>
          <div class="body list">
            ${SAT.rewards.map(r => `
              <div class="item">
                <div class="meta"><b>${r.title}</b><span class="muted">${r.cost} XP</span></div>
                <div class="row">
                  <button class="btn" ${state.user.xp < r.cost ? 'disabled' : ''} onclick="redeem('${r.id}')">Redeem</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
        <section class="card">
          <h3>Scan History</h3>
          <div class="body list">
            ${scans.length ? scans.slice().reverse().map(s => `
              <div class="item">
                <div class="meta"><b>${s.code}</b><span class="muted">${s.time}</span></div>
                <span class="pill">+${s.points} XP</span>
              </div>
            `).join('') : `<div class="muted">No scans yet. Use the <b>Scan QR</b> button below.</div>`}
          </div>
        </section>
      </div>
    `;
    },

    buddy() {
        return `
      <div class="grid grid-2">
        <section class="card">
          <div class="chat-header">
            <div class="chat-status"></div>
            <h3>FestifyXR Assistant</h3>
          </div>
          <div class="body">
            <div class="chat" id="chat"></div>
            <div class="inputbar">
              <input id="chatInput" placeholder="Ask me anything: 'Where is Robo Wars?' 'What's my XP?'" onkeydown="if(event.key==='Enter') sendChatMessage()">
              <button class="btn" onclick="sendChatMessage()">Send</button>
              <button class="btn alt" id="voiceBtn" onclick="toggleVoice()">🎙️ Voice</button>
            </div>
            <div style="height:8px"></div>
            <div class="row muted">
              <span class="tag">try: "events for music"</span>
              <span class="tag">"navigate to Main Stage"</span>
              <span class="tag">"my points?"</span>
            </div>
          </div>
        </section>
        <section class="card">
          <h3>Quick Actions</h3>
          <div class="body list">
            <div class="item"><div class="meta"><b>AR Poster (demo)</b><span class="muted">Open camera & overlay info (mock)</span></div><button class="btn ghost" onclick="demoAR()">Try</button></div>
            <div class="item"><div class="meta"><b>Lost & Found (demo)</b><span class="muted">Image similarity mock</span></div><button class="btn ghost" onclick="lostFound()">Open</button></div>
            <div class="item"><div class="meta"><b>Invite Friends</b><span class="muted">Share this page URL</span></div><span class="pill">No login needed</span></div>
          </div>
        </section>
      </div>
    `;
    },
    reel() {
        return `
      <section class="card">
        <h3>Memory Reel Maker 🎞️</h3>
        <div class="body">
          <div class="row">
            <input type="file" id="reelFiles" accept="image/*" multiple>
            <button class="btn" onclick="previewReel()">Preview</button>
            <button class="btn alt" onclick="recordReel()">Export .webm</button>
          </div>
          <div style="height:10px"></div>
          <small class="hint">Tip: pick 5–10 images. We'll auto crossfade and add a subtle zoom effect. Exports entirely in-browser.</small>
          <div style="height:10px"></div>
          <canvas id="reelCanvas" width="800" height="450"></canvas>
        </div>
      </section>
    `;
    },
    admin() {
        if (!auth.user || auth.user.role !== 'admin') {
            return '<div class="card"><div class="body"><p>Access denied. Admin privileges required.</p></div></div>';
        }

        const users = auth.users;
        const participants = users.filter(u => u.role === 'participant');
        const admins = users.filter(u => u.role === 'admin');

        return `
      <div class="grid grid-2">
        <section class="card">
          <h3>User Management</h3>
          <div class="body">
            <div class="kpis">
              <div class="kpi"><div class="muted">Total Users</div><b>${users.length}</b></div>
              <div class="kpi"><div class="muted">Participants</div><b>${participants.length}</b></div>
              <div class="kpi"><div class="muted">Admins</div><b>${admins.length}</b></div>
            </div>
            <div style="height:16px"></div>
            <div class="toolbar">
              <button class="btn" onclick="exportUserData()">Export Data</button>
              <button class="btn alt" onclick="resetAllData()">Reset All Data</button>
            </div>
          </div>
        </section>
        
        <section class="card">
          <h3>Recent Activity</h3>
          <div class="body list">
            <div class="item">
              <div class="meta">
                <b>New user registration</b>
                <span class="muted">Just now</span>
              </div>
              <span class="pill">Participant</span>
            </div>
            <div class="item">
              <div class="meta">
                <b>QR code scanned</b>
                <span class="muted">5 mins ago</span>
              </div>
              <span class="pill">+15 XP</span>
            </div>
            <div class="item">
              <div class="meta">
                <b>Event check-in</b>
                <span class="muted">12 mins ago</span>
              </div>
              <span class="pill">EDM Night</span>
            </div>
          </div>
        </section>
        
        <section class="card">
          <h3>Participants</h3>
          <div class="body list">
            ${participants.map(u => `
              <div class="item">
                <div class="meta">
                  <b>${u.name}</b>
                  <span class="muted">${u.email}</span>
                </div>
                <div class="row">
                  <span class="pill">XP: ${store.get(`sb_user_${u.id}`, { xp: 0 }).xp}</span>
                  <button class="btn ghost" onclick="viewUserDetails('${u.id}')">View</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
        
        <section class="card">
          <h3>System Stats</h3>
          <div class="body">
            <div class="list">
              <div class="item">
                <div class="meta">
                  <b>Total Events</b>
                </div>
                <span class="pill">${SAT.events.length}</span>
              </div>
              <div class="item">
                <div class="meta">
                  <b>Total Scans</b>
                </div>
                <span class="pill">${users.reduce((sum, u) => sum + (store.get(`sb_user_${u.id}`, { scans: [] }).scans.length), 0)}</span>
              </div>
              <div class="item">
                <div class="meta">
                  <b>Active Zones</b>
                </div>
                <span class="pill">${SAT.zones.length}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
    }
};

function goto(view) {
    if (view === 'admin' && (!auth.user || auth.user.role !== 'admin' || !state.isAdminView)) {
        return;
    }

    state.view = view;
    qsa('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    render();

    if (view === 'buddy') {
        setTimeout(() => {
            initChat();
        }, 300);
    }
}
function render() {
    qs('#app').innerHTML = VIEWS[state.view]();
    qs('#xpFoot').textContent = state.user.xp;
    greet();
}

/* ========= FEATURES ========= */
function eventLine(e, compact = false) {
    return `
    <div class="item">
      <div class="meta">
        <b>${e.title}</b>
        <span class="muted">${e.time} · ${e.venue} · <span class="tag">${e.tag}</span></span>
      </div>
      <div class="row">
        <span class="pill">+${e.points} XP</span>
        ${state.user.plan.includes(e.id)
            ? `<button class="btn ghost" onclick="removeFromPlan('${e.id}')">Remove</button>`
            : `<button class="btn" onclick="addToPlan('${e.id}')">Add</button>`}
      </div>
    </div>
  `;
}
function recommend() {
    return SAT.events
        .filter(e => !state.user.plan.includes(e.id))
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);
}
function addToPlan(id) {
    if (!state.user.plan.includes(id)) state.user.plan.push(id);
    store.set('sb_user', state.user);
    toast('Added to plan ✅');
    render();
}
function removeFromPlan(id) {
    state.user.plan = state.user.plan.filter(x => x !== id);
    store.set('sb_user', state.user);
    render();
}
function navToVenue(venue) {
    toast(`Opening navigation to ${venue}…`);
    const q = encodeURIComponent(venue + ' Thapar University');
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}
function checkInEvent(id) {
    const e = SAT.events.find(x => x.id === id);
    if (!e) return;
    setXP(e.points);
    logScan({ code: `CHECKIN-${id}`, points: e.points });
    toast(`Checked in to ${e.title}! +${e.points} XP 🎉`);
    render();
}

/* ========= QR SCAN ========= */
let camStream = null;
function openQR() {
    const code = prompt("Demo QR: try SAT-EDM-15, SAT-ROBO-20, SAT-FOOD-5, SAT-BONUS-25\n\n(Optional) Enter code manually:");
    if (code) { processQR(code.trim()); return; }
    if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
            camStream = stream;
            const w = window.open('', '_blank', 'width=420,height=420');
            w.document.write(`<title>QR Preview</title><video id="v" autoplay playsinline style="width:100%;background:#000"></video><div style="padding:8px;font-family:sans-serif">Point at code, then type it here:<br><input id="code" style="width:100%;padding:8px"><button onclick="opener.processQR(document.getElementById('code').value);window.close()">Submit</button></div>`);
            const vid = w.document.getElementById('v');
            vid.srcObject = stream;
            w.onbeforeunload = () => { try { stream.getTracks().forEach(t => t.stop()) } catch { } };
        }).catch(() => promptCode());
    } else promptCode();
}
function promptCode() {
    const code = prompt("Enter QR code:");
    if (code) processQR(code.trim());
}
function processQR(code) {
    const entry = SAT.qrCatalog[code];
    if (!entry) { toast('Invalid QR'); return; }
    if ((state.user.scans || []).find(s => s.code === code)) { toast('Already scanned'); return; }
    setXP(entry.points);
    logScan({ code, points: entry.points });
    if (entry.type === 'event') {
        if (!state.user.plan.includes(entry.ref)) state.user.plan.push(entry.ref);
    } else if (entry.type === 'spot') {
        ensureZoneCounts();
        state.user.zoneCounts['z2'] += 8;
        store.set('sb_user', state.user);
    }
    toast(`+${entry.points} XP 🎉`);
    render();
}
function logScan(s) {
    const t = new Date().toLocaleString();
    state.user.scans = state.user.scans || [];
    state.user.scans.push({ ...s, time: t });
    store.set('sb_user', state.user);
}

/* ========= MAP HEAT ========= */
function pingHere() {
    ensureZoneCounts();
    const z = SAT.zones[Math.floor(Math.random() * SAT.zones.length)];
    state.user.zoneCounts[z.id] += 3 + Math.floor(Math.random() * 4);
    store.set('sb_user', state.user);
    toast(`Pinged near ${z.name}`);
    if (state.view === 'map') render();
}
function decrowd() {
    ensureZoneCounts();
    Object.keys(state.user.zoneCounts).forEach(k => state.user.zoneCounts[k] = Math.max(0, state.user.zoneCounts[k] - 10));
    store.set('sb_user', state.user);
    if (state.view === 'map') render();
}

/* ========= MAP MODAL FUNCTIONS ========= */
function showZoneInfo(zoneId) {
    const zone = SAT.zones.find(z => z.id === zoneId);
    if (!zone) return;

    state.selectedZone = zone;

    // Update modal content
    document.getElementById('modalZoneName').textContent = zone.name;

    // Get events at this venue
    const venueEvents = SAT.events.filter(e => e.venue === zone.name);

    // Build zone info HTML
    let infoHTML = `
    <div class="zone-info-item">
      <div class="zone-info-icon">${zone.icon}</div>
      <div>
        <div class="muted">Description</div>
        <div>${zone.description}</div>
      </div>
    </div>
    <div class="zone-info-item">
      <div class="zone-info-icon">👥</div>
      <div>
        <div class="muted">Current Crowd</div>
        <div>${state.user.zoneCounts[zone.id] || 0} people</div>
      </div>
    </div>
  `;

    if (venueEvents.length > 0) {
        infoHTML += `
      <div class="zone-info-item">
        <div class="zone-info-icon">📅</div>
        <div>
          <div class="muted">Events Here</div>
          <div>${venueEvents.map(e => `${e.title} (${e.time})`).join(', ')}</div>
        </div>
      </div>
    `;
    }

    document.getElementById('zoneInfo').innerHTML = infoHTML;

    // Show modal
    document.getElementById('mapModal').style.display = 'flex';
}

function closeMapModal() {
    document.getElementById('mapModal').style.display = 'none';
    state.selectedZone = null;
}

function navigateToZone() {
    if (!state.selectedZone) return;

    const zone = state.selectedZone;
    toast(`Opening navigation to ${zone.name}…`);

    // Open Google Maps with directions to the specific location at Thapar University
    const query = encodeURIComponent(zone.mapQuery);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');

    closeMapModal();
}

/* ========= VOICE ========= */
let recog = null, listening = false;
function toggleVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast('Speech API not supported'); return;
    }
    const Cls = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recog) {
        recog = new Cls();
        recog.lang = 'en-IN';
        recog.interimResults = false;
        recog.onresult = e => {
            const text = e.results[0][0].transcript;
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = text;
                sendChatMessage();
            }
        };
        recog.onend = () => {
            listening = false;
            updateVoiceBtn();
        };
    }
    if (!listening) {
        recog.start();
        listening = true;
        updateVoiceBtn();
        toast('Listening…');
    }
    else {
        recog.stop();
        listening = false;
        updateVoiceBtn();
    }
}
function updateVoiceBtn() {
    const b = qs('#voiceBtn');
    if (!b) return;
    b.textContent = listening ? '⏹️ Stop' : '🎙️ Voice';
}
function demoAR() { alert('WebAR mock: overlaying info on poster.\n(For real AR, use WebXR / 8th Wall in a production build.)'); }
function lostFound() { alert('Lost & Found mock: In production, compare uploaded item image features for matches.'); }

/* ========= REEL MAKER ========= */
let reelImgs = [];
async function loadFiles(files) {
    reelImgs = await Promise.all([...files].map(file => new Promise((res) => {
        const img = new Image(); img.onload = () => res(img); img.src = URL.createObjectURL(file);
    })));
}
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'reelFiles') { loadFiles(e.target.files); }
});
function previewReel() {
    const canvas = qs('#reelCanvas'); const ctx = canvas.getContext('2d');
    if (!reelImgs.length) { toast('Pick images first'); return; }
    let t = 0;
    (function draw() {
        const i1 = reelImgs[Math.floor(t / 120) % reelImgs.length];
        const i2 = reelImgs[(Math.floor(t / 120) + 1) % reelImgs.length];
        const p = (t % 120) / 120;
        ctx.fillStyle = '#0f1524'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawImageCover(ctx, i1, canvas.width, canvas.height, 1 + 0.05 * p);
        ctx.globalAlpha = p; drawImageCover(ctx, i2, canvas.width, canvas.height, 1 + 0.05 * (1 - p)); ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffffaa'; ctx.font = 'bold 20px system-ui'; ctx.fillText('FestifyXR 2025', 18, canvas.height - 18);
        t++; canvas._raf = requestAnimationFrame(draw);
    })();
}
function drawImageCover(ctx, img, w, h, zoom = 1) {
    const ar = img.width / img.height; const cw = w, ch = h;
    let dw, dh;
    if (cw / ch > ar) { dh = ch * zoom; dw = dh * ar; }
    else { dw = cw * zoom; dh = dw / ar; }
    const dx = (cw - dw) / 2; const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
}
async function recordReel() {
    const canvas = qs('#reelCanvas'); const ctx = canvas.getContext('2d');
    if (!reelImgs.length) { toast('Pick images first'); return; }
    let frames = 0, maxFrames = reelImgs.length * 120;
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'festifyxr-reel.webm'; a.click();
        toast('Exported reel 🎬');
    };
    rec.start();
    (function draw() {
        const i1 = reelImgs[Math.floor(frames / 120) % reelImgs.length];
        const i2 = reelImgs[(Math.floor(frames / 120) + 1) % reelImgs.length];
        const p = (frames % 120) / 120;
        ctx.fillStyle = '#0f1524'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawImageCover(ctx, i1, canvas.width, canvas.height, 1 + 0.05 * p);
        ctx.globalAlpha = p; drawImageCover(ctx, i2, canvas.width, canvas.height, 1 + 0.05 * (1 - p)); ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffffaa'; ctx.font = 'bold 20px system-ui'; ctx.fillText('FestifyXR 2025', 18, canvas.height - 18);
        frames++;
        if (frames <= maxFrames) requestAnimationFrame(draw); else rec.stop();
    })();
}

/* ========= GLOBALS ========= */
function redeem(id) {
    const r = SAT.rewards.find(x => x.id === id);
    if (!r) return;
    if (state.user.xp < r.cost) { toast('Not enough XP'); return; }
    setXP(-r.cost);
    toast(`Redeemed: ${r.title} 🎉`);
    render();
}
function resetDemo() {
    if (auth.user) {
        state.user = {
            name: auth.user.name,
            xp: 0,
            level: 1,
            plan: [],
            scans: [],
            zoneCounts: {},
            reels: []
        };
        store.set(`sb_user_${auth.user.id}`, state.user);
        toast('Your data has been reset');
        render();
    } else {
        localStorage.removeItem('sb_user');
        state.user = { name: 'Aadit', xp: 0, level: 1, plan: [], scans: [], zoneCounts: {}, reels: [] };
        toast('Demo reset');
        render();
    }
}
function exportUserData() {
    const data = {
        users: auth.users,
        userData: {}
    };

    auth.users.forEach(u => {
        data.userData[u.id] = store.get(`sb_user_${u.id}`, {});
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'festifyxr-data.json';
    a.click();

    toast('Data exported successfully');
}

function resetAllData() {
    if (confirm('Are you sure you want to reset all user data? This cannot be undone.')) {
        auth.users.forEach(u => {
            store.remove(`sb_user_${u.id}`);
        });

        auth.users = [{
            id: 'admin-1',
            name: 'Fest Admin',
            email: 'admin@festifyxr.com',
            password: 'admin123',
            role: 'admin'
        }];

        store.set('users', auth.users);
        toast('All user data has been reset');
        render();
    }
}

function viewUserDetails(userId) {
    const user = auth.users.find(u => u.id === userId);
    const userData = store.get(`sb_user_${userId}`, {});

    alert(`User: ${user.name}\nEmail: ${user.email}\nXP: ${userData.xp || 0}\nLevel: ${userData.level || 1}\nEvents Planned: ${userData.plan ? userData.plan.length : 0}`);
}

document.getElementById('search').addEventListener('input', () => { if (state.view === 'events') render(); });
document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => goto(b.dataset.view)));

function init() {
    auth.init();

    if (!auth.user) {
        showAuth();
    } else {
        greet();
        render();
    }
}
init();
// Global state
let currentStep = 'signup';  // 'signup' or 'dashboard'
let salesPersonName = '';
let email = '';
let salesLink = '';
let notifications = [];
let currentUser = null;

// Constants
const payoutPerSignup = 500;  // $500 per confirmed signup
const maxSignups = 50;        // Max 50 signups allowed
const maxEarnings = payoutPerSignup * maxSignups;

// Default stats (will be replaced with real data)
let stats = {
  totalShares: 0,
  pendingSignups: 0,
  confirmedSignups: 0,
  totalEarnings: 0,
  remainingSlots: maxSignups
};

// Check if user is already logged in
function checkAuthState() {
  if (window.firebase && window.firebase.initialized) {
    window.onAuthStateChanged(window.firebase.auth, (user) => {
      if (user) {
        // User is signed in
        currentUser = user;
        email = user.email;
        salesPersonName = email.split('@')[0];
        currentStep = 'dashboard';
        loadUserData(user.uid);
      }
      render();
    });
  } else {
    // Mock mode
    render();
  }
}

// Load user data from Firestore
async function loadUserData(uid) {
  try {
    if (window.firebase && window.firebase.initialized) {
      const userRef = window.doc(window.firebase.db, 'users', uid);
      const userDoc = await window.getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        stats = userData.stats;
        salesLink = userData.salesLink;
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Logout function
async function logout() {
  try {
    if (window.firebase && window.firebase.initialized) {
      await window.signOut(window.firebase.auth);
    }
    currentUser = null;
    currentStep = 'signup';
    render();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Helper functions
function generateSalesLink(addr) {
  return `https://lvl3.ai/early-access?sales=${
    btoa(addr).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
  }`;
}

function showNotification(type, message) {
  const notification = { type, message, id: Date.now() };
  notifications.push(notification);
  renderNotifications();
  
  setTimeout(() => {
    notifications = notifications.filter(n => n.id !== notification.id);
    renderNotifications();
  }, 5000);
}

function renderNotifications() {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  container.innerHTML = notifications.map(n => `
    <div class="notification ${n.type}">
      <div class="flex items-center gap-4">
        <span style="font-size: 20px;">${n.type === 'success' ? '✅' : '❌'}</span>
        <span style="font-weight: 600; font-size: 15px;">${n.message}</span>
      </div>
    </div>
  `).join('');
}

function handleSetup(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('email-input');
  if (!emailInput) return;
  
  email = emailInput.value.trim();
  
  if (!email || !email.includes('@')) {
    showNotification('error', 'Please enter a valid email address.');
    emailInput.focus();
    return;
  }
  
  // Show loading state
  const button = document.querySelector('button[onclick="handleSetup(event)"]');
  if (button) {
    button.innerHTML = '<div class="flex items-center gap-4"><div class="spinner" style="width: 22px; height: 22px; border: 2px solid white; border-top: transparent; border-radius: 50%;"></div><span>Processing...</span></div>';
    button.disabled = true;
  }
  
  setTimeout(() => {
    const link = generateSalesLink(email);
    const conf = Math.floor(Math.random() * 12) + 3;
    const pend = Math.floor(Math.random() * 8) + 2;

    salesLink = link;
    salesPersonName = email.split('@')[0];
    currentStep = 'dashboard';
    
    stats = {
      totalShares: Math.floor(Math.random() * 50) + 20,
      pendingSignups: pend,
      confirmedSignups: conf,
      totalEarnings: conf * payoutPerSignup,
      remainingSlots: maxSignups - conf - pend
    };
    
    showNotification('success', 'Sales portal activated successfully! Your link is ready to share.');
    render();
  }, 1500);
}

// Copy sales link to clipboard
async function copyLink() {
  if (!salesLink) return;
  
  try {
    await navigator.clipboard.writeText(salesLink);
    showNotification('success', 'Sales link copied to clipboard!');
  } catch (err) {
    // Fallback for older browsers
    const tempInput = document.createElement('input');
    tempInput.value = salesLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showNotification('success', 'Sales link copied to clipboard!');
  }
  
  // If Firebase is initialized, track this share
  if (window.firebase && window.firebase.initialized && currentUser) {
    try {
      // Get the link ID from the URL
      const url = new URL(salesLink);
      const linkId = url.searchParams.get('ref');
      
      if (linkId) {
        // Update the link tracking document
        const linkRef = window.doc(window.firebase.db, 'links', linkId);
        const linkDoc = await window.getDoc(linkRef);
        
        if (linkDoc.exists()) {
          await window.updateDoc(linkRef, {
            shares: window.increment(1),
            lastSharedAt: window.serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }
  
  // Update UI stats
  stats.totalShares++;
  render();
}

function renderSignup() {
  return `
    <div class="py-16 fade-in">
      <div class="container">
        <div style="max-width: 700px; margin: 0 auto;">
          <!-- header -->
          <div class="text-center mb-12">
            <div class="flex items-center justify-center mb-10">
              <div class="logo">
                <div class="logo-bar logo-bar-1"></div>
                <div class="logo-bar logo-bar-2"></div>
                <div class="logo-bar logo-bar-3"></div>
              </div>
              <h1 class="text-5xl font-bold text-white ml-6">LVL3.ai</h1>
            </div>
            <div class="header-badge">
              <span class="text-gray-300 text-base font-medium">Sales Team Portal</span>
            </div>
          </div>

          <!-- card -->
          <div class="card">
            <div class="text-center mb-12">
              <h2 class="text-5xl font-bold gradient-text mb-8 leading-tight">
                Sales Incentive<br/>Program
              </h2>
              <p class="text-gray-300 text-xl leading-relaxed">
                Get your personal sales link and earn up to
                <span class="text-green-400 font-bold text-3xl"> $${(maxSignups * payoutPerSignup).toLocaleString()}</span>
              </p>
            </div>

            <!-- details -->
            <div class="card mb-10 accent-border">
              <h3 class="text-white font-semibold mb-8 text-xl flex items-center">
                🎯 Your Commission Structure
              </h3>
              <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="commission-card">
                  <span class="text-gray-300 font-medium text-lg">Per qualified signup</span>
                  <span class="text-green-400 font-bold text-2xl">$${payoutPerSignup}</span>
                </div>
                <div class="commission-card">
                  <span class="text-gray-300 font-medium text-lg">Maximum signups</span>
                  <span class="text-purple-400 font-bold text-2xl">${maxSignups.toLocaleString()}</span>
                </div>
                <div class="commission-card highlight">
                  <span class="text-white font-semibold text-xl">Maximum earnings</span>
                  <span class="text-green-400 font-bold text-3xl">$${(maxSignups * payoutPerSignup).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- how it works -->
            <div class="card mb-10 how-it-works">
              <h3 class="text-white font-semibold mb-8 text-xl">How It Works:</h3>
              <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="feature-item">
                  <div class="feature-dot"></div>
                  <span class="text-base text-gray-200">Get your unique sales link below</span>
                </div>
                <div class="feature-item">
                  <div class="feature-dot"></div>
                  <span class="text-base text-gray-200">Share with prospects via email, social, or direct outreach</span>
                </div>
                <div class="feature-item">
                  <div class="feature-dot"></div>
                  <span class="text-base text-gray-200">Prospects sign up for LVL3.ai early access</span>
                </div>
                <div class="feature-item">
                  <div class="feature-dot"></div>
                  <span class="text-base text-gray-200">Earn $${payoutPerSignup} for each user who stays active for 3+ months</span>
                </div>
              </div>
            </div>

            <!-- email form -->
            <div style="display: flex; flex-direction: column; gap: 32px;">
              <div>
                <label class="block text-base font-medium text-gray-300 mb-4">Sales Team Email</label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="Enter your LVL3.ai email address"
                  class="input"
                  onkeypress="if(event.key==='Enter') handleSetup(event)"
                />
              </div>
              <button
                onclick="handleSetup(event)"
                class="button"
                style="width: 100%;"
              >
                Get My Sales Link →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const earningsPct = (stats.totalEarnings / maxEarnings) * 100;
  
  return `
    <!-- Dashboard screen -->
    <div class="flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-4xl font-extrabold">
            <span class="bg-gradient-text">LVL3.ai</span> Sales Portal
          </h2>
          <p class="mt-2 text-lg text-gray-400">Welcome, ${salesPersonName || 'User'}!</p>
        </div>
        <button onclick="logout()" class="button" style="padding: 12px 20px;">
          Logout
        </button>
      </div>
      
      <!-- Stats overview -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <!-- Stat card: Total shares -->
        <div class="stat-card">
          <div class="flex flex-col">
            <div class="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">Total Shares</div>
            <div class="text-3xl font-bold">${stats.totalShares}</div>
            <div class="text-xs text-green-400 mt-2">+1 in the last 24h</div>
          </div>
        </div>
        
        <!-- Stat card: Pending Signups -->
        <div class="stat-card">
          <div class="flex flex-col">
            <div class="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">Pending Signups</div>
            <div class="text-3xl font-bold">${stats.pendingSignups}</div>
            <div class="text-xs text-blue-400 mt-2">Avg conversion: 20%</div>
          </div>
        </div>
        
        <!-- Stat card: Confirmed Signups -->
        <div class="stat-card">
          <div class="flex flex-col">
            <div class="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">Confirmed Signups</div>
            <div class="text-3xl font-bold">${stats.confirmedSignups}</div>
            <div class="text-xs text-purple-400 mt-2">Commission: $${payoutPerSignup} each</div>
          </div>
        </div>
        
        <!-- Stat card: Total Earnings -->
        <div class="stat-card">
          <div class="flex flex-col">
            <div class="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">Total Earnings</div>
            <div class="text-3xl font-bold">$${stats.totalEarnings}</div>
            <div class="text-xs text-amber-400 mt-2">${stats.remainingSlots} slots remaining</div>
          </div>
        </div>
      </div>
      
      <!-- Sales link section -->
      <div class="mt-10 card success-border">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">Your Sales Link</h3>
          <div class="px-3 py-1 text-xs font-medium rounded-full" 
               style="background: rgba(139, 92, 246, 0.2); color: #a78bfa;">
            ${window.firebase && window.firebase.initialized ? 'Active' : 'Demo Mode'}
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-grow p-3 rounded-lg" style="background: rgba(2, 6, 23, 0.5); overflow-x: auto; white-space: nowrap;">
            <code class="text-green-400">${salesLink}</code>
          </div>
          <button onclick="copyLink()" class="button" style="white-space: nowrap;">
            <div class="flex items-center gap-2">
              <span>📋</span>
              Copy Link
            </div>
          </button>
        </div>
        
        <div class="mt-6 text-sm text-gray-400">
          <p>Share this link with potential customers. You'll earn $${payoutPerSignup} for each confirmed signup.</p>
        </div>
      </div>
      
      <!-- Performance chart placeholder -->
      <div class="mt-10 card">
        <h3 class="text-xl font-bold mb-6">Performance Overview</h3>
        
        <!-- Placeholder for chart (in a real app, this would be a chart) -->
        <div class="h-64 rounded-lg flex items-center justify-center" 
             style="background: rgba(15, 23, 42, 0.6);">
          <div class="text-center">
            <div class="text-2xl font-medium text-gray-300">${stats.totalShares} Total Shares</div>
            <div class="text-lg text-gray-400">${stats.confirmedSignups} Conversions (${stats.totalShares > 0 ? ((stats.confirmedSignups / stats.totalShares) * 100).toFixed(1) : '0'}%)</div>
            <div class="mt-4">
              <div class="h-2 w-64 rounded-full overflow-hidden" style="background: rgba(15, 23, 42, 0.8);">
                <div class="h-full" 
                     style="background: linear-gradient(90deg, #8b5cf6, #6366f1); width: ${stats.totalShares > 0 ? ((stats.confirmedSignups / stats.totalShares) * 100) : 0}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent activity -->
      <div class="mt-10 card">
        <h3 class="text-xl font-bold mb-6">Recent Activity</h3>
        
        <!-- Activity list -->
        <div class="space-y-6">
          <!-- Activity item -->
          <div class="flex items-start gap-4">
            <div class="rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                 style="background: rgba(16, 185, 129, 0.2);">
              <span style="color: #10b981; font-size: 18px;">✓</span>
            </div>
            <div>
              <div class="font-medium">New signup confirmed</div>
              <div class="text-sm text-gray-400 mt-1">Commission: $${payoutPerSignup} - 1 hour ago</div>
            </div>
          </div>
          
          <!-- Activity item -->
          <div class="flex items-start gap-4">
            <div class="rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                 style="background: rgba(59, 130, 246, 0.2);">
              <span style="color: #3b82f6; font-size: 18px;">🔗</span>
            </div>
            <div>
              <div class="font-medium">Sales link shared</div>
              <div class="text-sm text-gray-400 mt-1">3 hours ago</div>
            </div>
          </div>
          
          <!-- Activity item -->
          <div class="flex items-start gap-4">
            <div class="rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                 style="background: rgba(245, 158, 11, 0.2);">
              <span style="color: #f59e0b; font-size: 18px;">👤</span>
            </div>
            <div>
              <div class="font-medium">New pending signup</div>
              <div class="text-sm text-gray-400 mt-1">2 days ago</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Progress to goal -->
      <div class="mt-10 card">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-2xl font-semibold text-white">Progress to Maximum Earnings</h3>
          <span class="text-4xl font-bold text-green-400">
            $${stats.totalEarnings.toLocaleString()} / $${maxEarnings.toLocaleString()}
          </span>
        </div>
        <div class="progress-bar" style="height: 24px; margin-bottom: 20px;">
          <div class="progress-fill" style="width: ${earningsPct}%"></div>
        </div>
        <div class="flex justify-between text-base text-gray-400 font-medium">
          <span>${stats.confirmedSignups + stats.pendingSignups} / ${maxSignups.toLocaleString()} signups</span>
          <span>${Math.round(earningsPct)}% complete</span>
        </div>
      </div>
    </div>
  `;
}

function render() {
  const root = document.getElementById('root');
  if (!root) return;
  
  root.innerHTML = currentStep === 'signup' ? renderSignup() : renderDashboard();
  renderNotifications();
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase in mock mode
  window.firebase = { 
    initialized: false,
    auth: { currentUser: null }
  };
  
  // Initial render
  render();
  
  // Create a notification to indicate mock mode
  setTimeout(() => {
    showNotification('success', 'App running in demo mode! No Firebase connection needed.');
  }, 1000);
});

// Make functions available to the global scope for button clicks
window.handleSetup = handleSetup;
window.copyLink = copyLink;
window.logout = logout;

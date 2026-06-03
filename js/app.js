// ============================================================
// APP.JS – Fő navigáció és állapotkezelés
// ============================================================

const AppState = {
  currentUser: null,
  currentScreen: 'login',
  currentProduct: null,
  currentInspection: null,
  inspections: [...DEMO_INSPECTIONS]
};

// ─── Navigáció ───────────────────────────────────────────────
function navigate(screen, data = {}) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${screen}`);
  if (target) {
    target.classList.add('active');
    AppState.currentScreen = screen;
    
    // Animáció
    target.style.opacity = '0';
    target.style.transform = 'translateY(20px)';
    setTimeout(() => {
      target.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      target.style.opacity = '1';
      target.style.transform = 'translateY(0)';
    }, 10);
  }

  // Screen-specifikus inicializáció
  switch(screen) {
    case 'home': renderHome(); break;
    case 'scanner': initScanner(); break;
    case 'checklist': renderChecklist(data.product); break;
    case 'dashboard': renderDashboard(); break;
    case 'summary': renderSummary(data); break;
    case 'pdf-library': renderPdfLibrary(); break;
  }
}

// ─── Bejelentkezés ───────────────────────────────────────────
function setupLogin() {
  const pins = document.querySelectorAll('.user-card');
  pins.forEach(card => {
    card.addEventListener('click', () => {
      const userId = card.dataset.userId;
      const user = DEMO_USERS.find(u => u.id === userId);
      if (user) login(user);
    });
  });
}

function login(user) {
  AppState.currentUser = user;
  document.getElementById('current-user-name').textContent = user.name;
  document.getElementById('current-user-avatar').textContent = user.avatar;
  
  if (user.role === 'manager') {
    navigate('dashboard');
  } else {
    navigate('home');
  }
  
  showToast(`Üdvözöljük, ${user.name}! 👋`);
}

function logout() {
  AppState.currentUser = null;
  AppState.currentProduct = null;
  AppState.currentInspection = null;
  navigate('login');
}

// ─── Főmenü ──────────────────────────────────────────────────
function renderHome() {
  const user = AppState.currentUser;
  if (!user) return;

  // Felhasználó neve
  document.getElementById('home-user-name').textContent = user.name;

  // Saját ellenőrzések
  const myInspections = AppState.inspections
    .filter(i => i.inspector === user.name)
    .slice(-3)
    .reverse();
  
  const list = document.getElementById('recent-inspections');
  if (myInspections.length === 0) {
    list.innerHTML = '<p class="empty-state">Még nincsenek ellenőrzések.</p>';
    return;
  }
  
  list.innerHTML = myInspections.map(ins => {
    const product = PRODUCTS[ins.product];
    return `
      <div class="inspection-item ${ins.result === 'HIBÁS' ? 'faulty' : ''}">
        <div class="inspection-item-left">
          <span class="product-badge" style="background:${product?.color || '#666'}">${ins.product}</span>
          <div>
            <div class="ins-id">${ins.id}</div>
            <div class="ins-date">${ins.date} · ${ins.duration} perc</div>
          </div>
        </div>
        <div class="result-badge ${ins.result === 'HIBÁS' ? 'badge-fail' : 'badge-pass'}">
          ${ins.result === 'HIBÁS' ? '✗ HIBÁS' : '✓ OK'}
        </div>
      </div>
    `;
  }).join('');
}

// ─── Toast értesítések ───────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Globális event listenerek ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();

  // Logout gomb
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  
  // Nav gombok
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      navigate(target);
    });
  });
});

// ─── Utility ─────────────────────────────────────────────────
function formatDate(date = new Date()) {
  return date.toLocaleDateString('hu-HU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function generateId() {
  const year = new Date().getFullYear();
  const num = String(AppState.inspections.length + 1).padStart(3, '0');
  return `INS-${year}-${num}`;
}

// ─── PDF Könyvtár ────────────────────────────────────────────
function renderPdfLibrary() {
  const container = document.getElementById('pdf-list-container');
  if (!container) return;

  const allInspections = [...AppState.inspections].reverse();

  if (allInspections.length === 0) {
    container.innerHTML = '<p class="empty-state">Még nincsenek generálható tanúsítványok.</p>';
    return;
  }

  container.innerHTML = allInspections.map(ins => {
    const product = PRODUCTS[ins.product];
    return `
      <div class="inspection-item ${ins.result === 'HIBÁS' ? 'faulty' : ''}" style="margin-bottom: 12px; padding: 16px;">
        <div class="inspection-item-left" style="width: 100%; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 10px; align-items: center;">
            <span class="product-badge" style="background:${product?.color || '#666'}">${ins.product}</span>
            <div>
              <div class="ins-id">${ins.id}</div>
              <div class="ins-date">${ins.date} · Ellenőr: ${ins.inspector}</div>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="result-badge ${ins.result === 'HIBÁS' ? 'badge-fail' : 'badge-pass'}">
              ${ins.result === 'HIBÁS' ? '✗ HIBÁS' : '✓ OK'}
            </div>
            <button class="btn-primary" style="padding: 6px 12px; font-size: 12px; border-radius: 6px;" onclick="downloadPdfFromLibrary('${ins.id}')">
              📄 Letöltés
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.downloadPdfFromLibrary = function(insId) {
  const ins = AppState.inspections.find(i => i.id === insId);
  if (!ins) return;
  const product = PRODUCTS[ins.product];
  if (!product) return;
  
  if (typeof generatePDF === 'function') {
    generatePDF(ins, product);
  } else {
    showToast('Hiba: a PDF generáló nem található.', 'error');
  }
};


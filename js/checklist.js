// ============================================================
// CHECKLIST.JS – Dinamikus csekklista logika
// ============================================================

let activePhotoTarget = null;
let photoStream = null;

function renderChecklist(product) {
  if (!product) return;
  AppState.currentProduct = product;

  const container = document.getElementById('checklist-container');
  const header = document.getElementById('checklist-header');

  // Header beállítás
  header.innerHTML = `
    <div class="cl-product-info">
      <span class="cl-client-logo">${product.clientLogo}</span>
      <div>
        <div class="cl-product-name">${product.name}</div>
        <div class="cl-product-meta">${product.drawing} · ${product.revision} · <strong>${product.client}</strong></div>
      </div>
    </div>
    <div class="cl-progress-wrap">
      <div class="cl-progress-text">
        <span id="cl-done-count">0</span>/${product.checklist.length} pont
      </div>
      <div class="cl-progress-bar-bg">
        <div class="cl-progress-bar" id="cl-progress-bar" style="background:${product.color}"></div>
      </div>
    </div>
  `;

  // Pontok renderelése
  container.innerHTML = product.checklist.map(item => renderChecklistItem(item, product)).join('');

  // Event listenerek felcsatolása
  attachChecklistEvents(product);
  updateProgress(product);
}

function renderChecklistItem(item, product) {
  const isLocked = item.requires.length > 0;
  const lockReason = isLocked
    ? `Zárolva: előbb fejezd be a ${item.requires.map(r => {
        const dep = product.checklist.find(i => i.id === r);
        return dep ? `"${dep.title}"` : r;
      }).join(', ')} pontot`
    : '';

  return `
    <div class="cl-item ${isLocked ? 'locked' : ''}" id="item-${item.id}" data-id="${item.id}">
      <div class="cl-item-header">
        <div class="cl-item-number" style="background:${product.color}">${item.order}</div>
        <div class="cl-item-title-wrap">
          <div class="cl-item-title">${item.title}</div>
          <div class="cl-item-desc">${item.description}</div>
          ${isLocked ? `<div class="cl-lock-reason">🔒 ${lockReason}</div>` : ''}
        </div>
        <button class="cl-info-btn" data-id="${item.id}" title="Segédlet megjelenítése">ℹ️</button>
      </div>

      ${item.type === 'measurement' ? `
        <div class="cl-measurement-wrap">
          <div class="cl-tolerance-range">
            Megengedett: <strong>${item.min} – ${item.max} ${item.unit}</strong>
            <span class="cl-target">(cél: ${item.target} ${item.unit})</span>
          </div>
          <div class="cl-measurement-input-wrap">
            <input
              type="number"
              class="cl-measurement-input"
              id="meas-${item.id}"
              placeholder="Mért érték"
              step="any"
              ${isLocked ? 'disabled' : ''}
              data-id="${item.id}"
              data-min="${item.min}"
              data-max="${item.max}"
            >
            <span class="cl-unit">${item.unit}</span>
            <div class="cl-meas-indicator" id="meas-ind-${item.id}"></div>
          </div>
        </div>
      ` : ''}

      <div class="cl-actions">
        <button class="cl-btn cl-btn-pass" data-id="${item.id}" ${isLocked ? 'disabled' : ''}>
          ✓ Megfelelő
        </button>
        <button class="cl-btn cl-btn-fail" data-id="${item.id}" ${isLocked ? 'disabled' : ''}>
          ✗ Hibás
        </button>
      </div>

      <div class="cl-defect-panel" id="defect-${item.id}">
        <div class="cl-defect-title">⚠️ Hiba rögzítése – kötelező!</div>
        <textarea
          class="cl-defect-note"
          id="note-${item.id}"
          placeholder="Írja le a hibát részletesen (min. 10 karakter)..."
          rows="3"
        ></textarea>
        <div class="cl-photo-area">
          <button class="cl-photo-btn" id="photo-btn-${item.id}" data-id="${item.id}">
            📷 Fotó készítése a hibáról
          </button>
          <div class="cl-photo-preview" id="photo-prev-${item.id}"></div>
        </div>
        <button class="cl-defect-confirm" id="defect-confirm-${item.id}" data-id="${item.id}">
          Hiba rögzítése és továbblépés
        </button>
      </div>

      <div class="cl-result-display" id="result-${item.id}"></div>
    </div>
  `;
}

function attachChecklistEvents(product) {
  const ins = AppState.currentInspection;

  // MEGFELELŐ gombok
  document.querySelectorAll('.cl-btn-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = product.checklist.find(i => i.id === id);
      if (!item || isItemLocked(id, product)) return;

      if (item.type === 'measurement') {
        const input = document.getElementById(`meas-${id}`);
        const val = parseFloat(input?.value);
        if (isNaN(val)) {
          showToast('Kérjük add meg a mért értéket!', 'warning');
          input?.focus();
          return;
        }
        if (val < item.min || val > item.max) {
          showToast(`A mért érték (${val} ${item.unit}) kívül esik a tűréshatáron!`, 'error');
          playBeep('error');
          return;
        }
        ins.results[id] = { status: 'MEGFELELŐ', value: val, unit: item.unit };
      } else {
        ins.results[id] = { status: 'MEGFELELŐ' };
      }

      markItemDone(id, 'MEGFELELŐ', product);
      playBeep('success');
    });
  });

  // HIBÁS gombok
  document.querySelectorAll('.cl-btn-fail').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (isItemLocked(id, product)) return;
      openDefectPanel(id);
      playBeep('warning');
    });
  });

  // Mérési input valós idejű ellenőrzés
  document.querySelectorAll('.cl-measurement-input').forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.id;
      const val = parseFloat(input.value);
      const min = parseFloat(input.dataset.min);
      const max = parseFloat(input.dataset.max);
      const ind = document.getElementById(`meas-ind-${id}`);

      if (isNaN(val)) {
        input.classList.remove('in-range', 'out-of-range');
        if (ind) ind.className = 'cl-meas-indicator';
        return;
      }

      if (val >= min && val <= max) {
        input.classList.add('in-range');
        input.classList.remove('out-of-range');
        if (ind) { ind.className = 'cl-meas-indicator ind-ok'; ind.textContent = '✓'; }
      } else {
        input.classList.add('out-of-range');
        input.classList.remove('in-range');
        if (ind) { ind.className = 'cl-meas-indicator ind-fail'; ind.textContent = '✗'; }
        playBeep('error');
      }
    });
  });

  // Info gombok
  document.querySelectorAll('.cl-info-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = product.checklist.find(i => i.id === id);
      if (item?.info) openInfoModal(item);
    });
  });

  // Fotó készítés
  document.querySelectorAll('.cl-photo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activePhotoTarget = btn.dataset.id;
      openPhotoModal();
    });
  });

  // Hiba megerősítés
  document.querySelectorAll('.cl-defect-confirm').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const note = document.getElementById(`note-${id}`)?.value.trim();
      const ins = AppState.currentInspection;

      if (!note || note.length < 10) {
        showToast('Kérjük adj részletes hibajelentést (min. 10 karakter)!', 'warning');
        return;
      }

      if (!ins.photos[id]) {
        showToast('Kötelező fotót készíteni a hibáról!', 'warning');
        return;
      }

      ins.results[id] = { status: 'HIBÁS', note };
      ins.notes[id] = note;

      closeDefectPanel(id);
      markItemDone(id, 'HIBÁS', product);
    });
  });
}

function isItemLocked(itemId, product) {
  const item = product.checklist.find(i => i.id === itemId);
  if (!item) return false;
  const ins = AppState.currentInspection;
  return item.requires.some(reqId => !ins.results[reqId]);
}

function openDefectPanel(itemId) {
  document.querySelectorAll('.cl-defect-panel').forEach(p => {
    if (p.id !== `defect-${itemId}`) p.classList.remove('open');
  });
  const panel = document.getElementById(`defect-${itemId}`);
  panel?.classList.add('open');
  panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeDefectPanel(itemId) {
  document.getElementById(`defect-${itemId}`)?.classList.remove('open');
}

function markItemDone(itemId, status, product) {
  const itemEl = document.getElementById(`item-${itemId}`);
  const resultEl = document.getElementById(`result-${itemId}`);
  const ins = AppState.currentInspection;
  const result = ins.results[itemId];

  if (!itemEl) return;

  itemEl.classList.add('done');
  itemEl.classList.add(status === 'MEGFELELŐ' ? 'item-pass' : 'item-fail');
  itemEl.classList.remove('locked');

  // Eredmény megjelenítése
  if (resultEl) {
    let valueStr = '';
    if (result.value !== undefined) valueStr = ` · ${result.value} ${result.unit}`;
    resultEl.innerHTML = `
      <span class="result-icon ${status === 'MEGFELELŐ' ? 'icon-pass' : 'icon-fail'}">
        ${status === 'MEGFELELŐ' ? '✓' : '✗'}
      </span>
      <span class="${status === 'MEGFELELŐ' ? 'text-pass' : 'text-fail'}">${status}${valueStr}</span>
    `;
    resultEl.classList.add('visible');
  }

  // Gombok letiltása
  itemEl.querySelectorAll('.cl-btn').forEach(b => { b.disabled = true; });
  itemEl.querySelector('.cl-measurement-input')?.setAttribute('disabled', true);

  // Függő pontok feloldása
  unlockDependents(itemId, product);
  updateProgress(product);

  // Minden kész?
  if (Object.keys(ins.results).length === product.checklist.length) {
    setTimeout(() => finishInspection(product), 800);
  }
}

function unlockDependents(completedId, product) {
  const ins = AppState.currentInspection;
  product.checklist.forEach(item => {
    if (item.requires.includes(completedId)) {
      const allDepsOk = item.requires.every(reqId => ins.results[reqId]);
      if (allDepsOk) {
        const itemEl = document.getElementById(`item-${item.id}`);
        if (itemEl && !ins.results[item.id]) {
          itemEl.classList.remove('locked');
          itemEl.querySelectorAll('.cl-btn, .cl-measurement-input').forEach(el => {
            el.removeAttribute('disabled');
          });
          itemEl.querySelector('.cl-lock-reason')?.remove();

          // Feloldás animáció
          itemEl.classList.add('just-unlocked');
          setTimeout(() => itemEl.classList.remove('just-unlocked'), 600);
        }
      }
    }
  });
}

function updateProgress(product) {
  const ins = AppState.currentInspection;
  const done = Object.keys(ins.results).length;
  const total = product.checklist.length;
  const pct = (done / total) * 100;

  document.getElementById('cl-done-count').textContent = done;
  const bar = document.getElementById('cl-progress-bar');
  if (bar) bar.style.width = pct + '%';
}

function finishInspection(product) {
  const ins = AppState.currentInspection;
  const hasDefect = Object.values(ins.results).some(r => r.status === 'HIBÁS');

  ins.endTime = new Date();
  ins.result = hasDefect ? 'HIBÁS' : 'MEGFELELŐ';
  ins.product = product.id;
  ins.duration = Math.round((ins.endTime - ins.startTime) / 60000);

  // Mentés
  AppState.inspections.push({
    id: ins.id,
    product: ins.product,
    inspector: ins.inspector,
    date: new Date().toISOString().split('T')[0],
    result: ins.result,
    defects: Object.values(ins.results).filter(r => r.status === 'HIBÁS').length,
    duration: ins.duration || 1
  });

  navigate('summary', { inspection: ins, product });
}

// ─── Info Modal ──────────────────────────────────────────────
function openInfoModal(item) {
  const modal = document.getElementById('info-modal');
  document.getElementById('info-modal-title').textContent = item.title;
  document.getElementById('info-modal-text').textContent = item.info.text;
  document.getElementById('info-good').textContent = '✅ ' + item.info.goodExample;
  document.getElementById('info-bad').textContent = '❌ ' + item.info.badExample;

  const goodImg = document.getElementById('info-good-img');
  if (item.info.goodImg) {
    goodImg.src = item.info.goodImg;
    goodImg.style.display = 'block';
  } else {
    goodImg.style.display = 'none';
  }

  const badImg = document.getElementById('info-bad-img');
  if (item.info.badImg) {
    badImg.src = item.info.badImg;
    badImg.style.display = 'block';
  } else {
    badImg.style.display = 'none';
  }

  modal?.classList.add('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('info-modal-close')?.addEventListener('click', () => {
    document.getElementById('info-modal')?.classList.remove('open');
  });
  document.getElementById('info-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
});

// ─── Fotó Modal ──────────────────────────────────────────────
function openPhotoModal() {
  const modal = document.getElementById('photo-modal');
  modal?.classList.add('open');
  startPhotoCamera();
}

async function startPhotoCamera() {
  const video = document.getElementById('photo-video');
  try {
    photoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = photoStream;
    video.play();
  } catch(e) {
    // Kamera nem elérhető – placeholder fotó
    const previewEl = document.getElementById(`photo-prev-${activePhotoTarget}`);
    if (previewEl) {
      previewEl.innerHTML = `<div class="photo-placeholder">📷 Fotó szimulálva</div>`;
      AppState.currentInspection.photos[activePhotoTarget] = 'simulated';
    }
    document.getElementById('photo-modal')?.classList.remove('open');
    showToast('Kamera nem elérhető – fotó szimulálva.', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('capture-photo-btn')?.addEventListener('click', capturePhoto);
  document.getElementById('photo-modal-close')?.addEventListener('click', () => {
    stopPhotoCamera();
    document.getElementById('photo-modal')?.classList.remove('open');
  });
  document.getElementById('photo-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      stopPhotoCamera();
      e.currentTarget.classList.remove('open');
    }
  });
});

function capturePhoto() {
  const video = document.getElementById('photo-video');
  const canvas = document.getElementById('photo-canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  AppState.currentInspection.photos[activePhotoTarget] = dataUrl;

  // Preview megjelenítése
  const prevEl = document.getElementById(`photo-prev-${activePhotoTarget}`);
  if (prevEl) {
    prevEl.innerHTML = `<img src="${dataUrl}" class="photo-thumb" alt="Hiba fotó">`;
  }

  const btn = document.getElementById(`photo-btn-${activePhotoTarget}`);
  if (btn) btn.textContent = '✅ Fotó rögzítve – újra fotóz';

  stopPhotoCamera();
  document.getElementById('photo-modal')?.classList.remove('open');
  showToast('Fotó sikeresen rögzítve!', 'info');
}

function stopPhotoCamera() {
  if (photoStream) {
    photoStream.getTracks().forEach(t => t.stop());
    photoStream = null;
  }
}

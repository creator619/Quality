// ============================================================
// SCANNER.JS – QR/Vonalkód beolvasás (jsQR alapú)
// ============================================================

let scannerStream = null;
let scannerAnimFrame = null;
let scannerActive = false;

function initScanner() {
  const manualInput = document.getElementById('manual-code-input');
  const manualBtn = document.getElementById('manual-submit-btn');
  const startCamBtn = document.getElementById('start-camera-btn');

  // Manuális bevitel
  manualBtn?.addEventListener('click', () => {
    const code = manualInput?.value.trim().toUpperCase();
    if (code) processScannedCode(code);
    else showToast('Kérjük add meg a termékkódot!', 'warning');
  });

  manualInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') manualBtn?.click();
  });

  // Kamera indítás
  startCamBtn?.addEventListener('click', startCamera);

  // Demo gyors gombok
  document.querySelectorAll('.demo-scan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      simulateScan(code);
    });
  });
}

async function startCamera() {
  const video = document.getElementById('scanner-video');
  const canvas = document.getElementById('scanner-canvas');
  const overlay = document.getElementById('camera-overlay');

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });

    video.srcObject = scannerStream;
    video.setAttribute('playsinline', true);
    await video.play();

    overlay.classList.add('active');
    scannerActive = true;
    document.getElementById('start-camera-btn').textContent = '⏹ Kamera leállítása';
    document.getElementById('start-camera-btn').onclick = stopCamera;

    scanFrame(video, canvas);
  } catch (err) {
    showToast('Kamera nem elérhető. Használj manuális bevitelt!', 'warning');
    console.warn('Camera error:', err);
  }
}

function scanFrame(video, canvas) {
  if (!scannerActive) return;

  const ctx = canvas.getContext('2d');
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });
      if (code) {
        stopCamera();
        processScannedCode(code.data);
        return;
      }
    }
  }

  scannerAnimFrame = requestAnimationFrame(() => scanFrame(video, canvas));
}

function stopCamera() {
  scannerActive = false;
  if (scannerStream) {
    scannerStream.getTracks().forEach(t => t.stop());
    scannerStream = null;
  }
  if (scannerAnimFrame) {
    cancelAnimationFrame(scannerAnimFrame);
    scannerAnimFrame = null;
  }

  const overlay = document.getElementById('camera-overlay');
  overlay?.classList.remove('active');

  const startBtn = document.getElementById('start-camera-btn');
  if (startBtn) {
    startBtn.textContent = '📷 Kamera bekapcsolása';
    startBtn.onclick = startCamera;
  }
}

function simulateScan(code) {
  // Animált beolvasás szimuláció
  const input = document.getElementById('manual-code-input');
  if (input) {
    input.value = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < code.length) {
        input.value += code[i];
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => processScannedCode(code), 300);
      }
    }, 60);
  }
}

function processScannedCode(rawCode) {
  const code = rawCode.trim().toUpperCase();

  // QR kód -> termékazonosító feloldás
  let productId = QR_CODES[code] || QR_CODES[code.replace('QR-', '')];

  // Közvetlen termékazonosító?
  if (!productId && PRODUCTS[code]) {
    productId = code;
  }

  if (!productId || !PRODUCTS[productId]) {
    showToast(`Ismeretlen kód: ${code}`, 'error');
    // Beolvasási kudarc animáció
    const scanArea = document.getElementById('scan-area');
    scanArea?.classList.add('scan-error');
    setTimeout(() => scanArea?.classList.remove('scan-error'), 1000);
    return;
  }

  const product = PRODUCTS[productId];

  // Siker animáció + hang
  playBeep('success');
  const scanArea = document.getElementById('scan-area');
  scanArea?.classList.add('scan-success');

  setTimeout(() => {
    scanArea?.classList.remove('scan-success');
    stopCamera();

    // Új ellenőrzés indítása
    AppState.currentInspection = {
      id: generateId(),
      product: productId,
      inspector: AppState.currentUser?.name || 'Ismeretlen',
      startTime: new Date(),
      results: {},
      photos: {},
      notes: {}
    };

    navigate('checklist', { product });
  }, 800);
}

// ─── Hangjelzés ──────────────────────────────────────────────
function playBeep(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'warning') {
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch(e) { /* Hang nem elérhető */ }
}

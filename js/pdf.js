// ============================================================
// PDF.JS – Minőségi tanúsítvány generálás (jsPDF)
// ============================================================

function renderSummary({ inspection: ins, product }) {
  if (!ins || !product) return;

  const container = document.getElementById('summary-container');
  const hasDefect = ins.result === 'HIBÁS';
  const defects = Object.entries(ins.results).filter(([, r]) => r.status === 'HIBÁS');
  const passed = Object.entries(ins.results).filter(([, r]) => r.status === 'MEGFELELŐ');
  const duration = ins.duration || Math.round((ins.endTime - ins.startTime) / 60000) || 1;

  container.innerHTML = `
    <div class="summary-result ${hasDefect ? 'result-fail' : 'result-pass'}">
      <div class="summary-icon">${hasDefect ? '✗' : '✓'}</div>
      <div class="summary-verdict">${hasDefect ? 'NEM MEGFELELŐ' : 'MEGFELELŐ'}</div>
      <div class="summary-id">${ins.id}</div>
    </div>

    <div class="summary-meta-grid">
      <div class="meta-card">
        <div class="meta-label">Termék</div>
        <div class="meta-value">${product.name}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Vevő</div>
        <div class="meta-value">${product.clientLogo} ${product.client}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Ellenőr</div>
        <div class="meta-value">${ins.inspector}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Időtartam</div>
        <div class="meta-value">${duration} perc</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Megfelelő pontok</div>
        <div class="meta-value text-pass">${passed.length}/${product.checklist.length}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Hibás pontok</div>
        <div class="meta-value ${defects.length > 0 ? 'text-fail' : ''}">${defects.length}</div>
      </div>
    </div>

    ${defects.length > 0 ? `
      <div class="summary-defects">
        <h3 class="defects-title">⚠️ Rögzített hibák</h3>
        ${defects.map(([id, r]) => {
          const item = product.checklist.find(i => i.id === id);
          const photo = ins.photos[id];
          return `
            <div class="defect-card">
              <div class="defect-card-header">
                <span class="defect-num">${item?.order}.</span>
                <span class="defect-name">${item?.title}</span>
              </div>
              <div class="defect-note">${r.note || 'Nincs leírás'}</div>
              ${photo && photo !== 'simulated' ? `<img src="${photo}" class="defect-photo" alt="Hiba fotó">` : ''}
              ${photo === 'simulated' ? `<div class="photo-placeholder-small">📷 Fotó szimulálva</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    <div class="summary-results-list">
      <h3>Ellenőrzési pontok összefoglalója</h3>
      ${product.checklist.map(item => {
        const r = ins.results[item.id];
        if (!r) return '';
        const valueStr = r.value !== undefined ? ` · ${r.value} ${r.unit}` : '';
        return `
          <div class="summary-row ${r.status === 'HIBÁS' ? 'row-fail' : 'row-pass'}">
            <span class="row-num">${item.order}.</span>
            <span class="row-title">${item.title}</span>
            <span class="row-result">${r.status}${valueStr}</span>
          </div>
        `;
      }).join('')}
    </div>

    <div class="summary-actions">
      <button class="btn-primary" id="generate-pdf-btn">
        📄 PDF Tanúsítvány letöltése
      </button>
      <button class="btn-secondary" id="new-inspection-btn">
        + Új ellenőrzés
      </button>
    </div>
  `;

  document.getElementById('generate-pdf-btn')?.addEventListener('click', () => generatePDF(ins, product));
  document.getElementById('new-inspection-btn')?.addEventListener('click', () => navigate('scanner'));
}

// ─── PDF Generálás ───────────────────────────────────────────
function generatePDF(ins, product) {
  if (typeof jsPDF === 'undefined') {
    showToast('PDF könyvtár betöltése folyamatban...', 'info');
    return;
  }

  const { jsPDF: JSPDF } = window.jspdf || { jsPDF: window.jsPDF };
  const doc = new JSPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 15;
  let y = margin;

  // ── Fejléc ──
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 0, pageW, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MINŐSÉGI TANÚSÍTVÁNY', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Quality Inspection Certificate', margin, 25);
  doc.text(`Azonosító: ${ins.id}`, margin, 32);

  // Eredmény badge
  const hasDefect = ins.result === 'HIBÁS';
  doc.setFillColor(hasDefect ? 231 : 34, hasDefect ? 57 : 197, hasDefect ? 70 : 94);
  doc.roundedRect(pageW - margin - 45, 8, 45, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(hasDefect ? 'NEM MEGF.' : 'MEGFELELŐ', pageW - margin - 22.5, 21, { align: 'center' });

  y = 50;

  // ── Termékadatok ──
  doc.setTextColor(30, 30, 46);
  doc.setFillColor(245, 245, 250);
  doc.rect(margin, y, pageW - 2 * margin, 42, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 120);
  doc.text('TERMÉKADATOK', margin + 4, y + 7);

  const fields = [
    ['Termék neve:', product.name],
    ['Termékkód:', product.id],
    ['Vevő:', product.client],
    ['Rajzszám:', product.drawing],
    ['Revízió:', product.revision],
    ['Ellenőr:', ins.inspector],
    ['Dátum:', new Date().toLocaleDateString('hu-HU')],
    ['Időtartam:', `${ins.duration || 1} perc`]
  ];

  doc.setTextColor(30, 30, 46);
  fields.forEach((f, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i < 4 ? i : i - 4;
    const x = margin + 4 + col * 87;
    const fy = y + 14 + row * 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(f[0], x, fy);
    doc.setFont('helvetica', 'normal');
    doc.text(f[1], x + 30, fy);
  });

  y += 48;

  // ── Ellenőrzési pontok táblázat ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 46);
  doc.text('ELLENŐRZÉSI PONTOK', margin, y + 6);
  y += 10;

  // Fejléc sor
  doc.setFillColor(30, 30, 46);
  doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('#', margin + 2, y + 5);
  doc.text('Ellenőrzési pont', margin + 10, y + 5);
  doc.text('Mért érték', margin + 118, y + 5);
  doc.text('Eredmény', margin + 148, y + 5);
  y += 7;

  product.checklist.forEach((item, idx) => {
    const r = ins.results[item.id];
    if (!r) return;

    const isPass = r.status === 'MEGFELELŐ';
    const rowH = 8;

    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 252);
      doc.rect(margin, y, pageW - 2 * margin, rowH, 'F');
    }

    if (!isPass) {
      doc.setFillColor(255, 240, 240);
      doc.rect(margin, y, pageW - 2 * margin, rowH, 'F');
    }

    doc.setTextColor(30, 30, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(String(item.order), margin + 2, y + 5.5);

    // Cím csonkítás
    const titleShort = item.title.length > 52 ? item.title.substring(0, 49) + '...' : item.title;
    doc.text(titleShort, margin + 10, y + 5.5);

    // Mért érték
    const valStr = r.value !== undefined ? `${r.value} ${r.unit}` : '-';
    doc.text(valStr, margin + 118, y + 5.5);

    // Eredmény
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isPass ? 34 : 231, isPass ? 197 : 57, isPass ? 94 : 70);
    doc.text(r.status, margin + 148, y + 5.5);
    doc.setTextColor(30, 30, 46);

    y += rowH;
  });

  // ── Hibák részletezése ──
  const defects = Object.entries(ins.results).filter(([, r]) => r.status === 'HIBÁS');
  if (defects.length > 0) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 46);
    doc.text('RÖGZÍTETT HIBÁK RÉSZLETEZÉSE', margin, y);
    y += 6;

    defects.forEach(([id, r]) => {
      const item = product.checklist.find(i => i.id === id);
      doc.setFillColor(255, 240, 240);
      doc.rect(margin, y, pageW - 2 * margin, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 30, 30);
      doc.text(`${item?.order}. ${item?.title}`, margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(r.note || '-', pageW - 2 * margin - 6);
      doc.text(noteLines[0] || '-', margin + 3, y + 11);
      y += 16;
    });
  }

  // ── Aláírás ──
  y = Math.max(y + 10, 240);
  doc.setDrawColor(200, 200, 210);
  doc.line(margin, y, margin + 55, y);
  doc.line(pageW - margin - 55, y, pageW - margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text('Ellenőr aláírása', margin + 5, y + 5);
  doc.text('QA vezető aláírása', pageW - margin - 50, y + 5);
  doc.text(ins.inspector, margin + 5, y + 11);

  // ── Lábléc ──
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(7);
  doc.text(`Generálva: ${new Date().toLocaleString('hu-HU')} · MEOSEGÉD v1.0`, margin, 293);
  doc.text(`${ins.id}`, pageW - margin, 293, { align: 'right' });

  // ── Mentés ──
  const filename = `${ins.id}_${product.id}_tanusitvany.pdf`;
  doc.save(filename);
  showToast('✅ PDF tanúsítvány letöltve!', 'info');
}

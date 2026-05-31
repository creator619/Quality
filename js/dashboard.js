// ============================================================
// DASHBOARD.JS – Menedzser vezérlőpult (Chart.js)
// ============================================================

let chartDefectRate = null;
let chartTrend = null;

function renderDashboard() {
  const inspections = AppState.inspections;
  
  // ── KPI kártyák ──
  const total = inspections.length;
  const failed = inspections.filter(i => i.result === 'HIBÁS').length;
  const passRate = total > 0 ? Math.round(((total - failed) / total) * 100) : 0;
  const avgDuration = total > 0 ? Math.round(inspections.reduce((s, i) => s + i.duration, 0) / total) : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = inspections.filter(i => i.date === todayStr).length;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-pass-rate').textContent = passRate + '%';
  document.getElementById('kpi-failed').textContent = failed;
  document.getElementById('kpi-today').textContent = todayCount;
  document.getElementById('kpi-avg-duration').textContent = avgDuration + ' perc';

  // Pass rate szín
  const passEl = document.getElementById('kpi-pass-rate');
  if (passEl) {
    passEl.style.color = passRate >= 90 ? '#22c55e' : passRate >= 75 ? '#f59e0b' : '#ef4444';
  }

  // ── Grafikonok ──
  renderDefectRateChart(inspections);
  renderTrendChart(inspections);

  // ── Legutóbbi ellenőrzések ──
  renderRecentTable(inspections);

  // ── Leggyakoribb hibák ──
  renderTopDefects(inspections);
}

function renderDefectRateChart(inspections) {
  const ctx = document.getElementById('chart-defect-rate')?.getContext('2d');
  if (!ctx) return;

  // Terméktípusonkénti hibaarány
  const byProduct = {};
  inspections.forEach(ins => {
    if (!byProduct[ins.product]) byProduct[ins.product] = { total: 0, failed: 0 };
    byProduct[ins.product].total++;
    if (ins.result === 'HIBÁS') byProduct[ins.product].failed++;
  });

  const labels = Object.keys(byProduct).map(p => PRODUCTS[p]?.name || p);
  const data = Object.values(byProduct).map(b => Math.round((b.failed / b.total) * 100));
  const colors = Object.keys(byProduct).map(p => PRODUCTS[p]?.color || '#666');

  if (chartDefectRate) chartDefectRate.destroy();

  chartDefectRate = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Hibaarány (%)',
        data,
        backgroundColor: colors.map(c => c + 'aa'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Hibaarány: ${ctx.raw}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: v => v + '%', color: '#94a3b8' },
          grid: { color: '#1e293b' }
        },
        x: {
          ticks: { color: '#94a3b8' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderTrendChart(inspections) {
  const ctx = document.getElementById('chart-trend')?.getContext('2d');
  if (!ctx) return;

  // Utolsó 7 nap trendje
  const days = [];
  const passCounts = [];
  const failCounts = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
    const dayIns = inspections.filter(ins => ins.date === ds);
    days.push(dayLabel);
    passCounts.push(dayIns.filter(ins => ins.result === 'MEGFELELŐ').length);
    failCounts.push(dayIns.filter(ins => ins.result === 'HIBÁS').length);
  }

  if (chartTrend) chartTrend.destroy();

  chartTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Megfelelő',
          data: passCounts,
          borderColor: '#22c55e',
          backgroundColor: '#22c55e22',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#22c55e',
          pointRadius: 4
        },
        {
          label: 'Hibás',
          data: failCounts,
          borderColor: '#ef4444',
          backgroundColor: '#ef444422',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ef4444',
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', usePointStyle: true }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#94a3b8' },
          grid: { color: '#1e293b' }
        },
        x: {
          ticks: { color: '#94a3b8' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderRecentTable(inspections) {
  const tbody = document.getElementById('recent-table-body');
  if (!tbody) return;

  const recent = [...inspections].reverse().slice(0, 8);
  tbody.innerHTML = recent.map(ins => {
    const product = PRODUCTS[ins.product];
    return `
      <tr>
        <td><span class="table-id">${ins.id}</span></td>
        <td>
          <span class="table-product-badge" style="background:${product?.color || '#555'}">
            ${ins.product}
          </span>
        </td>
        <td>${ins.inspector}</td>
        <td>${ins.date}</td>
        <td>${ins.duration} perc</td>
        <td>
          <span class="table-result ${ins.result === 'HIBÁS' ? 'result-fail-badge' : 'result-pass-badge'}">
            ${ins.result === 'HIBÁS' ? '✗ HIBÁS' : '✓ MEGF.'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTopDefects(inspections) {
  const container = document.getElementById('top-defects-list');
  if (!container) return;

  // Összesített defekt statisztika (demo)
  const defectStats = [
    { name: 'Rögzítőcsavarok nyomatéka (VALTO-04X)', count: 3, pct: 38 },
    { name: 'Jelfogók működési teszt (RELAY-BB2)', count: 2, pct: 25 },
    { name: 'Belső kábelezés útvonala (VALTO-04X)', count: 2, pct: 25 },
    { name: 'Csomagolás és dokumentáció (VALTO-07D)', count: 1, pct: 12 }
  ];

  container.innerHTML = defectStats.map((d, i) => `
    <div class="defect-stat-row">
      <div class="defect-stat-info">
        <span class="defect-rank">#${i + 1}</span>
        <span class="defect-stat-name">${d.name}</span>
        <span class="defect-stat-count">${d.count}x</span>
      </div>
      <div class="defect-stat-bar-bg">
        <div class="defect-stat-bar" style="width:${d.pct}%"></div>
      </div>
    </div>
  `).join('');
}

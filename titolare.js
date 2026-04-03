
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

fetch('dati.json').then(r => r.json()).then(data => {
  const currentMonthName = data.meseCorrente || months[new Date().getMonth()];
  const currentMonth = (data.storicoMensile || []).find(m => m.mese === currentMonthName) || null;
  const operators = (data.operatori || []).map(o => o.nome);

  document.getElementById('ownerCurrentMonth').textContent = `Mese corrente: ${currentMonthName}`;
  document.getElementById('ownerMonthName').textContent = currentMonthName;

  const groupMonthTotal = Number(currentMonth ? currentMonth.gruppo || 0 : 0);
  const groupMonthPct = Math.round((groupMonthTotal / Number(data.obiettivoGruppo || 450)) * 100);
  document.getElementById('groupMonthTotal').textContent = groupMonthTotal;
  document.getElementById('groupMonthProgress').textContent = `${groupMonthPct}% obiettivo mese`;

  const yearGroupTotal = (data.storicoMensile || []).reduce((acc, item) => acc + Number(item.gruppo || 0), 0);
  const yearPct = Math.round((yearGroupTotal / Number(data.obiettivoAnnuale || 5400)) * 100);
  document.getElementById('groupYearTotal').textContent = yearGroupTotal;
  document.getElementById('groupYearProgress').textContent = `${yearPct}% obiettivo anno`;

  const annualPerEmployee = {};
  operators.forEach(name => {
    annualPerEmployee[name] = (data.storicoMensile || []).reduce((acc, item) => acc + Number((item.personali || {})[name] || 0), 0);
  });

  const bestName = operators.sort((a,b) => annualPerEmployee[b] - annualPerEmployee[a])[0] || '-';
  const bestPct = yearGroupTotal > 0 ? ((annualPerEmployee[bestName] / yearGroupTotal) * 100) : 0;
  document.getElementById('bestContributor').textContent = bestName;
  document.getElementById('bestContributorPct').textContent = `${bestPct.toFixed(1)}% del totale anno`;

  // Current month employee cards
  const currentWrap = document.getElementById('currentMonthCards');
  currentWrap.innerHTML = '';
  (data.operatori || []).forEach(op => {
    const name = op.nome;
    const current = Number(currentMonth ? (currentMonth.personali || {})[name] || 0 : 0);
    const minGoal = Number(data.premi.min || 121);
    const maxGoal = Number(data.premi.max || 150);
    const toMin = Math.max(minGoal - current, 0);
    const toMax = Math.max(maxGoal - current, 0);
    const pct = clamp((current / maxGoal) * 100, 0, 100);
    const card = document.createElement('article');
    card.className = 'employee-month-card';
    card.innerHTML = `
      <div class="employee-name">${name}</div>
      <div class="employee-main">
        <div class="employee-value">${current}</div>
        <div class="employee-meta">${pct.toFixed(0)}%</div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="employee-bottom">
        <div class="mini-stat">
          <div class="mini-stat-label">Manca al minimo</div>
          <div class="mini-stat-value">${toMin}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Manca al massimo</div>
          <div class="mini-stat-value">${toMax}</div>
        </div>
      </div>
    `;
    currentWrap.appendChild(card);
  });

  // Annual contribution table
  const annualBody = document.getElementById('annualContributionBody');
  annualBody.innerHTML = '';
  (data.operatori || []).forEach(op => {
    const name = op.nome;
    const total = annualPerEmployee[name];
    const avg = total / 12;
    const pct = yearGroupTotal > 0 ? ((total / yearGroupTotal) * 100) : 0;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${name}</td>
      <td>${total}</td>
      <td>${avg.toFixed(1)}</td>
      <td>${pct.toFixed(1)}%</td>
    `;
    annualBody.appendChild(row);
  });

  // Monthly history
  const monthlyBody = document.getElementById('monthlyHistoryBody');
  monthlyBody.innerHTML = '';
  (data.storicoMensile || []).forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.mese}</td>
      <td>${Number((item.personali || {}).Cosimo || 0)}</td>
      <td>${Number((item.personali || {}).Daniela || 0)}</td>
      <td>${Number((item.personali || {}).Patrizia || 0)}</td>
      <td>${Number(item.gruppo || 0)}</td>
    `;
    monthlyBody.appendChild(row);
  });

  // Report per employee
  const reportWrap = document.getElementById('employeeReports');
  reportWrap.innerHTML = '';
  (data.operatori || []).forEach(op => {
    const name = op.nome;
    const current = Number(currentMonth ? (currentMonth.personali || {})[name] || 0 : 0);
    const annual = annualPerEmployee[name];
    const pct = yearGroupTotal > 0 ? ((annual / yearGroupTotal) * 100) : 0;
    const bestMonth = (data.storicoMensile || []).reduce((best, item) => {
      const value = Number((item.personali || {})[name] || 0);
      return value > best.value ? { month: item.mese, value } : best;
    }, { month: '-', value: 0 });
    const report = document.createElement('article');
    report.className = 'employee-report-card';
    report.innerHTML = `
      <div class="report-title">${name}</div>
      <div class="report-grid">
        <div class="report-box">
          <div class="report-box-label">Mese corrente</div>
          <div class="report-box-value">${current}</div>
          <div class="report-box-sub">${currentMonthName}</div>
        </div>
        <div class="report-box">
          <div class="report-box-label">Totale anno</div>
          <div class="report-box-value">${annual}</div>
          <div class="report-box-sub">pezzi</div>
        </div>
        <div class="report-box">
          <div class="report-box-label">Contributo anno</div>
          <div class="report-box-value">${pct.toFixed(1)}%</div>
          <div class="report-box-sub">sul totale gruppo</div>
        </div>
        <div class="report-box">
          <div class="report-box-label">Mese migliore</div>
          <div class="report-box-value">${bestMonth.value}</div>
          <div class="report-box-sub">${bestMonth.month}</div>
        </div>
      </div>
    `;
    reportWrap.appendChild(report);
  });
});

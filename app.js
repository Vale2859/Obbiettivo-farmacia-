
const LS_KEY = 'ldf_user';

function getPageName() {
  return document.documentElement.getAttribute('data-page') || 'login';
}

function initials(name) {
  return String(name || '').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round1(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function calculateReward(current, premi) {
  if (current < premi.min) return 0;
  const factor = clamp((current - premi.min) / (premi.max - premi.min), 0, 1);
  return premi.base + ((premi.maxPremio - premi.base) * factor);
}

function statusText(current, premi) {
  if (current >= premi.max) return 'Obiettivo massimo raggiunto';
  if (current >= premi.min) return 'Premio base già sbloccato';
  return 'Ti manca poco per iniziare a guadagnare';
}

function focusMessage(current, forecast, premi, groupReached) {
  if (current >= premi.max) return 'Grandissimo: hai già raggiunto il massimo del premio.';
  if (forecast >= premi.max) return 'Continua così: stai puntando al premio massimo.';
  if (forecast >= premi.min) return 'Se mantieni questo ritmo, entri in fascia premio.';
  if (groupReached) return 'Il gruppo è in linea: spingi sul tuo obiettivo personale.';
  return 'Serve accelerare ora per non perdere il premio.';
}

function requireAuth(page) {
  const saved = localStorage.getItem(LS_KEY);
  if (page === 'login') {
    if (saved) window.location.href = 'index.html';
    return saved;
  }
  if (!saved) {
    window.location.href = 'login.html';
    return null;
  }
  return saved;
}

function bindLogin() {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const name = (document.getElementById('nome').value || '').trim();
    const pin = (document.getElementById('pin').value || '').trim();
    const error = document.getElementById('loginError');

    fetch('dati.json')
      .then(r => r.json())
      .then(data => {
        const user = data.operatori.find(u => u.nome.toLowerCase() === name.toLowerCase() && String(u.pin) === pin);
        if (!user) {
          error.textContent = 'Nome o PIN non corretti.';
          return;
        }
        localStorage.setItem(LS_KEY, user.nome);
        window.location.href = 'index.html';
      })
      .catch(() => {
        error.textContent = 'Errore nel caricamento dei dati.';
      });
  });
}

function renderDashboard(data, user, metrics) {
  const { premi, group, personal } = metrics;

  document.getElementById('userName').textContent = user.nome;
  document.getElementById('heroCurrent').textContent = personal.current;
  document.getElementById('heroMain').textContent = `${personal.current} / ${data.premi.max}`;
  document.getElementById('heroState').textContent = personal.current < data.premi.min
    ? `Ti mancano ${personal.toMin} pezzi per iniziare a guadagnare`
    : personal.current < data.premi.max
      ? `Premio base sbloccato • te ne mancano ${personal.toMax} per il massimo`
      : 'Hai raggiunto il massimo del premio';

  document.getElementById('toMin').textContent = personal.toMin;
  document.getElementById('toMax').textContent = personal.toMax;
  document.getElementById('needPerDay').textContent = personal.needPerDay;
  document.getElementById('avgPerDay').textContent = round1(personal.avgPerDay).toFixed(1);
  document.getElementById('forecast').textContent = personal.forecast;
  document.getElementById('forecastText').textContent = personal.forecast >= data.premi.max
    ? 'Stai puntando al massimo'
    : personal.forecast >= data.premi.min
      ? 'Premio base alla portata'
      : 'Serve accelerare';

  document.getElementById('rewardNow').textContent = Math.round(personal.reward);
  document.getElementById('rewardGroup').textContent = Math.round(personal.rewardWithGroup);
  document.getElementById('groupBonus').textContent = data.premi.bonusGruppo;
  document.getElementById('rewardBase').textContent = `${data.premi.base}€`;
  document.getElementById('rewardMax').textContent = `${data.premi.maxPremio}€`;
  document.getElementById('rewardStatus').textContent = personal.current >= data.premi.max
    ? 'Premio massimo'
    : personal.current >= data.premi.min
      ? 'In fascia premio'
      : 'Da sbloccare';

  document.getElementById('groupPercent').textContent = `${Math.round(group.percent)}%`;
  document.getElementById('groupMain').textContent = `${group.current} / ${data.obiettivoGruppo} pezzi`;
  document.getElementById('groupMissing').textContent = group.missing;
  document.getElementById('groupForecast').textContent = group.forecast;
  document.getElementById('groupNeed').textContent = group.needPerDay;
  document.getElementById('focusMessage').textContent = focusMessage(personal.current, personal.forecast, data.premi, group.reached);

  document.getElementById('heroFill').style.width = `${personal.percentMax}%`;
  document.getElementById('rewardFill').style.width = `${personal.percentMax}%`;
  document.getElementById('groupFill').style.width = `${group.percent}%`;

  const ring = document.getElementById('progressRing');
  ring.style.setProperty('--percent', personal.percentMax.toFixed(2));
}

function renderRanking(data, currentUser) {
  const sorted = [...data.operatori].sort((a, b) => b.pezzi - a.pezzi);
  const rankingList = document.getElementById('rankingList');
  if (rankingList) {
    rankingList.innerHTML = '';
    sorted.forEach((item, index) => {
      const note = item.nome === currentUser.nome
        ? (index === 0 ? 'Sei al TOP!' : 'Questa è la tua posizione')
        : (index === 0 ? 'In testa questo mese' : 'Continua a spingere');
      const medalClass = index === 0 ? 'medal-1' : index === 1 ? 'medal-2' : index === 2 ? 'medal-3' : 'medal-other';

      const row = document.createElement('div');
      row.className = `rank-row ${item.nome === currentUser.nome ? 'me' : ''}`;
      row.innerHTML = `
        <div class="rank-medal ${medalClass}">${index + 1}</div>
        <div>
          <div class="rank-name">${item.nome}</div>
          <div class="rank-note">${note}</div>
        </div>
        <div class="rank-score">${item.pezzi}</div>
      `;
      rankingList.appendChild(row);
    });
  }

  const podium = document.getElementById('podium');
  if (podium) {
    const top3 = sorted.slice(0, 3);
    podium.innerHTML = '';
    const classes = ['first', 'second', 'third'];
    top3.forEach((item, index) => {
      const block = document.createElement('div');
      block.className = `podium-card ${classes[index] || 'third'}`;
      block.innerHTML = `
        <div class="podium-rank">${index + 1}</div>
        <div class="podium-name">${item.nome}</div>
        <div class="podium-score">${item.pezzi}</div>
      `;
      podium.appendChild(block);
    });
  }
}

function drawHistoryChart(canvas, values) {
  if (!canvas || !canvas.getContext || !values.length) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  const height = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const pad = 24;
  const max = Math.max(...values) + 5;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#dfe7e2';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = pad + ((h - pad * 2) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#1fa55a';
  ctx.lineWidth = 3;
  ctx.beginPath();

  values.forEach((v, i) => {
    const x = pad + ((w - pad * 2) / (values.length - 1)) * i;
    const y = h - pad - ((h - pad * 2) * (v / max));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  values.forEach((v, i) => {
    const x = pad + ((w - pad * 2) / (values.length - 1)) * i;
    const y = h - pad - ((h - pad * 2) * (v / max));
    ctx.fillStyle = '#1fa55a';
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#546860';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`S${i + 1}`, x, h - 8);
    ctx.fillText(String(v), x, y - 12);
  });
}

function renderHistory(data, user) {
  const values = user.storicoSettimanale || [];
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const best = values.length ? Math.max(...values) : 0;
  const trend = values.length >= 2 ? values[values.length - 1] - values[0] : 0;

  const avgEl = document.getElementById('weeklyAvg');
  const bestEl = document.getElementById('bestWeek');
  const trendValue = document.getElementById('trendValue');
  const trendText = document.getElementById('trendText');
  if (avgEl) avgEl.textContent = round1(avg).toFixed(1);
  if (bestEl) bestEl.textContent = best;
  if (trendValue) trendValue.textContent = trend >= 0 ? `+${trend}` : `${trend}`;
  if (trendText) trendText.textContent = trend >= 0 ? 'in crescita' : 'in calo';

  const rows = document.getElementById('historyRows');
  if (rows) {
    rows.innerHTML = '';
    values.forEach((value, index) => {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `
        <div class="history-left">
          <div class="history-title">Settimana ${index + 1}</div>
          <div class="history-sub">Andamento registrato</div>
        </div>
        <div class="history-value">${value} pezzi</div>
      `;
      rows.appendChild(row);
    });
  }

  const canvas = document.getElementById('historyChart');
  if (canvas) drawHistoryChart(canvas, values);
}

function renderPremi(data, user, metrics) {
  const personal = metrics.personal;
  document.getElementById('premiStatus').textContent = personal.current >= data.premi.max
    ? 'Massimo raggiunto'
    : personal.current >= data.premi.min
      ? 'In fascia premio'
      : 'Da sbloccare';
  document.getElementById('premiCurrent').textContent = Math.round(personal.reward);
  document.getElementById('premiWithGroup').textContent = Math.round(personal.rewardWithGroup);
  document.getElementById('premiBonus').textContent = data.premi.bonusGruppo;
  document.getElementById('premiBase').textContent = `${data.premi.base}€`;
  document.getElementById('premiMax').textContent = `${data.premi.maxPremio}€`;
  document.getElementById('premiFill').style.width = `${personal.percentMax}%`;
  document.getElementById('premiToMin').textContent = `${personal.toMin} pezzi`;
  document.getElementById('premiToMax').textContent = `${personal.toMax} pezzi`;
  document.getElementById('premiMessage').textContent = statusText(personal.current, data.premi);
}

function renderGruppo(data, currentUser, metrics) {
  const group = metrics.group;
  document.getElementById('gruppoPercent').textContent = `${Math.round(group.percent)}%`;
  document.getElementById('gruppoMain').textContent = `${group.current} / ${data.obiettivoGruppo} pezzi`;
  document.getElementById('gruppoFill').style.width = `${group.percent}%`;
  document.getElementById('gruppoMissing').textContent = group.missing;
  document.getElementById('gruppoForecast').textContent = group.forecast;
  document.getElementById('gruppoNeed').textContent = group.needPerDay;

  const wrap = document.getElementById('teamContribution');
  if (wrap) {
    const total = Math.max(group.current, 1);
    wrap.innerHTML = '';
    [...data.operatori]
      .sort((a, b) => b.pezzi - a.pezzi)
      .forEach(item => {
        const pct = Math.round((item.pezzi / total) * 100);
        const row = document.createElement('div');
        row.className = 'contribution-row';
        row.innerHTML = `
          <div class="contribution-left">
            <div class="contribution-name">${item.nome}${item.nome === currentUser.nome ? ' • tu' : ''}</div>
            <div class="contribution-sub">Contributo sul totale gruppo</div>
          </div>
          <div class="contribution-value">${item.pezzi} • ${pct}%</div>
        `;
        wrap.appendChild(row);
      });
  }
}

function renderProfile(data, user, metrics) {
  const sorted = [...data.operatori].sort((a, b) => b.pezzi - a.pezzi);
  const rank = sorted.findIndex(x => x.nome === user.nome) + 1;

  document.getElementById('profileInitials').textContent = initials(user.nome);
  document.getElementById('profileName').textContent = user.nome;
  document.getElementById('profilePieces').textContent = user.pezzi;
  document.getElementById('profileRank').textContent = `#${rank}`;
  document.getElementById('profileReward').textContent = `${Math.round(metrics.personal.reward)}€`;
  document.getElementById('profileStatus').textContent = statusText(metrics.personal.current, data.premi);
  document.getElementById('profileAvg').textContent = `${round1(metrics.personal.avgPerDay).toFixed(1)} pezzi/giorno`;
  document.getElementById('profileForecast').textContent = `${metrics.personal.forecast} pezzi`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(LS_KEY);
      window.location.href = 'login.html';
    });
  }
}

function buildMetrics(data, user) {
  const totalDays = data.giorniTotali;
  const passedDays = Math.max(data.giorniPassati, 1);
  const remainingDays = Math.max(totalDays - passedDays, 1);

  const current = user.pezzi;
  const toMin = Math.max(data.premi.min - current, 0);
  const toMax = Math.max(data.premi.max - current, 0);
  const avgPerDay = current / passedDays;
  const forecast = Math.round(avgPerDay * totalDays);
  const needPerDay = toMax > 0 ? Math.ceil(toMax / remainingDays) : 0;
  const percentMax = clamp((current / data.premi.max) * 100, 0, 100);
  const reward = calculateReward(current, data.premi);

  const groupCurrent = data.operatori.reduce((sum, item) => sum + item.pezzi, 0);
  const groupMissing = Math.max(data.obiettivoGruppo - groupCurrent, 0);
  const groupAvg = groupCurrent / passedDays;
  const groupForecast = Math.round(groupAvg * totalDays);
  const groupNeedPerDay = groupMissing > 0 ? Math.ceil(groupMissing / remainingDays) : 0;
  const groupPercent = clamp((groupCurrent / data.obiettivoGruppo) * 100, 0, 100);
  const groupReached = groupCurrent >= data.obiettivoGruppo;

  return {
    personal: {
      current,
      toMin,
      toMax,
      avgPerDay,
      forecast,
      needPerDay,
      percentMax,
      reward,
      rewardWithGroup: reward + (groupReached ? data.premi.bonusGruppo : 0),
    },
    group: {
      current: groupCurrent,
      missing: groupMissing,
      forecast: groupForecast,
      needPerDay: groupNeedPerDay,
      percent: groupPercent,
      reached: groupReached
    }
  };
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

function init() {
  const page = getPageName();
  const savedUser = requireAuth(page);
  bindLogin();
  registerServiceWorker();

  if (page === 'login') return;

  fetch('dati.json')
    .then(r => r.json())
    .then(data => {
      const user = data.operatori.find(u => u.nome === savedUser) || data.operatori[0];
      const metrics = buildMetrics(data, user);

      if (page === 'dashboard') renderDashboard(data, user, metrics);
      if (page === 'classifica') renderRanking(data, user);
      if (page === 'storico') renderHistory(data, user);
      if (page === 'premi') renderPremi(data, user, metrics);
      if (page === 'gruppo') renderGruppo(data, user, metrics);
      if (page === 'profilo') renderProfile(data, user, metrics);
    });
}

document.addEventListener('DOMContentLoaded', init);

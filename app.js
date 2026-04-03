
const LS_KEY = 'ldf_operatore';

function safeRound(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function login() {
  const nome = (document.getElementById('nome')?.value || '').trim();
  const pin = (document.getElementById('pin')?.value || '').trim();
  const errorEl = document.getElementById('loginError');

  fetch('dati.json')
    .then(r => r.json())
    .then(data => {
      const user = data.operatori.find(u => u.nome.toLowerCase() === nome.toLowerCase() && String(u.pin) === pin);
      if (!user) {
        if (errorEl) errorEl.textContent = 'Nome o PIN non corretti.';
        return;
      }
      localStorage.setItem(LS_KEY, user.nome);
      window.location.href = 'index.html';
    })
    .catch(() => {
      if (errorEl) errorEl.textContent = 'Errore nel caricamento dati.';
    });
}

function ensureAuth() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const savedUser = localStorage.getItem(LS_KEY);

  if (page === 'login.html' || page === '') {
    if (savedUser) window.location.href = 'index.html';
    return;
  }

  if (!savedUser) {
    window.location.href = 'login.html';
    return;
  }

  loadDashboard(savedUser);
}

function initialsFromName(name) {
  return name.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase();
}

function euro(value) {
  return Math.round(value);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function loadDashboard(savedUser) {
  fetch('dati.json')
    .then(r => r.json())
    .then(data => {
      const user = data.operatori.find(u => u.nome === savedUser) || data.operatori[0];
      const totalDays = data.giorniTotali;
      const passedDays = data.giorniPassati;
      const remainingDays = Math.max(totalDays - passedDays, 1);

      const minGoal = data.premi.min;
      const maxGoal = data.premi.max;
      const baseReward = data.premi.base;
      const maxReward = data.premi.maxPremio;
      const groupBonus = data.premi.bonusGruppo;

      const current = user.pezzi;
      const toMin = Math.max(minGoal - current, 0);
      const toMax = Math.max(maxGoal - current, 0);
      const dailyAverage = current / Math.max(passedDays, 1);
      const forecast = Math.round(dailyAverage * totalDays);
      const neededPerDay = toMax > 0 ? Math.ceil(toMax / remainingDays) : 0;

      const progressMax = clamp((current / maxGoal) * 100, 0, 100);
      const progressMin = clamp((current / minGoal) * 100, 0, 100);

      const groupCurrent = data.operatori.reduce((sum, item) => sum + item.pezzi, 0);
      const groupGoal = data.obiettivoGruppo;
      const groupPercent = clamp((groupCurrent / groupGoal) * 100, 0, 100);
      const groupMissing = Math.max(groupGoal - groupCurrent, 0);
      const groupDailyAverage = groupCurrent / Math.max(passedDays, 1);
      const groupForecast = Math.round(groupDailyAverage * totalDays);
      const groupNeededPerDay = groupMissing > 0 ? Math.ceil(groupMissing / remainingDays) : 0;
      const groupReached = groupCurrent >= groupGoal;

      let rewardEstimate = 0;
      if (current >= minGoal) {
        const factor = clamp((current - minGoal) / (maxGoal - minGoal), 0, 1);
        rewardEstimate = baseReward + ((maxReward - baseReward) * factor);
      }
      const rewardWithGroup = rewardEstimate + (groupReached ? groupBonus : 0);

      const statusText = current >= maxGoal
        ? 'Obiettivo massimo raggiunto'
        : current >= minGoal
          ? 'Premio base sbloccato'
          : 'Punta al primo traguardo';

      const forecastMessage = forecast >= maxGoal
        ? 'Stai puntando al massimo'
        : forecast >= minGoal
          ? 'Premio base alla portata'
          : 'Devi accelerare';

      const heroBadgeText = current >= maxGoal ? 'Massimo raggiunto' : current >= minGoal ? 'Premio base attivo' : 'Obiettivo max';

      document.getElementById('helloName').textContent = user.nome.toUpperCase();
      document.getElementById('avatarInitials').textContent = initialsFromName(user.nome);

      document.getElementById('heroPieces').textContent = current;
      document.getElementById('heroCurrent').textContent = current;
      document.getElementById('heroMax').textContent = maxGoal;
      document.getElementById('heroBadge').textContent = heroBadgeText;
      document.getElementById('heroPercentText').textContent = `Sei al ${Math.round(progressMax)}% del massimo • ${statusText}`;

      const ring = document.getElementById('progressRing');
      ring.style.setProperty('--p', progressMax.toFixed(2));
      document.getElementById('heroTrackFill').style.width = `${progressMax}%`;
      document.getElementById('heroMinMarker').style.left = `${(minGoal / maxGoal) * 100}%`;

      document.getElementById('missingMin').textContent = toMin;
      document.getElementById('missingMax').textContent = toMax;
      document.getElementById('neededPerDay').textContent = neededPerDay;
      document.getElementById('dailyAverage').textContent = safeRound(dailyAverage).toFixed(1);
      document.getElementById('monthlyForecast').textContent = forecast;
      document.getElementById('forecastMessage').textContent = forecastMessage;

      document.getElementById('groupCurrent').textContent = groupCurrent;
      document.getElementById('groupGoal').textContent = groupGoal;
      document.getElementById('groupPercent').textContent = `${Math.round(groupPercent)}%`;
      document.getElementById('groupTrackFill').style.width = `${groupPercent}%`;
      document.getElementById('groupMissing').textContent = groupMissing;
      document.getElementById('groupForecast').textContent = groupForecast;
      document.getElementById('groupNeededPerDay').textContent = groupNeededPerDay;

      document.getElementById('rewardStatus').textContent = current >= maxGoal ? 'Premio massimo' : current >= minGoal ? 'In fascia premio' : 'Da sbloccare';
      document.getElementById('rewardEstimate').textContent = euro(rewardEstimate);
      document.getElementById('rewardWithGroup').textContent = euro(rewardWithGroup);
      document.getElementById('groupBonus').textContent = groupBonus;
      document.getElementById('baseReward').textContent = baseReward;
      document.getElementById('maxReward').textContent = maxReward;
      document.getElementById('rewardTrackFill').style.width = `${progressMax}%`;

      const sorted = [...data.operatori].sort((a,b) => b.pezzi - a.pezzi);
      const ranking = document.getElementById('rankingList');
      ranking.innerHTML = '';
      sorted.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'rank-row' + (item.nome === user.nome ? ' me' : '');

        const medalClass = index === 0 ? 'medal-1' : index === 1 ? 'medal-2' : index === 2 ? 'medal-3' : 'medal-other';
        const note = item.nome === user.nome
          ? (index === 0 ? 'Sei al TOP!' : 'Questa è la tua posizione')
          : (index === 0 ? 'In testa questo mese' : 'Continua a spingere');

        row.innerHTML = `
          <div class="rank-medal ${medalClass}">${index + 1}</div>
          <div>
            <div class="rank-name">${item.nome}</div>
            <div class="rank-note">${note}</div>
          </div>
          <div class="rank-score">${item.pezzi}</div>
        `;
        ranking.appendChild(row);
      });

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });
}

ensureAuth();

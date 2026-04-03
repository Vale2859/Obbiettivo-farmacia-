
const LS_USER_KEY = 'ldf_logged_user_v2';

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function showPage(page){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === page);
  });
}

function setLoggedUser(name){ localStorage.setItem(LS_USER_KEY, name); }
function getLoggedUser(){ return localStorage.getItem(LS_USER_KEY) || ''; }
function clearLoggedUser(){ localStorage.removeItem(LS_USER_KEY); }

function currentMonthIndexFromLabel(label){
  const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const idx = months.findIndex(m => m.toLowerCase() === String(label || '').toLowerCase());
  return idx >= 0 ? idx : (new Date().getMonth());
}

function currentMonthEntry(data){
  const idx = currentMonthIndexFromLabel(data.meseCorrente);
  return (data.storicoMensile || [])[idx] || null;
}

fetch('dati.json').then(r => r.json()).then(data => {
  const operators = data.operatori || [];

  function applyUser(user){
    const name = user.nome;
    const initial = name ? name.charAt(0).toUpperCase() : 'O';
    document.getElementById('welcomeName').textContent = name.toUpperCase() + '👋';
    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('storicoUserName').textContent = name;

    const monthEntry = currentMonthEntry(data);
    const current = Number(monthEntry && monthEntry.personali ? (monthEntry.personali[name] || 0) : 0);
    const minGoal = Number(data.premi.min || 121);
    const maxGoal = Number(data.premi.max || 150);
    const passed = Math.max(Number(data.giorniPassati || 1), 1);
    const total = Math.max(Number(data.giorniTotali || 30), 1);
    const left = Math.max(total - passed, 1);

    const toMin = Math.max(minGoal - current, 0);
    const toMax = Math.max(maxGoal - current, 0);
    const avg = current / passed;
    const forecast = Math.round(avg * total);
    const needDay = toMax > 0 ? Math.ceil(toMax / left) : 0;
    const percent = clamp((current / maxGoal) * 100, 0, 100);

    const groupCurrent = Number(monthEntry ? (monthEntry.gruppo || 0) : 0);
    const groupPercent = clamp((groupCurrent / data.obiettivoGruppo) * 100, 0, 100);
    const groupMissing = Math.max(Number(data.obiettivoGruppo || 450) - groupCurrent, 0);
    const groupForecast = Math.round((groupCurrent / passed) * total);
    const groupNeed = groupMissing > 0 ? Math.ceil(groupMissing / left) : 0;

    document.getElementById('goalMinTop').textContent = minGoal;
    document.getElementById('goalMaxTop').textContent = maxGoal;
    document.getElementById('minMarkerText').textContent = minGoal;
    document.getElementById('maxMarkerText').textContent = maxGoal;
    document.getElementById('miniMinText').textContent = minGoal;
    document.getElementById('miniMaxText').textContent = maxGoal;

    document.getElementById('piecesDone').textContent = current;
    document.getElementById('heroBig').innerHTML = `${current} / ${maxGoal} <span>PEZZI</span>`;
    document.getElementById('heroPercentText').textContent = `Sei al ${Math.round(percent)}% del massimo`;
    document.getElementById('toMin').innerHTML = `${toMin} <span>pezzi</span>`;
    document.getElementById('toMax').innerHTML = `${toMax} <span>pezzi</span>`;
    document.getElementById('needDay').innerHTML = `${needDay} <span>pezzi/giorno</span>`;
    document.getElementById('avg').innerHTML = `${avg.toFixed(1)} <span>pezzi/giorno</span>`;
    document.getElementById('forecast').innerHTML = `${forecast} <span>pezzi</span>`;
    document.getElementById('forecastPill').textContent =
      current === 0 ? 'Aggiorna i dati' :
      forecast >= maxGoal ? 'Ce la puoi fare! 🚀' :
      (forecast >= minGoal ? 'Premio alla portata' : 'Serve spingere');

    document.getElementById('groupPercent').textContent = `${Math.round(groupPercent)}%`;
    document.getElementById('groupMain').textContent = `${groupCurrent} / ${data.obiettivoGruppo} PEZZI`;
    document.getElementById('groupMissing').textContent = groupMissing;
    document.getElementById('groupForecast').textContent = groupForecast;
    document.getElementById('groupNeed').textContent = groupNeed;

    document.getElementById('heroFill').style.width = `${percent}%`;
    document.getElementById('groupFill').style.width = `${groupPercent}%`;
    document.getElementById('ring').style.setProperty('--p', percent.toFixed(2));

    const annualGroupTotal = (data.storicoMensile || []).reduce((acc, item) => acc + Number(item.gruppo || 0), 0);
    const annualFill = clamp((annualGroupTotal / data.obiettivoAnnuale) * 100, 0, 100);
    document.getElementById('annualTotal').textContent = annualGroupTotal;
    document.getElementById('annualPercent').textContent = `${Math.round((annualGroupTotal / data.obiettivoAnnuale) * 100)}%`;
    document.getElementById('annualFill').style.width = `${annualFill}%`;

    const monthsWrap = document.getElementById('monthsList');
    monthsWrap.innerHTML = '';
    (data.storicoMensile || []).forEach(m => {
      const mine = Number((m.personali || {})[name] || 0);
      const group = Number(m.gruppo || 0);
      const row = document.createElement('div');
      row.className = 'month-row';
      row.innerHTML = `
        <div class="month-name">${m.mese}</div>
        <div class="month-box">
          <div class="month-box-title">Personali</div>
          <div class="month-box-value">${mine}</div>
          <div class="month-box-sub">pezzi</div>
        </div>
        <div class="month-box group">
          <div class="month-box-title">Gruppo</div>
          <div class="month-box-value">${group}</div>
          <div class="month-box-sub">pezzi</div>
        </div>
      `;
      monthsWrap.appendChild(row);
    });
  }

  function login(name, pin){
    const user = operators.find(o => o.nome === name && String(o.pin) === String(pin));
    if (!user) return false;
    setLoggedUser(user.nome);
    document.getElementById('loginOverlay').style.display = 'none';
    applyUser(user);
    return true;
  }

  const savedUser = getLoggedUser();
  const autoUser = operators.find(o => o.nome === savedUser);
  if (autoUser) {
    document.getElementById('loginOverlay').style.display = 'none';
    applyUser(autoUser);
  }

  document.getElementById('loginBtn').addEventListener('click', () => {
    const name = document.getElementById('loginNome').value;
    const pin = document.getElementById('loginPin').value.trim();
    const ok = login(name, pin);
    document.getElementById('loginError').textContent = ok ? '' : 'Nome o PIN non corretti.';
  });

  document.querySelectorAll('.nav').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.target));
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearLoggedUser();
    showPage('obiettivi');
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('loginPin').value = '';
    document.getElementById('loginError').textContent = '';
  });
});

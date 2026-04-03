
const LS_USER_KEY = 'ldf_logged_user_v6';

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function showPage(page){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav').forEach(btn => btn.classList.toggle('active', btn.dataset.target === page));
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

// Conta solo i giorni lavorativi lun-sab. Domenica esclusa.
function workedDaysPassed(year, monthIndex, upToDay){
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const limit = Math.max(1, Math.min(Number(upToDay || 1), lastDay));
  let count = 0;
  for(let day = 1; day <= limit; day++){
    const dow = new Date(year, monthIndex, day).getDay(); // 0 domenica
    if(dow !== 0) count++;
  }
  return count;
}
function workedDaysRemaining(year, monthIndex, fromDay){
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const start = Math.max(1, Math.min(Number(fromDay || 1), lastDay));
  let count = 0;
  for(let day = start + 1; day <= lastDay; day++){
    const dow = new Date(year, monthIndex, day).getDay();
    if(dow !== 0) count++;
  }
  return count;
}
function effectiveDayOfMonth(data, monthIndex, year){
  const now = new Date();
  if(now.getFullYear() === year && now.getMonth() === monthIndex){
    return now.getDate();
  }
  return Number(data.giorniPassati || 1);
}

fetch('dati.json').then(r => r.json()).then(data => {
  const operators = data.operatori || [];

  function applyUser(user){
    const name = user.nome;
    document.getElementById('welcomeName').textContent = name.toUpperCase() + '👋';
    document.getElementById('avatarInitial').textContent = name.charAt(0).toUpperCase();
    document.getElementById('storicoUserName').textContent = name;

    const monthIndex = currentMonthIndexFromLabel(data.meseCorrente);
    const calcYear = Number(data.annoCalcolo || new Date().getFullYear());
    const dayRef = effectiveDayOfMonth(data, monthIndex, calcYear);

    const daysPassed = Math.max(1, workedDaysPassed(calcYear, monthIndex, dayRef));
    const daysRemaining = workedDaysRemaining(calcYear, monthIndex, dayRef);
    const totalWorked = daysPassed + daysRemaining;

    const monthEntry = currentMonthEntry(data);
    const current = Number(monthEntry && monthEntry.personali ? (monthEntry.personali[name] || 0) : 0);
    const minGoal = Number(data.premi.min || 121);
    const maxGoal = Number(data.premi.max || 150);

    const toMin = Math.max(minGoal - current, 0);
    const toMax = Math.max(maxGoal - current, 0);

    // MEDIA ATTUALE: pezzi venduti / giorni lavorativi passati
    const avg = current / daysPassed;

    // RITMO NECESSARIO DINAMICO:
    // pezzi che mancano a 150 / giorni lavorativi rimasti
    const needDay = toMax > 0 ? (daysRemaining > 0 ? (toMax / daysRemaining) : toMax) : 0;

    // PREVISIONE FINE MESE: media attuale * giorni lavorativi del mese
    const forecast = Math.round(avg * totalWorked);
    const percent = clamp((current / maxGoal) * 100, 0, 100);

    const groupCurrent = Number(monthEntry ? (monthEntry.gruppo || 0) : 0);
    const groupPercent = clamp((groupCurrent / Number(data.obiettivoGruppo || 450)) * 100, 0, 100);
    const groupMissing = Math.max(Number(data.obiettivoGruppo || 450) - groupCurrent, 0);
    const groupAvg = groupCurrent / daysPassed;
    const groupForecast = Math.round(groupAvg * totalWorked);
    const groupNeed = groupMissing > 0 ? (daysRemaining > 0 ? Math.ceil(groupMissing / daysRemaining) : groupMissing) : 0;

    document.getElementById('goalMinTop').textContent = minGoal;
    document.getElementById('goalMaxTop').textContent = maxGoal;
    document.getElementById('minMarkerText').textContent = minGoal;
    document.getElementById('maxMarkerText').textContent = maxGoal;

    document.getElementById('piecesDone').textContent = current;
    document.getElementById('heroBig').innerHTML = `${current} / ${maxGoal} <span>PEZZI</span>`;
    document.getElementById('heroPercentText').textContent = `Sei al ${Math.round(percent)}% del massimo`;
    document.getElementById('toMin').innerHTML = `${toMin} <span>pezzi</span>`;
    document.getElementById('toMax').innerHTML = `${toMax} <span>pezzi</span>`;
    document.getElementById('needDay').innerHTML = `${needDay.toFixed(1)} <span>pezzi/giorno</span>`;
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
    const annualFill = clamp((annualGroupTotal / Number(data.obiettivoAnnuale || 5400)) * 100, 0, 100);
    document.getElementById('annualTotal').textContent = annualGroupTotal;
    document.getElementById('annualPercent').textContent = `${Math.round((annualGroupTotal / Number(data.obiettivoAnnuale || 5400)) * 100)}%`;
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

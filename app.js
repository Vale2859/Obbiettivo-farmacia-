
const LS_USER_KEY = 'ldf_logged_user_v4';

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

// Conta solo i giorni lavorativi lun-sab, escludendo la domenica
function countWorkedDaysInMonth(year, monthIndex, upToDay){
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const limit = Math.max(1, Math.min(upToDay, lastDay));
  let count = 0;
  for(let day = 1; day <= limit; day++){
    const jsDay = new Date(year, monthIndex, day).getDay(); // 0=dom, 1=lun ... 6=sab
    if(jsDay !== 0) count++;
  }
  return count;
}

function countRemainingWorkedDaysInMonth(year, monthIndex, fromDayExclusive){
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for(let day = fromDayExclusive + 1; day <= lastDay; day++){
    const jsDay = new Date(year, monthIndex, day).getDay();
    if(jsDay !== 0) count++;
  }
  return count;
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
    const todayDay = Number(data.giorniPassati || new Date().getDate());
    const workedDaysPassed = Math.max(1, countWorkedDaysInMonth(calcYear, monthIndex, todayDay));
    const workedDaysRemaining = countRemainingWorkedDaysInMonth(calcYear, monthIndex, todayDay);

    const monthEntry = currentMonthEntry(data);
    const current = Number(monthEntry && monthEntry.personali ? (monthEntry.personali[name] || 0) : 0);
    const minGoal = Number(data.premi.min || 121);
    const maxGoal = Number(data.premi.max || 150);

    const toMin = Math.max(minGoal - current, 0);
    const toMax = Math.max(maxGoal - current, 0);
    const avg = current / workedDaysPassed;
    const forecast = Math.round(avg * (workedDaysPassed + workedDaysRemaining));

    // ritmo target fisso su 150 pz / giorni lavorativi del mese, escludendo domenica
    const totalWorkedDaysMonth = workedDaysPassed + workedDaysRemaining;
    const targetDailyPace = totalWorkedDaysMonth > 0 ? (maxGoal / totalWorkedDaysMonth) : 0;

    const percent = clamp((current / maxGoal) * 100, 0, 100);

    const groupCurrent = Number(monthEntry ? (monthEntry.gruppo || 0) : 0);
    const groupPercent = clamp((groupCurrent / data.obiettivoGruppo) * 100, 0, 100);
    const groupMissing = Math.max(Number(data.obiettivoGruppo || 450) - groupCurrent, 0);
    const groupForecast = Math.round(avg * 0 + (groupCurrent / workedDaysPassed) * (workedDaysPassed + workedDaysRemaining));
    const groupNeed = workedDaysRemaining > 0 ? Math.ceil(groupMissing / workedDaysRemaining) : 0;

    document.getElementById('goalMinTop').textContent = minGoal;
    document.getElementById('goalMaxTop').textContent = maxGoal;
    document.getElementById('minMarkerText').textContent = minGoal;
    document.getElementById('maxMarkerText').textContent = maxGoal;

    document.getElementById('piecesDone').textContent = current;
    document.getElementById('heroBig').innerHTML = `${current} / ${maxGoal} <span>PEZZI</span>`;
    document.getElementById('heroPercentText').textContent = `Sei al ${Math.round(percent)}% del massimo`;
    document.getElementById('toMin').innerHTML = `${toMin} <span>pezzi</span>`;
    document.getElementById('toMax').innerHTML = `${toMax} <span>pezzi</span>`;
    document.getElementById('needDay').innerHTML = `${targetDailyPace.toFixed(1)} <span>pezzi/giorno</span>`;
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

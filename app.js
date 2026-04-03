
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

fetch('dati.json').then(r => r.json()).then(data => {
  const user = data.operatori.find(x => x.nome === 'Vale') || data.operatori[0];
  const current = user.pezzi;
  const minGoal = data.premi.min;
  const maxGoal = data.premi.max;
  const passed = Math.max(data.giorniPassati, 1);
  const total = data.giorniTotali;
  const left = Math.max(total - passed, 1);

  const toMin = Math.max(minGoal - current, 0);
  const toMax = Math.max(maxGoal - current, 0);
  const avg = current / passed;
  const forecast = Math.round(avg * total);
  const needDay = toMax > 0 ? Math.ceil(toMax / left) : 0;
  const percent = clamp((current / maxGoal) * 100, 0, 100);

  let reward = 0;
  if (current >= minGoal){
    const factor = clamp((current - minGoal) / (maxGoal - minGoal), 0, 1);
    reward = data.premi.base + ((data.premi.maxPremio - data.premi.base) * factor);
  }

  const groupCurrent = data.operatori.reduce((s,o) => s + o.pezzi, 0);
  const groupPercent = clamp((groupCurrent / data.obiettivoGruppo) * 100, 0, 100);
  const groupMissing = Math.max(data.obiettivoGruppo - groupCurrent, 0);
  const groupForecast = Math.round((groupCurrent / passed) * total);
  const groupNeed = groupMissing > 0 ? Math.ceil(groupMissing / left) : 0;
  const rewardWithGroup = reward + (groupCurrent >= data.obiettivoGruppo ? data.premi.bonusGruppo : 0);

  document.getElementById('welcomeName').textContent = user.nome.toUpperCase() + '👋';
  document.getElementById('piecesDone').textContent = current;
  document.getElementById('heroBig').innerHTML = `${current} / ${maxGoal} <span>PEZZI</span>`;
  document.getElementById('heroPercentText').textContent = `Sei al ${Math.round(percent)}% del massimo`;

  document.getElementById('toMin').innerHTML = `${toMin} <span>pezzi</span>`;
  document.getElementById('toMax').innerHTML = `${toMax} <span>pezzi</span>`;
  document.getElementById('needDay').innerHTML = `${needDay} <span>pezzi/giorno</span>`;
  document.getElementById('avg').innerHTML = `${avg.toFixed(1)} <span>pezzi/giorno</span>`;
  document.getElementById('forecast').innerHTML = `${forecast} <span>pezzi</span>`;
  document.getElementById('forecastPill').textContent = forecast >= maxGoal ? 'Ce la puoi fare! 🚀' : (forecast >= minGoal ? 'Premio alla portata' : 'Serve spingere');

  document.getElementById('groupPercent').textContent = `${Math.round(groupPercent)}%`;
  document.getElementById('groupMain').textContent = `${groupCurrent} / ${data.obiettivoGruppo} PEZZI`;
  document.getElementById('groupMissing').textContent = groupMissing;
  document.getElementById('groupForecast').textContent = groupForecast;
  document.getElementById('groupNeed').textContent = groupNeed;

  document.getElementById('rewardNow').textContent = Math.round(reward);
  document.getElementById('rewardWithGroup').textContent = Math.round(rewardWithGroup);
  document.getElementById('groupBonus').textContent = data.premi.bonusGruppo;
  document.getElementById('rewardBase').textContent = `${data.premi.base}€`;
  document.getElementById('rewardMax').textContent = `${data.premi.maxPremio}€`;

  document.getElementById('heroFill').style.width = `${percent}%`;
  document.getElementById('groupFill').style.width = `${groupPercent}%`;
  document.getElementById('rewardFill').style.width = `${percent}%`;
  document.getElementById('ring').style.setProperty('--p', percent.toFixed(2));

  const rankingGrid = document.getElementById('rankingGrid');
  const sorted = [...data.operatori].sort((a,b) => b.pezzi - a.pezzi);
  rankingGrid.innerHTML = '';
  sorted.forEach((item, idx) => {
    const init = item.nome.charAt(0).toUpperCase();
    const card = document.createElement('div');
    card.className = `rank-card ${item.nome === user.nome ? 'rank-me' : 'rank-other'}`;
    const medal = idx === 0 ? 'medal-1' : idx === 1 ? 'medal-2' : idx === 2 ? 'medal-3' : 'medal-4';
    card.innerHTML = `
      <div class="rank-medal ${medal}">${idx + 1}</div>
      <div class="rank-avatar">${init}</div>
      <div class="rank-name">${item.nome}</div>
      <div class="rank-extra">${item.nome === user.nome ? 'Sei al TOP! 🔥' : '&nbsp;'}</div>
      <div class="rank-score">${item.pezzi}</div>
    `;
    rankingGrid.appendChild(card);
  });
});

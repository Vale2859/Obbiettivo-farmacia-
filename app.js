function login(){
  const nome=document.getElementById("nome").value;
  const pin=document.getElementById("pin").value;

  fetch("dati.json").then(r=>r.json()).then(data=>{
    const user=data.operatori.find(u=>u.nome===nome && u.pin==pin);
    if(user){
      localStorage.setItem("utente",nome);
      window.location="index.html";
    }else alert("Errore dati");
  });
}

if(window.location.pathname.includes("index.html")){
  const u=localStorage.getItem("utente");
  if(!u) window.location="login.html";
  else caricaDati(u);
}

function caricaDati(nome){
fetch("dati.json").then(r=>r.json()).then(data=>{

const user=data.operatori.find(u=>u.nome===nome);

let percent=(user.pezzi/data.obiettivoPersonale)*100;
let mancanti=data.obiettivoPersonale-user.pezzi;

let media=user.pezzi/data.giorniPassati;
let previsione=Math.round(media*data.giorniTotali);

let giorniRestanti=data.giorniTotali-data.giorniPassati;
let alGiorno=Math.ceil(mancanti/giorniRestanti);

// personale
document.getElementById("utente").innerHTML="👤 "+user.nome;
document.getElementById("progresso").innerHTML=user.pezzi+" / "+data.obiettivoPersonale;
document.getElementById("barra").style.width=percent+"%";

document.getElementById("stato").innerHTML=
percent>=100?"🟢 Sopra target":percent>=60?"🟡 In linea":"🔴 Sotto target";

document.getElementById("badge").innerHTML=
previsione>=data.obiettivoPersonale?"🚀 Ce la fai":"⚠️ Devi accelerare";

document.getElementById("extra").innerHTML=
"📉 Mancano: "+mancanti+
"<br>📊 Media: "+media.toFixed(1)+
"<br>🔮 Previsione: "+previsione+
"<br>📅 "+alGiorno+"/giorno";

// gruppo
let totale=data.operatori.reduce((s,o)=>s+o.pezzi,0);
let percG=(totale/data.obiettivoGruppo)*100;
let mancG=data.obiettivoGruppo-totale;

let mediaG=totale/data.giorniPassati;
let prevG=Math.round(mediaG*data.giorniTotali);

let alGiornoG=Math.ceil(mancG/giorniRestanti);

document.getElementById("gruppo").innerHTML=
totale+"/"+data.obiettivoGruppo+
"<br>📉 Mancano: "+mancG+
"<br>🔮 "+prevG+
"<br>📅 "+alGiornoG+"/giorno";

document.getElementById("barraGruppo").style.width=percG+"%";

// classifica
data.operatori.sort((a,b)=>b.pezzi-a.pezzi);
let html="";
data.operatori.forEach((o,i)=>{
let evidenza=o.nome===nome?"style='font-weight:bold;color:#2e7d32'":"";
html+=`<div ${evidenza}>${i+1}. ${o.nome} - ${o.pezzi}</div>`;
});
document.getElementById("classifica").innerHTML=html;

});
}

function logout(){
localStorage.removeItem("utente");
window.location="login.html";
}

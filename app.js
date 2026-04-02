function login(){
  const nome=document.getElementById("nome").value;
  const pin=document.getElementById("pin").value;

  fetch("dati.json").then(r=>r.json()).then(data=>{
    const user=data.operatori.find(u=>u.nome===nome && u.pin==pin);
    if(user){
      localStorage.setItem("utente",nome);
      window.location="index.html";
    }else alert("Errore");
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

document.getElementById("utente").innerHTML="👤 "+user.nome;
document.getElementById("progresso").innerHTML="🎯 "+user.pezzi+" / "+data.obiettivoPersonale;
document.getElementById("barra").style.width=percent+"%";

document.getElementById("stato").innerHTML=
percent>=100?"🟢 Sopra target":percent>=60?"🟡 In linea":"🔴 Sotto target";

document.getElementById("badge").innerHTML=
previsione>=data.obiettivoPersonale?"🚀 Ce la fai":"⚠️ Devi spingere";

document.getElementById("extra").innerHTML=
"📉 Mancano: "+mancanti+"<br>🔮 Prev: "+previsione+"<br>📅 "+alGiorno+"/giorno";

// gruppo
let totale=data.operatori.reduce((s,o)=>s+o.pezzi,0);
let percG=(totale/data.obiettivoGruppo)*100;
document.getElementById("gruppo").innerHTML=
"📊 "+totale+"/"+data.obiettivoGruppo;
document.getElementById("barraGruppo").style.width=percG+"%";

// classifica
data.operatori.sort((a,b)=>b.pezzi-a.pezzi);
let html="";
data.operatori.forEach((o,i)=>{
html+=`<div>${i+1}. ${o.nome} - ${o.pezzi}</div>`;
});
document.getElementById("classifica").innerHTML=html;

});
}

function logout(){
localStorage.removeItem("utente");
window.location="login.html";
}

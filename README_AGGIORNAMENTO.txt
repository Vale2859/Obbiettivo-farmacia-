LDF OBIETTIVI - DEFINITIVO PRONTO PER GITHUB

FILE DA CARICARE IN ROOT:
- index.html
- style.css
- app.js
- dati.json

ACCESSI OPERATORI:
- Cosimo / PIN 1
- Daniela / PIN 2
- Patrizia / PIN 3

COME FUNZIONA IL LOGIN:
- al primo accesso l'operatore inserisce nome e PIN
- il dispositivo lo ricorda
- non lo richiede più
- per cambiare operatore usa il pulsante "Cambia operatore" nella sezione Storico

COME AGGIORNARE I DATI OGNI DOMENICA:

1) giorniPassati
Aggiorna il numero di giorni trascorsi del mese.
Esempio:
"giorniPassati": 7

2) operatori -> settimane
Per ogni operatore inserisci i pezzi della settimana.
Esempio:
"settimane": [32, 28, 0, 0, 0]

3) gruppoSettimane
Inserisci i totali di gruppo per settimana.
Qui puoi mettere anche dati di altre persone senza mostrare nomi.
Esempio:
"gruppoSettimane": [110, 96, 0, 0, 0]

4) storicoMensile
A fine mese aggiorna il totale del mese corrispondente.
Esempio:
{"mese":"Gennaio","gruppo":438,"personali":{"Cosimo":121,"Daniela":118,"Patrizia":99}}

NOTE:
- lo storico mostra a sinistra solo il totale personale dell'operatore loggato
- a destra mostra solo il totale gruppo del mese
- il raggiungimento annuale è su 5400 pz
- può superare 5400, il totale continua comunque a crescere

CONSIGLIO PRATICO:
Ogni domenica aggiorna:
- giorniPassati
- settimane dei 3 operatori
- gruppoSettimane

Alla fine del mese aggiorna anche:
- storicoMensile del mese appena finito

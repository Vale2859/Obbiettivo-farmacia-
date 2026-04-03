LDF OBIETTIVI - VERSIONE CORRETTA HOME + STORICO

ADESSO LA HOME LEGGE I DATI DIRETTAMENTE DAL MESE CORRENTE DENTRO storicoMensile.
QUINDI TU DEVI AGGIORNARE SOLO QUESTE COSE:

1) meseCorrente
Esempio:
"meseCorrente": "Aprile"

2) giorniPassati
Esempio:
"giorniPassati": 7

3) storicoMensile del mese corrente
Esempio per Aprile:
{"mese":"Aprile","gruppo":289,"personali":{"Cosimo":85,"Daniela":82,"Patrizia":57}}

STOP.
NON DEVI PIÙ TOCCARE ALTRO PER FAR AGGIORNARE LA HOME.

COME FUNZIONA:
- la HOME prende i dati del mese indicato in meseCorrente
- lo STORICO mostra tutti i mesi
- il totale annuale si aggiorna sommando i valori di gruppo dei 12 mesi

LOGIN:
- Cosimo pin 1
- Daniela pin 2
- Patrizia pin 3

SE IL DISPOSITIVO HA GIÀ MEMORIZZATO UN UTENTE VECCHIO:
- apri Storico
- premi Cambia operatore
oppure svuota i dati del sito dal browser

ESEMPIO PRATICO OGNI DOMENICA:
- aggiorni giorniPassati
- aggiorni SOLO il mese corrente dentro storicoMensile

ESEMPIO:
"giorniPassati": 14

{"mese":"Aprile","gruppo":340,"personali":{"Cosimo":104,"Daniela":96,"Patrizia":72}}

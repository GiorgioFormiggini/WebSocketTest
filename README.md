```markdown
# WebSocketTest

Una repository di esempio per testare e sperimentare con WebSocket in Node.js, con pipeline CI/CD automatizzata tramite GitHub Actions.

## Descrizione

Questo progetto dimostra l'implementazione di una comunicazione WebSocket bidirezionale tra client e server, utilizzando Node.js. Include esempi pratici di connessione, invio e ricezione di messaggi in tempo reale.

## Caratteristiche

- **Server WebSocket** configurato con Node.js
- **Client di esempio** per testare la connessione
- **Pipeline CI/CD** automatizzata con GitHub Actions
- **Test automatici** per garantire la qualità del codice

## Prerequisiti

- Node.js (versione 18.x o 20.x)
- npm o yarn

## Installazione

```
# Clona la repository
git clone https://github.com/tuousername/WebSocketTest.git

# Entra nella directory
cd WebSocketTest

# Installa le dipendenze
npm install
```

## Utilizzo

### Avviare il server

```
npm start
```

Il server WebSocket sarà in ascolto sulla porta predefinita (solitamente 8080).

### Eseguire i test

```
npm test
```

### Lint del codice

```
npm run lint
```

## Struttura del progetto

```
WebSocketTest/
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # Configurazione GitHub Actions
├── src/
│   ├── server.js            # Server WebSocket
│   └── client.js            # Client di esempio
├── test/
│   └── websocket.test.js    # Test automatici
├── package.json
└── README.md
```

## Pipeline CI/CD

Il progetto utilizza GitHub Actions per automatizzare:

- **Testing** automatico su più versioni di Node.js (18.x, 20.x)
- **Linting** del codice per garantire standard di qualità
- **Build** e verifica della compatibilità

La pipeline si attiva automaticamente ad ogni push o pull request sul branch `main`.

## Tecnologie utilizzate

- **Node.js** - Runtime JavaScript
- **WebSocket (ws)** - Libreria per comunicazione WebSocket
- **GitHub Actions** - CI/CD automation

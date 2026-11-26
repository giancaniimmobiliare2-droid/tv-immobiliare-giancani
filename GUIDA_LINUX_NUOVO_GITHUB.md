# Guida Operativa Linux: Antigravity App e Nuovo Profilo GitHub

Questa guida spiega passo passo come aprire i progetti su **Linux** (con l'app **Antigravity**) e pubblicare in sicurezza la diretta su un **nuovo profilo GitHub** senza consumare token AI e senza rischiare sospensioni dell'account.

---

## 1. Scaricare i progetti da Google Drive su Linux
1. Apri il link della cartella Google Drive inviato su Telegram e scarica l'archivio (o i file della cartella `Antigravity`), poi estraili ad esempio in:
   ```bash
   mkdir -p ~/Progetti/Antigravity
   # sposta/estrai i file dentro ~/Progetti/Antigravity
   cd ~/Progetti/Antigravity
   ```
2. Apri la cartella `~/Progetti/Antigravity` direttamente dentro l'app **Antigravity** su Linux (`File -> Open Folder`).

---

## 2. Preparare gli strumenti base su Linux (una sola volta)
Apri il terminale (anche dentro Antigravity) e installa `git`, `python3` e `requests`:
```bash
sudo apt update && sudo apt install -y git python3 python3-pip
pip3 install --user requests urllib3
```

---

## 3. Regole d'oro per NON far bloccare il nuovo profilo GitHub
- **Carica su GitHub SOLO la cartella pulita `deploy_github_pages/`** (contiene `orizzontale.html`, `verticale.html`, `regia.html`, `index.html`, `Avatar.html`, `Demo_Antonio_Cammina_Parla.html`, `antonio_fluid_engine.js`, `diretta_live_project/`, `assets/`).
- **NON caricare mai su GitHub**: `token_*.json`, `credentials_*.json`, `push_*.py`, `setup_github.py`, `.env` o token `ghp_...` in chiaro.
- **NON far girare dirette 24H continue su GitHub Actions gratuite**: usa GitHub Pages solo per pubblicare il player HTML/JS statico (è gratuito e non consuma minuti Actions), mentre eventuali bot/automazioni falli girare in locale sul tuo PC Linux o Raspberry Pi.

---

## 4. Pubblicare sul nuovo profilo GitHub (2 metodi senza sprecare token AI)

### Metodo A — Automatico con il bot Python (consigliato, 1 solo commit)
1. Su `github.com`, accedi con il tuo **nuovo profilo** e crea un **Personal Access Token (Classic)** con il solo permesso `repo`:
   `Settings -> Developer settings -> Personal access tokens -> Tokens (classic) -> Generate new token`.
2. Dal terminale Linux nella cartella del progetto esegui:
   ```bash
   cd ~/Progetti/Antigravity
   export GH_NEW_TOKEN="INCOLLA_QUI_IL_TUO_NUOVO_TOKEN"
   python3 pubblica_su_nuovo_github.py --repo diretta-immobiliare-giancani
   unset GH_NEW_TOKEN
   ```
3. Lo script:
   - controlla che non ci siano chiavi/token esposti nei file;
   - crea il repository `diretta-immobiliare-giancani` sul tuo nuovo profilo (se non esiste già);
   - carica tutta la cartella `deploy_github_pages/` in **1 unico commit**;
   - attiva **GitHub Pages** automaticamente e ti stampa il link finale:
     `https://<TUO_NUOVO_USERNAME>.github.io/diretta-immobiliare-giancani/orizzontale.html`

---

### Metodo B — Con Git tradizionale da terminale Linux (senza token negli script)
```bash
cd ~/Progetti/Antigravity/deploy_github_pages
git init -b main
git config user.name "Immobiliare Giancani"
git config user.email "tua-email@esempio.it"
git add .
git commit -m "deploy: Diretta Live Immobiliare Giancani con Antonio Intero"
git remote add origin https://github.com/<NUOVO_USERNAME>/<NUOVO_REPO>.git
git push -u origin main
```
Poi su GitHub apri il repository -> **Settings -> Pages -> Build and deployment -> Deploy from a branch -> `main` / `/ (root)` -> Save**.

Dopo ~60 secondi la diretta sarà visibile su:
`https://<NUOVO_USERNAME>.github.io/<NUOVO_REPO>/orizzontale.html`

---

## 5. Come aggiornare in futuro con 1 solo comando
Ogni volta che modifichi `orizzontale.html` su Linux con Antigravity:
1. Copia il file aggiornato dentro `deploy_github_pages/` (`cp orizzontale.html deploy_github_pages/orizzontale.html`).
2. Riesegui **Metodo A** (`python3 pubblica_su_nuovo_github.py --repo diretta-immobiliare-giancani`) oppure `git add . && git commit -m "update" && git push` dentro `deploy_github_pages/`.

— Immobiliare Giancani

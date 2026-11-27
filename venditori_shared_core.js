(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔁 NUCLEO CONDIVISO UNICO — DIRETTA VENDITORI (16:9 ORIZZONTALE & 9:16 VERTICALE)
  // Ogni modifica a documenti, servizi, testi, voce o interazione si riflette
  // istantaneamente sia su venditori.html sia su venditoriVistaVerticale.html.
  // ═══════════════════════════════════════════════════════════════════════════
  const VIEW_CFG = Object.assign({
    variant: 'landscape',
    facingX: 84,
    armSwingScale: 0.75,
    elbowBendScale: 1.05
  }, window.VENDITORI_VIEW_CONFIG || {});

  // ═══════════════════════════════════════════════════════════════════════════
  // 📚 CATALOGO COMPLETO DOCUMENTI VENDITA + SOTTO-DOCUMENTI PER REALIZZARLI
  // ═══════════════════════════════════════════════════════════════════════════
  const DOCUMENTI_VENDITA = [
    {
      chip: '1. Atto Provenienza',
      kicker: '📑 DOCUMENTO 1 DI 7 • TITOLARITÀ LEGALE',
      title: 'Atto di Provenienza (Rogito, Successione o Donazione)',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'Certifica chi è il legittimo proprietario dell’immobile, come ne è entrato in possesso e se esistono vincoli, servitù o diritti di terzi da rispettare fino al rogito notarile.',
      col2Title: '🛠️ Documenti necessari per reperirlo o regolarizzarlo',
      col2Text: 'Se non trovi la copia cartacea, la recuperiamo presso lo Studio Notarile o l’Archivio Notarile. In caso di eredità serve la Dichiarazione di Successione registrata e l’accettazione tacita.',
      tags: ['Estremi Notaio e Data Atto', 'Dichiarazione di Successione', 'Voltura Catastale', 'Codice Fiscale Proprietari'],
      img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_1_atto.png',
      pose: 'welcome_open',
      speech: 'Benvenuti cari proprietari! Il primo documento fondamentale per mettere in vendita il vostro immobile è l’Atto di Provenienza, cioè il rogito notarile, la successione o la donazione. Serve a dimostrare con certezza la piena proprietà. Se lo avete smarrito, bastano documento d’identità ed estremi catastali per richiederne copia autentica in Archivio Notarile o in Conservatoria — Immobiliare Giancani'
    },
    {
      chip: '2. Planimetria & Visura',
      kicker: '📐 DOCUMENTO 2 DI 7 • CATASTO E SUPERFICIE',
      title: 'Visura Storica e Planimetria Catastale Ufficiale',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'Indica foglio, particella, subalterno, rendita catastale, consistenza in metri quadri e disposizione grafica dei vani. Al rogito il venditore deve dichiarare che la planimetria corrisponde allo stato reale.',
      col2Title: '🛠️ Documenti necessari per richiederla o aggiornarla',
      col2Text: 'Per estrarre la planimetria rasterizzata dal Catasto occorrono delega firmata e documento del proprietario. Se i tramezzi interni sono cambiati, un tecnico redige l’aggiornamento DOCFA.',
      tags: ['Delega Firmata Proprietario', 'Carta d’Identità e Codice Fiscale', 'Rilievo Metri Quadri Reali', 'Pratica DOCFA se variata'],
      img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_2_catasto.png',
      pose: 'explain_points',
      speech: 'Il secondo pilastro è composto da Visura Storica e Planimetria Catastale. Servono a verificare i dati fiscali, la superficie in metri quadri e l’esatta distribuzione interna delle stanze. Per ottenerle subito dal portale telematico bastano una semplice delega e il vostro documento d’identità — Immobiliare Giancani'
    },
    {
      chip: '3. Conformità Urbanistica',
      kicker: '🏛️ DOCUMENTO 3 DI 7 • REGOLARITÀ EDILIZIA & AGIBILITÀ',
      title: 'Titoli Edilizi, Conformità Urbanistica e Agibilità',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'È la garanzia più importante: dimostra che il fabbricato è stato costruito o ristrutturato con regolare Licenza, Concessione Edilizia, Permesso di Costruire, CILA, SCIA o Concessione in Sanatoria.',
      col2Title: '🛠️ Documenti necessari per realizzarla',
      col2Text: 'Occorre fare un Accesso agli Atti presso l’Ufficio Tecnico del Comune tramite delega a un tecnico abilitato, confrontando il progetto depositato con i metri quadri e i prospetti attuali.',
      tags: ['Delega Accesso Atti Comune', 'Precedenti Licenze / Sanatorie', 'Certificato di Agibilità / SCA', 'Relazione Tecnica Integrata'],
      img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_3_urbanistica.png',
      pose: 'present_left',
      speech: 'Terzo documento decisivo: la Conformità Urbanistica ed Edilizia insieme al Certificato di Agibilità. Serve a garantire all’acquirente e alla banca erogatrice del mutuo l’assenza di abusi edilizi. Per realizzarla richiediamo l’accesso agli atti in Comune con delega del proprietario e rilievo tecnico accurato — Immobiliare Giancani'
    },
    {
      chip: '4. Attestato APE',
      kicker: '⚡ DOCUMENTO 4 DI 7 • EFFICIENZA ENERGETICA OBBLIGATORIA',
      title: 'APE — Attestato di Prestazione Energetica',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'È obbligatorio per legge sin dal primo giorno di pubblicazione degli annunci immobiliari e va allegato all’atto notarile di compravendita, indicando la classe energetica dalla A4 alla G.',
      col2Title: '🛠️ Documenti necessari per realizzarlo',
      col2Text: 'Per redigere un nuovo APE valido 10 anni il tecnico certificatore necessita di planimetria catastale, visura, anno di costruzione, dati degli infissi e soprattutto del Libretto Impianto della caldaia.',
      tags: ['Libretto Caldaia / Climatizzatori', 'Controllo Fumi Aggiornato', 'Planimetria e Visura Catastale', 'Sopralluogo Certificatore'],
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_4_ape.png',
      pose: 'gesturing',
      speech: 'Quarto documento: l’Attestato di Prestazione Energetica, detto APE. È obbligatorio sia per promuovere correttamente l’annuncio sia per firmare dal notaio. Per farlo realizzare rapidamente dal nostro tecnico convenzionato servono visura, planimetria catastale e il libretto dell’impianto termico o caldaia — Immobiliare Giancani'
    },
    {
      chip: '5. Stato Civile & Identità',
      kicker: '🪪 DOCUMENTO 5 DI 7 • DATI PERSONALI E FIRME',
      title: 'Documenti d’Identità, Codice Fiscale e Regime Patrimoniale',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'Permette di individuare tutti gli aventi diritto alla firma (comunione o separazione dei beni, comproprietari o coeredi), evitando blocchi dell’ultimo minuto davanti al notaio.',
      col2Title: '🛠️ Documenti necessari per completarli',
      col2Text: 'Servono Carta d’Identità in corso di validità, Tessera Sanitaria e, per chi è coniugato o separato, l’Estratto per Riassunto dell’Atto di Matrimonio o il Certificato di Stato Libero.',
      tags: ['Carta d’Identità Valida', 'Tessera Sanitaria / C.F.', 'Estratto Atto di Matrimonio', 'Eventuale Sentenza Separazione'],
      img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_5_identita.png',
      pose: 'confident_close',
      speech: 'Quinto punto: i documenti anagrafici e di stato civile di tutti i proprietari. Servono a verificare se l’immobile rientra in comunione o separazione dei beni. Basta richiedere in Comune o tramite SPID l’estratto per riassunto dell’atto di matrimonio o il certificato di stato libero — Immobiliare Giancani'
    },
    {
      chip: '6. Mutui & Condominio',
      kicker: '🏦 DOCUMENTO 6 DI 7 • GARANZIA LIBERTÀ DA PESI',
      title: 'Situazione Ipotecaria, Estinzione Mutuo e Liberatoria Condominiale',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'Tutela venditore e acquirente dimostrando l’assenza di pignoramenti, ipoteche non note e arretrati condominiali ordinari o straordinari prima della consegna delle chiavi.',
      col2Title: '🛠️ Documenti necessari per ottenerli',
      col2Text: 'Effettuiamo una Visura Ipotecaria aggiornata; se c’è un mutuo residuo chiediamo alla banca il Conteggio Estintivo; se in condominio chiediamo all’Amministratore l’Attestazione Spese Pagate.',
      tags: ['Ispezione Ipotecaria Conservatoria', 'Conteggio Estintivo Banca', 'Liberatoria Amministratore', 'Regolamento Condominiale'],
      img: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_6_mutuo_condominio.png',
      pose: 'explain_points',
      speech: 'Sesto passaggio: verifica ipotecaria e condominiale. Anche se sulla casa c’è ancora un mutuo in corso si può vendere tranquillamente estinguendolo contestualmente al rogito: basta richiedere alla vostra banca il conteggio estintivo e all’amministratore la liberatoria delle spese condominiali — Immobiliare Giancani'
    },
    {
      chip: '7. Incarico & Stima',
      kicker: '🤝 DOCUMENTO 7 DI 7 • PARTENZA UFFICIALE SUL MERCATO',
      title: 'Incarico di Vendita Trasparente e Fascicolo Casa Sicura',
      col1Title: '🎯 A cosa serve nella vendita',
      col1Text: 'Raccoglie l’intero fascicolo verificato in un passaporto dell’immobile chiaro e trasparente, definendo prezzo concordato, durata, piano marketing e zero sorprese.',
      col2Title: '🛠️ Documenti necessari per attivarlo subito',
      col2Text: 'Una volta raccolti i documenti principali (o firmato il mandato per farli reperire da noi), sottoscriviamo l’incarico, il modulo privacy e antiriciclaggio per lanciare subito la promozione.',
      tags: ['Valutazione Reale in Metri Quadri', 'Modulo Antiriciclaggio', 'Piano Marketing Multicanale', 'Consegna Chiavi Opzionale'],
      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop',
      docPreview: 'docs_venditori/doc_7_incarico.png',
      pose: 'arms_raised',
      speech: 'Settimo e ultimo passo: il Fascicolo Casa Sicura con l’Incarico di Vendita trasparente. Con tutti i documenti controllati in anticipo, il vostro immobile diventa immediatamente mutabile, sicuro e veloce da vendere al miglior prezzo di mercato — Immobiliare Giancani'
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏆 CATALOGO SERVIZI ESCLUSIVI AGENZIA IMMOBILIARE GIANCANI
  // ═══════════════════════════════════════════════════════════════════════════
  const SERVIZI_GIANCANI = [
    {
      chip: '1. Stima Reale',
      kicker: '🏆 SERVIZIO 1 DI 6 • VALUTAZIONE PROFESSIONALE',
      title: 'Valutazione Reale e Analisi Comparativa al Metro Quadro',
      col1Title: '💎 Cosa facciamo per il tuo immobile',
      col1Text: 'Analizziamo i valori reali di compravenduto a Favara, Agrigento e provincia, calcolando con precisione la superficie commerciale in metri quadri, lo stato manutentivo e l’esposizione.',
      col2Title: '🚀 Il vantaggio concreto per te venditore',
      col2Text: 'Eviti di svendere il tuo patrimonio o di lasciarlo fermo per anni fuori mercato: parti subito con il prezzo giusto difendibile in trattativa.',
      tags: ['Sopralluogo Gratuito', 'Analisi Metri Quadri Reali', 'Report Compravenduto Zona'],
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
      pose: 'welcome_open',
      speech: 'Scopriamo i servizi esclusivi della nostra agenzia! Partiamo sempre da una valutazione reale e accurata dei metri quadri del vostro immobile a Favara e in tutta la provincia di Agrigento, basata sui valori effettivi di mercato per farvi ottenere il massimo risultato — Immobiliare Giancani'
    },
    {
      chip: '2. Check Documenti',
      kicker: '🏆 SERVIZIO 2 DI 6 • ZERO PENSIERI BUROCRATICI',
      title: 'Recupero e Regolarizzazione Completa di Tutti i Documenti',
      col1Title: '💎 Cosa facciamo per il tuo immobile',
      col1Text: 'Non hai tempo di andare in Comune, in Catasto o cercare un tecnico per l’APE? Pensiamo a tutto noi coordinando visure, planimetrie, accesso agli atti e certificazioni.',
      col2Title: '🚀 Il vantaggio concreto per te venditore',
      col2Text: 'Arrivi alla proposta d’acquisto e al rogito notarile con le carte in regola al cento per cento, azzerando contestazioni o ritardi bancari.',
      tags: ['Visure e Planimetrie in Sede', 'Tecnici Convenzionati APE', 'Accesso Atti Comunale'],
      img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1600&auto=format&fit=crop',
      pose: 'explain_points',
      speech: 'Secondo servizio molto apprezzato dai nostri clienti venditori: pensiamo noi a tutta la burocrazia! Dal recupero di visure e planimetrie catastali fino all’APE e alle verifiche urbanistiche con tecnici di fiducia — Immobiliare Giancani'
    },
    {
      chip: '3. Foto HD & Video 360°',
      kicker: '🏆 SERVIZIO 3 DI 6 • VALORIZZAZIONE VISIVA',
      title: 'Servizio Fotografico Luminoso, Video Tour 4K e Visita 360°',
      col1Title: '💎 Cosa facciamo per il tuo immobile',
      col1Text: 'Realizziamo scatti grandangolari luminosi, video emozionali verticali e orizzontali e tour virtuali interattivi che esaltano ogni singolo ambiente e i suoi metri quadri.',
      col2Title: '🚀 Il vantaggio concreto per te venditore',
      col2Text: 'Il tuo immobile spicca immediatamente rispetto agli annunci amatoriali e attira clienti realmente colpiti dalla casa già prima della visita fisica.',
      tags: ['Fotografia Grandangolare HD', 'Video Reels & YouTube', 'Virtual Tour Interattivo'],
      img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
      pose: 'present_left',
      speech: 'Terzo servizio: valorizzazione visiva di altissimo livello! Realizziamo foto luminose ad alta definizione, riprese video emozionali e tour virtuali a trecentosessanta gradi per far innamorare gli acquirenti fin dal primo sguardo — Immobiliare Giancani'
    },
    {
      chip: '4. Diretta TV & Social H24',
      kicker: '🏆 SERVIZIO 4 DI 6 • INNOVAZIONE ESCLUSIVA GIANCANI',
      title: 'Dirette TV Interattive H24, Social Media e Portali Nazionali',
      col1Title: '💎 Cosa facciamo per il tuo immobile',
      col1Text: 'Siamo pionieri con la nostra TV Immobiliare interattiva in diretta, unita a campagne costanti su Facebook, Instagram, Threads, YouTube, TikTok, Sito Ufficiale e portali.',
      col2Title: '🚀 Il vantaggio concreto per te venditore',
      col2Text: 'Massima visibilità continua sia locale sia verso acquirenti fuori sede o all’estero che cercano casa in Sicilia, 24 ore su 24.',
      tags: ['TV Live Interattiva 24H', 'Storie & Reels Quotidiani', 'Portali Immobiliari & Banca Dati'],
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
      pose: 'arms_raised',
      speech: 'Quarto servizio esclusivo: il vostro immobile va in onda nella nostra Diretta TV interattiva ventiquattro ore su ventiquattro, oltre che sui principali portali nazionali e su tutti i nostri canali social ufficiali — Immobiliare Giancani'
    },
    {
      chip: '5. Clienti Qualificati',
      kicker: '🏆 SERVIZIO 5 DI 6 • SELEZIONE ACQUIRENTI',
      title: 'Banca Dati Richieste Attive e Pre-Qualifica Finanziaria',
      col1Title: '💎 Cosa facciamo per il tuo immobile',
      col1Text: 'Incrociamo subito la tua casa con la nostra lista di acquirenti già profilati e verifichiamo preventivamente la reale capacità di acquisto o fattibilità di mutuo.',
      col2Title: '🚀 Il vantaggio concreto per te venditore',
      col2Text: 'Niente curiosi o perditempo per casa tua: portiamo in visita solo persone realmente motivate e pronte a formulare una proposta concreta.',
      tags: ['Zero Perditempo', 'Pre-Qualifica Mutuo', 'Report Periodico Visite'],
      img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1600&auto=format&fit=crop',
      pose: 'gesturing',
      speech: 'Quinto servizio: selezione rigorosa degli acquirenti. Prima di fissare appuntamenti nella vostra abitazione qualifichiamo le reali esigenze e la solidità finanziaria del cliente, portandovi solo visite mirate e concrete — Immobiliare Giancani'
    },
    {
      chip: '6. Fino al Rogito',
      kicker: '🏆 SERVIZIO 6 DI 6 • TUTELA CONTRATTUALE COMPLETA',
      title: 'Gestione Trattativa, Preliminare Registrato e Assistenza al Rogito',
      col1Title: '💎 Cosa facciamo per il tuo immobile',
      col1Text: 'Redigiamo proposte d’acquisto blindate, curiamo la registrazione del contratto preliminare, coordiniamo periti bancari e prepariamo l’intero incartamento per il Notaio.',
      col2Title: '🚀 Il vantaggio concreto per te venditore',
      col2Text: 'Vivi la vendita con serenità totale, accompagnato passo dopo passo da Antonio Giancani fino all’incasso dell’assegno circolare al rogito.',
      tags: ['Proposta & Caparra Tutelata', 'Registrazione Preliminare', 'Presenza Fisica al Rogito'],
      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop',
      pose: 'confident_close',
      speech: 'Sesto servizio: vi accompagniamo fianco a fianco dalla raccolta della proposta d’acquisto con caparra, alla registrazione del preliminare fino alla firma definitiva dal notaio. Venite a trovarci in Corso Vittorio Veneto 151 a Favara o chiamate il 3201667156 — Immobiliare Giancani'
    }
  ];

  let currentMode = 'documenti'; // 'documenti' | 'servizi' | 'checklist'
  let currentIdx = 0;
  let audioMuted = false;
  let isSpeaking = false;
  let speakGen = 0;
  let autoAdvanceTimer = null;
  const isStaticHost = !!(window.location && (
    window.location.protocol === 'file:' ||
    window.location.hostname.indexOf('github.io') !== -1
  ));
  let cloudTtsFailed = isStaticHost;
  let sellerAudioUnlocked = false;
  const masterAudio = new Audio();
  masterAudio.preload = 'auto';
  masterAudio.setAttribute('playsinline', '');
  const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  const checkedDocs = {};

  function showSellerUnlockPill(show) {
    const pill = document.getElementById('seller-audio-unlock-pill');
    if (pill) pill.classList.toggle('visible', !!show && !audioMuted);
  }

  function unlockSellerMasterAudio() {
    if (sellerAudioUnlocked) return;
    sellerAudioUnlocked = true;
    showSellerUnlockPill(false);
    try {
      masterAudio.src = SILENT_WAV;
      const pr = masterAudio.play();
      if (pr && typeof pr.catch === 'function') pr.catch(function(){});
    } catch(e) {}
    try {
      if (window.speechSynthesis) window.speechSynthesis.resume();
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎙️ MOTORE VOCALE UNIFICATO (IDENTICO SU 16:9, 9:16 & VENDITORI)
  // ═══════════════════════════════════════════════════════════════════════════
  function stopSellerVoice() {
    speakGen++;
    try {
      masterAudio.onended = null;
      masterAudio.onerror = null;
      masterAudio.onplay = null;
      masterAudio.pause();
    } catch(e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
    isSpeaking = false;
  }

  function splitSellerSpeech(clean) {
    const rawSentences = (clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean]).map(s => s.trim()).filter(Boolean);
    const chunks = [];
    rawSentences.forEach(s => {
      if (s.length <= 195) {
        chunks.push(s);
        return;
      }
      let rem = s;
      while (rem.length > 195) {
        let cut = rem.lastIndexOf(',', 190);
        if (cut < 60) cut = rem.lastIndexOf(' ', 190);
        if (cut < 40) cut = 190;
        chunks.push(rem.slice(0, cut + 1).trim());
        rem = rem.slice(cut + 1).trim();
      }
      if (rem) chunks.push(rem);
    });
    return chunks.length ? chunks : [clean];
  }

  function pickBestItalianVoice() {
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const itVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith('it'));
    if (!itVoices.length) return null;
    return itVoices.find(v => /giuseppe|cosimo|diego|luca|adriano|male/i.test(v.name))
      || itVoices.find(v => /google italiano|microsoft/i.test(v.name))
      || itVoices[0];
  }

  function playSellerWebSpeechFallback(text, myGen, onDone) {
    if (myGen !== speakGen || audioMuted || !window.speechSynthesis) {
      if (myGen === speakGen) { isSpeaking = false; if (typeof onDone === 'function') onDone(); }
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'it-IT';
      u.rate = 0.96;
      u.pitch = 0.94;
      const v = pickBestItalianVoice();
      if (v) u.voice = v;
      u.onstart = function() {
        if (myGen === speakGen) isSpeaking = true;
      };
      u.onend = function() {
        if (myGen !== speakGen) return;
        isSpeaking = false;
        if (typeof onDone === 'function') onDone();
      };
      u.onerror = function() {
        if (myGen !== speakGen) return;
        isSpeaking = false;
        if (typeof onDone === 'function') setTimeout(onDone, 6000);
      };
      isSpeaking = true;
      window.speechSynthesis.speak(u);
      return true;
    } catch(e) {
      return false;
    }
  }

  function speakSellerText(rawText, preferredPose, onDone) {
    stopSellerVoice();
    const myGen = speakGen;

    let clean = String(rawText || '').replace(/(\d+)\s*(?:mq|m²|m2)\b/gi, '$1 metri quadri');
    if (!clean.includes('Immobiliare Giancani')) {
      clean += ' — Immobiliare Giancani';
    }
    const subEl = document.getElementById('seller-speech-subtitle');
    if (subEl) subEl.textContent = clean;

    if (window._sellerRenderer && preferredPose) {
      window._sellerRenderer.setPose(preferredPose, 0.52);
    }

    if (audioMuted) {
      if (typeof onDone === 'function') setTimeout(onDone, 12000);
      return;
    }

    const sentences = splitSellerSpeech(clean);
    let sIdx = 0;

    function finishSpeech() {
      if (myGen !== speakGen) return;
      isSpeaking = false;
      if (typeof onDone === 'function') onDone();
    }

    function fetchChunkSrc(seg, mode) {
      if (mode === 0 && !isStaticHost && !cloudTtsFailed) {
        return Promise.resolve('/tts?voice=it-IT-GiuseppeMultilingualNeural&rate=-1%25&text=' + encodeURIComponent(seg.substring(0, 210)));
      }
      if (mode === 1) {
        return fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: seg.substring(0, 200), voice: 'it_male_m18' })
        }).then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }).then(j => {
          if (!j || !j.data) throw new Error('Empty');
          return 'data:audio/mp3;base64,' + j.data;
        });
      }
      return Promise.resolve('https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=it&q=' + encodeURIComponent(seg.substring(0, 180)));
    }

    function playNext(mode) {
      if (myGen !== speakGen || audioMuted || sIdx >= sentences.length) {
        finishSpeech();
        return;
      }
      const curIdx = sIdx++;
      const seg = sentences[curIdx];
      fetchChunkSrc(seg, mode).then(src => {
        if (myGen !== speakGen) return;
        let errHandled = false;

        function onFail(errObj) {
          if (errHandled || myGen !== speakGen) return;
          errHandled = true;
          masterAudio.onended = null;
          masterAudio.onerror = null;
          try { masterAudio.pause(); } catch(e) {}
          if (errObj && errObj.name === 'NotAllowedError') {
            isSpeaking = false;
            sellerAudioUnlocked = false;
            showSellerUnlockPill(true);
            if (typeof onDone === 'function') setTimeout(onDone, 11000);
            return;
          }
          if (mode === 0) {
            cloudTtsFailed = true;
            sIdx = curIdx;
            playNext(1);
          } else if (mode === 1) {
            sIdx = curIdx;
            playNext(2);
          } else {
            const remaining = sentences.slice(curIdx).join(' ');
            if (!playSellerWebSpeechFallback(remaining, myGen, onDone)) {
              finishSpeech();
            }
          }
        }

        masterAudio.onplay = () => {
          if (myGen !== speakGen) { try { masterAudio.pause(); } catch(e){} return; }
          isSpeaking = true;
          sellerAudioUnlocked = true;
          showSellerUnlockPill(false);
        };
        masterAudio.onended = () => {
          if (errHandled || myGen !== speakGen) return;
          playNext(mode);
        };
        masterAudio.onerror = () => onFail(null);
        masterAudio.src = src;
        const p = masterAudio.play();
        if (p && typeof p.catch === 'function') p.catch(err => onFail(err));
      }).catch(() => {
        if (myGen !== speakGen) return;
        if (mode === 0) {
          cloudTtsFailed = true;
          sIdx = curIdx;
          playNext(1);
        } else if (mode === 1) {
          sIdx = curIdx;
          playNext(2);
        } else {
          const remaining = sentences.slice(curIdx).join(' ');
          if (!playSellerWebSpeechFallback(remaining, myGen, onDone)) {
            finishSpeech();
          }
        }
      });
    }

    const startMode = (!isStaticHost && !cloudTtsFailed) ? 0 : 1;
    playNext(startMode);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 RENDERING SCHEDE, CHECKLIST E INTERAZIONE LIVE
  // ═══════════════════════════════════════════════════════════════════════════
  function getActiveList() {
    return currentMode === 'servizi' ? SERVIZI_GIANCANI : DOCUMENTI_VENDITA;
  }

  function renderTopicChips() {
    const strip = document.getElementById('seller-topic-strip');
    if (!strip) return;
    if (currentMode === 'checklist') {
      strip.innerHTML = '';
      return;
    }
    const list = getActiveList();
    strip.innerHTML = list.map((item, i) =>
      `<button type="button" class="topic-chip ${i === currentIdx ? 'active' : ''}" onclick="selectSellerTopic(${i}, true)">${item.chip}</button>`
    ).join('');
    if (VIEW_CFG.variant === 'vertical') {
      const act = strip.querySelector('.topic-chip.active');
      if (act && typeof act.scrollIntoView === 'function') {
        try { act.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch(e) {}
      }
    }
  }

  function renderChecklist() {
    const grid = document.getElementById('chk-items-grid');
    const title = document.getElementById('chk-score-title');
    if (!grid || !title) return;
    let count = 0;
    grid.innerHTML = DOCUMENTI_VENDITA.map((doc, i) => {
      const isOn = !!checkedDocs[i];
      if (isOn) count++;
      return `<div class="chk-item ${isOn ? 'checked' : ''}" onclick="toggleDocCheck(${i})">
        <span class="chk-badge">${isOn ? '✓' : ''}</span>
        <span>${doc.chip.replace(/^\d+\.\s*/, '')}</span>
      </div>`;
    }).join('');
    const pct = Math.round((count / DOCUMENTI_VENDITA.length) * 100);
    title.textContent = `Fascicolo Vendita al ${pct}% (${count} su ${DOCUMENTI_VENDITA.length} documenti già pronti)`;
  }

  window.toggleDocCheck = function(idx) {
    checkedDocs[idx] = !checkedDocs[idx];
    renderChecklist();
    const readyCount = Object.values(checkedDocs).filter(Boolean).length;
    const rem = DOCUMENTI_VENDITA.length - readyCount;
    let msg;
    if (rem === 0) {
      msg = 'Complimenti! Hai tutti e sette i documenti pronti: possiamo valutare subito i metri quadri della tua casa e metterla in vendita oggi stesso al 3201667156 — Immobiliare Giancani';
    } else {
      msg = `Hai già ${readyCount} documenti pronti su sette! Per gli altri ${rem} documenti mancanti non preoccuparti: ci occupiamo noi in agenzia di recuperarli in Catasto, Comune o tramite tecnico convenzionato — Immobiliare Giancani`;
    }
    speakSellerText(msg, rem === 0 ? 'arms_raised' : 'confident_close');
  };

  window.selectSellerTopic = function(idx, manualClick) {
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    const list = getActiveList();
    if (idx < 0) idx = list.length - 1;
    if (idx >= list.length) idx = 0;
    currentIdx = idx;

    const stdEl = document.getElementById('standard-topic-content');
    const chkEl = document.getElementById('checklist-content');
    if (stdEl) stdEl.style.display = 'flex';
    if (chkEl) chkEl.classList.remove('visible');
    renderTopicChips();

    const item = list[idx];
    document.getElementById('card-kicker').textContent = item.kicker;
    document.getElementById('card-title').textContent = item.title;
    document.getElementById('col1-label').textContent = item.col1Title;
    document.getElementById('col1-text').textContent = item.col1Text;
    document.getElementById('col2-label').textContent = item.col2Title;
    document.getElementById('col2-text').textContent = item.col2Text;
    document.getElementById('subdoc-tags').innerHTML = (item.tags || []).map(t => `<span class="subdoc-tag">✓ ${t}</span>`).join('');

    const detailGrid = document.getElementById('doc-detail-grid');
    const prevCard = document.getElementById('doc-preview-card');
    const prevImg = document.getElementById('doc-preview-img');
    if (detailGrid && prevCard && prevImg) {
      if (item.docPreview) {
        detailGrid.classList.add('with-preview');
        prevCard.style.display = 'flex';
        prevImg.src = item.docPreview;
        prevImg.alt = item.title + ' — fac-simile senza dati sensibili';
      } else {
        detailGrid.classList.remove('with-preview');
        prevCard.style.display = 'none';
      }
    }

    const panel = document.getElementById('seller-card-view');
    if (panel && VIEW_CFG.variant === 'vertical') {
      panel.scrollTop = 0;
    }

    const bg = document.getElementById('seller-bg-img');
    if (bg && item.img) {
      bg.classList.remove('pan-active');
      bg.src = item.img;
      void bg.offsetWidth;
      bg.classList.add('pan-active');
    }

    const startedAt = Date.now();
    speakSellerText(item.speech, item.pose, function() {
      if (!manualClick && currentMode !== 'checklist') {
        const waitLeft = Math.max(3000, 15000 - (Date.now() - startedAt));
        autoAdvanceTimer = setTimeout(function() {
          if (currentIdx + 1 >= list.length) {
            const nextTab = currentMode === 'documenti' ? 'servizi' : 'documenti';
            window.switchSellerTab(nextTab, true);
          } else {
            window.selectSellerTopic(currentIdx + 1, false);
          }
        }, waitLeft);
      }
    });
  };

  window.switchSellerTab = function(mode, fromAutoLoop) {
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    currentMode = mode;
    ['documenti', 'servizi', 'checklist'].forEach(m => {
      const b = document.getElementById('tab-btn-' + m);
      if (b) b.classList.toggle('active', m === mode);
    });

    if (mode === 'checklist') {
      document.getElementById('seller-topic-strip').innerHTML = '';
      document.getElementById('standard-topic-content').style.display = 'none';
      document.getElementById('checklist-content').classList.add('visible');
      renderChecklist();
      speakSellerText('Ecco la nostra Checklist Interattiva per i proprietari! Tocca i documenti che hai già a casa e scopri subito come ti aiutiamo a completare gratuitamente l’analisi del fascicolo — Immobiliare Giancani', 'explain_points');
    } else {
      currentIdx = 0;
      window.selectSellerTopic(0, !fromAutoLoop ? false : false);
    }
  };

  window.stepSellerTopic = function(delta) {
    if (currentMode === 'checklist') {
      window.switchSellerTab('documenti');
      return;
    }
    window.selectSellerTopic(currentIdx + delta, true);
  };

  window.nextTopicOnAvatarClick = function() {
    window.stepSellerTopic(1);
  };

  window.apriZoomDocumento = function() {
    const box = document.getElementById('doc-lightbox');
    const zoomImg = document.getElementById('doc-lightbox-img');
    const prevImg = document.getElementById('doc-preview-img');
    if (box && zoomImg && prevImg && prevImg.src) {
      zoomImg.src = prevImg.src;
      zoomImg.alt = prevImg.alt || 'Fac-simile documento senza dati sensibili';
      box.classList.add('visible');
    }
  };

  window.chiudiZoomDocumento = function() {
    const box = document.getElementById('doc-lightbox');
    if (box) box.classList.remove('visible');
  };

  window.sbloccaVoceVenditori = function() {
    audioMuted = false;
    const btn = document.getElementById('seller-audio-btn');
    if (btn) { btn.textContent = '🔊 VOCE ATTIVA'; btn.classList.remove('muted'); }
    unlockSellerMasterAudio();
    if (currentMode === 'checklist') {
      speakSellerText('Voce attiva! Ecco la Checklist Interattiva: seleziona i documenti che hai già disponibili e al resto pensiamo noi — Immobiliare Giancani', 'explain_points');
    } else {
      window.selectSellerTopic(currentIdx, true);
    }
  };

  window.toggleSellerAudio = function() {
    audioMuted = !audioMuted;
    const btn = document.getElementById('seller-audio-btn');
    if (audioMuted) {
      stopSellerVoice();
      showSellerUnlockPill(false);
      if (btn) { btn.textContent = '🔇 MUTO'; btn.classList.add('muted'); }
    } else {
      unlockSellerMasterAudio();
      if (btn) { btn.textContent = '🔊 VOCE ATTIVA'; btn.classList.remove('muted'); }
      if (currentMode !== 'checklist') window.selectSellerTopic(currentIdx, false);
    }
  };

  window.askSellerAdvisor = function() {
    const inp = document.getElementById('seller-question-input');
    if (!inp) return;
    const qRaw = inp.value.trim();
    if (!qRaw) return;
    inp.value = '';
    const q = qRaw.toLowerCase();

    if (q.includes('ape') || q.includes('energet') || q.includes('caldai')) {
      currentMode = 'documenti';
      ['documenti', 'servizi', 'checklist'].forEach(m => document.getElementById('tab-btn-' + m)?.classList.toggle('active', m === 'documenti'));
      window.selectSellerTopic(3, true);
      speakSellerText('Ottima domanda! Per realizzare l’Attestato di Prestazione Energetica APE servono visura, planimetria catastale e il libretto della caldaia o climatizzatori con controllo fumi: se non hai un tecnico, lo facciamo redigere rapidamente noi — Immobiliare Giancani', 'explain_points');
    } else if (q.includes('planimetr') || q.includes('catast') || q.includes('visur') || q.includes('metri')) {
      currentMode = 'documenti';
      ['documenti', 'servizi', 'checklist'].forEach(m => document.getElementById('tab-btn-' + m)?.classList.toggle('active', m === 'documenti'));
      window.selectSellerTopic(1, true);
      speakSellerText('Per ottenere la Planimetria e la Visura Catastale aggiornata con i metri quadri bastano il tuo documento d’identità e una delega in agenzia: la scarichiamo direttamente noi e verifichiamo che coincida con lo stato dei luoghi — Immobiliare Giancani', 'present_left');
    } else if (q.includes('succession') || q.includes('eredit') || q.includes('atto') || q.includes('rogit') || q.includes('donazion')) {
      currentMode = 'documenti';
      ['documenti', 'servizi', 'checklist'].forEach(m => document.getElementById('tab-btn-' + m)?.classList.toggle('active', m === 'documenti'));
      window.selectSellerTopic(0, true);
      speakSellerText('Se l’immobile proviene da eredità o smarrimento dell’atto, ti assistiamo nel reperire copia dell’atto notarile o della dichiarazione di successione con relativa voltura e trascrizione dell’accettazione tacita al rogito — Immobiliare Giancani', 'confident_close');
    } else if (q.includes('urbanist') || q.includes('abus') || q.includes('verand') || q.includes('sanator') || q.includes('agibilit') || q.includes('comune')) {
      currentMode = 'documenti';
      ['documenti', 'servizi', 'checklist'].forEach(m => document.getElementById('tab-btn-' + m)?.classList.toggle('active', m === 'documenti'));
      window.selectSellerTopic(2, true);
      speakSellerText('In caso di dubbi urbanistici o piccole difformità interne, tramite accesso agli atti in Comune verifichiamo licenze, concessioni o sanatorie e valutiamo subito con il tecnico la pratica CILA o SCIA prima di andare sul mercato — Immobiliare Giancani', 'explain_points');
    } else if (q.includes('mutu') || q.includes('ipotec') || q.includes('condomin') || q.includes('spese')) {
      currentMode = 'documenti';
      ['documenti', 'servizi', 'checklist'].forEach(m => document.getElementById('tab-btn-' + m)?.classList.toggle('active', m === 'documenti'));
      window.selectSellerTopic(5, true);
      speakSellerText('Puoi vendere casa anche con un mutuo ancora attivo! Chiediamo il conteggio estintivo alla tua banca per estinguerlo contestualmente dal notaio, insieme alla liberatoria spese dell’amministratore di condominio — Immobiliare Giancani', 'welcome_open');
    } else if (q.includes('valut') || q.includes('stima') || q.includes('quanto vale') || q.includes('prezz')) {
      currentMode = 'servizi';
      ['documenti', 'servizi', 'checklist'].forEach(m => document.getElementById('tab-btn-' + m)?.classList.toggle('active', m === 'servizi'));
      window.selectSellerTopic(0, true);
      speakSellerText('Effettuiamo un sopralluogo gratuito per stimare con precisione i metri quadri e il più alto valore reale di mercato del tuo immobile a Favara e provincia. Chiamaci al 3201667156 — Immobiliare Giancani', 'arms_raised');
    } else if (q.includes('serviz') || q.includes('agenzi') || q.includes('cosa fate') || q.includes('pubblic')) {
      window.switchSellerTab('servizi');
    } else {
      speakSellerText('Grazie per la tua domanda! In Agenzia Immobiliare Giancani controlliamo preventivamente tutti i documenti della tua casa, curiamo foto, video, dirette live e seguiamo acquirenti qualificati fino al rogito. Chiamaci al 3201667156 o passa in Corso Vittorio Veneto 151 a Favara — Immobiliare Giancani', 'welcome_open');
    }
  };

  // Espone snapshot read-only utile per verifica sincronizzazione tra 16:9 e 9:16
  window.VENDITORI_SHARED_CORE = {
    version: '2026.11.27-unified',
    variant: VIEW_CFG.variant,
    documentCount: DOCUMENTI_VENDITA.length,
    serviceCount: SERVIZI_GIANCANI.length
  };

  function unlockOnInteraction(ev) {
    const wasUnlocked = sellerAudioUnlocked;
    unlockSellerMasterAudio();
    const isControlClick = !!(ev && ev.target && ev.target.closest && ev.target.closest('#seller-audio-btn, .topic-chip, .nav-round-btn, .mode-tab-btn, #seller-audio-unlock-pill'));
    if (!wasUnlocked && !isControlClick && !isSpeaking && !audioMuted && currentMode !== 'checklist') {
      window.selectSellerTopic(currentIdx, false);
    }
  }
  document.addEventListener('click', unlockOnInteraction, { capture: true, passive: true });
  document.addEventListener('touchstart', unlockOnInteraction, { capture: true, passive: true });

  // Rotazione morbida dei temi chiari e vivaci ogni 14 secondi
  const TEMI = ['blu', 'verde', 'turchese', 'oro', 'porpora', 'tramonto', 'rosso'];
  let tIdx = 0;
  setInterval(function() {
    tIdx = (tIdx + 1) % TEMI.length;
    TEMI.forEach(t => document.body.classList.remove('tema-' + t));
    document.body.classList.add('tema-' + TEMI[tIdx]);
  }, 14000);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🕴️ INIZIALIZZAZIONE AVATAR ANTONIO A FIGURA INTERA CON 8 POSE COORDINATE
  // ═══════════════════════════════════════════════════════════════════════════
  function initSellerAvatar(retryCount) {
    if (typeof AntonioFluidRenderer === 'undefined') {
      if ((retryCount || 0) < 60) setTimeout(function() { initSellerAvatar((retryCount || 0) + 1); }, 100);
      return;
    }
    const canvas = document.getElementById('seller-antonio-canvas');
    if (!canvas) return;
    const renderer = new AntonioFluidRenderer(canvas, { width: 768, height: 1376 });
    renderer.setArmSwingScale(VIEW_CFG.armSwingScale);
    renderer.setElbowBendScale(VIEW_CFG.elbowBendScale);
    renderer.updateFacingFromStageX(VIEW_CFG.facingX);

    const suit = (typeof window.calcolaColoreAbitoDiretta === 'function') ? window.calcolaColoreAbitoDiretta() : 'navy';
    ['standing', 'walking', 'arms_raised', 'gesturing'].forEach(function(pose) {
      const url = (typeof window.getAssetAntonioGiancani === 'function')
        ? window.getAssetAntonioGiancani(pose, suit)
        : ('assets/antonio_' + pose + '_' + suit + '.webp');
      renderer.loadPoseSource(pose, url);
    });

    let lastTs = 0;
    let lastPoseCycle = 0;
    let wasSpk = false;

    function tickSeller(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      if (isSpeaking && !wasSpk) {
        lastPoseCycle = ts;
        renderer.setPose('welcome_open', 1.35);
      } else if (!isSpeaking && wasSpk) {
        renderer.setPose('neutral_poise', 1.45);
      } else if (isSpeaking && (ts - lastPoseCycle > 3600)) {
        lastPoseCycle = ts;
        if (typeof renderer.nextExpressivePose === 'function') {
          renderer.nextExpressivePose();
        }
      }
      wasSpk = isSpeaking;

      const t = ts * 0.001;
      renderer.setBehavioralState({
        isSpeaking: isSpeaking,
        speechEnergy: isSpeaking ? 0.80 : 0.08,
        mouthOpen: isSpeaking ? Math.max(0.08, Math.min(0.88, 0.42 + Math.sin(t * 14.2) * 0.34 + Math.sin(t * 22.5) * 0.18)) : 0,
        mouthWidth: isSpeaking ? (0.95 + Math.sin(t * 7.4) * 0.10) : 1.0,
        isWalking: false,
        walkPhase: 0
      });
      renderer.update(dt);
      renderer.render();
      requestAnimationFrame(tickSeller);
    }

    requestAnimationFrame(tickSeller);
    window._sellerRenderer = renderer;
  }

  function bootSellerBroadcast() {
    initSellerAvatar();
    renderChecklist();
    window.selectSellerTopic(0, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSellerBroadcast);
  } else {
    bootSellerBroadcast();
  }
})();

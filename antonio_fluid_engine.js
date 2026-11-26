/**
 * AntonioFluidEngine — Motore Scheletrico Rigido 3D (60 FPS, Collo e Colletto 100% Continui)
 * Renderizzazione Canvas 2D in spazio pixel canonico 768x1376:
 * - Figura intera fotografica 100% continua (ZERO tagli sul collo, ZERO cancellazione testa/colletto)
 * - Orientamento naturale per posa (standing già rivolta verso l'immobile a sinistra; gesturing
 *   specchiata come figura intera unica così indica l'immobile mantenendo collo e volto intatti)
 * - Braccia articolate a 2 ossa (Spalla -> Braccio -> Gomito -> Avambraccio/Mano) per la camminata
 * - Labiale fotografico e battito ciliare calibrati per singola posa nello stesso sistema di coordinate
 *
 * — Immobiliare Giancani
 */
(function(global) {
  'use strict';

  const BASE_W = 768;
  const BASE_H = 1376;

  /**
   * Landmark facciali calibrati su griglia pixel 768x1376 per ciascuna posa fotografica originale.
   */
  const POSE_FACE_LANDMARKS = {
    standing:    { eyeL: [356, 184], eyeR: [404, 184], mouth: [379, 238] },
    walking:     { eyeL: [363, 188], eyeR: [411, 188], mouth: [387, 242] },
    arms_raised: { eyeL: [360, 187], eyeR: [408, 187], mouth: [384, 241] },
    gesturing:   { eyeL: [330, 166], eyeR: [381, 166], mouth: [355, 222] }
  };

  const CANONICAL_LANDMARKS = {
    eyeL: [356 / BASE_W, 184 / BASE_H],
    eyeR: [404 / BASE_W, 184 / BASE_H],
    mouth: [379 / BASE_W, 238 / BASE_H],
    neck: [386 / BASE_W, 274 / BASE_H],
    footY: 0.968,
    lidColor: [152 / 255, 118 / 255, 100 / 255],
    creaseColor: [0.28, 0.17, 0.12]
  };

  /**
   * Calibrazione pose intere senza alcuna cancellazione sul collo:
   * - standing è già ruotata naturalmente verso sinistra (verso la scheda immobile quando Antonio è a destra)
   * - gesturing indica a destra nell'asset nativo, quindi quando Antonio è a destra (facingDir = -1)
   *   viene specchiata l'intera figura (testa + collo + abito + mano insieme) senza mai tagliare il collo!
   */
  const POSE_CALIBRATION = {
    standing:        { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: -1 },
    walking:         { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: 1  },
    arms_raised:     { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: 1  },
    gesturing:       { dx: 0, dy: 0, scale: 1.000, flipOnRight: -1, flipOnLeft: 1  },
    welcome_open:    { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: -1, isArticulatedPose: true },
    explain_points:  { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: -1, isArticulatedPose: true },
    present_left:    { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: -1, isArticulatedPose: true },
    confident_close: { dx: 0, dy: 0, scale: 1.000, flipOnRight: 1,  flipOnLeft: -1, isArticulatedPose: true }
  };

  /**
   * Profili cinematici per le 4 nuove pose umane coordinate (convenzione Canvas 2D Y-giù:
   * braccio sx schermo: + = verso l'esterno/sinistra immobile, - = verso l'interno busto;
   * braccio dx schermo: - = verso l'esterno/destra, + = verso l'interno busto).
   * Angoli naturali senza scuciture ai gomiti e pantaloni 100% puliti presi da arms_raised.
   */
  const ARTICULATED_POSE_PROFILES = {
    welcome_open: {
      shRotL: +0.09, elRotL: +0.14, shDxL: +1.2, shDyL: -1.4,
      shRotR: -0.09, elRotR: -0.14, shDxR: -1.2, shDyR: -1.4,
      torsoRotBias: -0.008, leanBias: 1.4, swayBias: -1.5,
      cadenceAmpL: 0.045, cadenceAmpR: 0.040, hipShift: 0.008,
      leftFront: true, rightFront: true
    },
    explain_points: {
      shRotL: +0.13, elRotL: +0.24, shDxL: +1.8, shDyL: -1.8,
      shRotR: -0.04, elRotR: -0.06, shDxR: -0.4, shDyR: -0.6,
      torsoRotBias: -0.012, leanBias: 1.0, swayBias: -2.4,
      cadenceAmpL: 0.065, cadenceAmpR: 0.025, hipShift: 0.010,
      leftFront: true, rightFront: true
    },
    present_left: {
      shRotL: +0.18, elRotL: +0.20, shDxL: +2.4, shDyL: -2.0,
      shRotR: +0.03, elRotR: +0.08, shDxR: +0.6, shDyR: -0.4,
      torsoRotBias: -0.018, leanBias: 1.5, swayBias: -3.2,
      cadenceAmpL: 0.055, cadenceAmpR: 0.025, hipShift: 0.012,
      leftFront: true, rightFront: true
    },
    confident_close: {
      shRotL: -0.05, elRotL: -0.14, shDxL: -0.8, shDyL: -0.8,
      shRotR: +0.05, elRotR: +0.14, shDxR: +0.8, shDyR: -0.8,
      torsoRotBias: -0.005, leanBias: 0.6, swayBias: -0.8,
      cadenceAmpL: 0.035, cadenceAmpR: 0.035, hipShift: 0.006,
      leftFront: true, rightFront: true
    },
    neutral_poise: {
      shRotL: +0.01, elRotL: +0.02, shDxL: 0, shDyL: 0,
      shRotR: -0.01, elRotR: -0.02, shDxR: 0, shDyR: 0,
      torsoRotBias: 0, leanBias: 0.2, swayBias: 0,
      cadenceAmpL: 0.022, cadenceAmpR: 0.022, hipShift: 0.003,
      leftFront: true, rightFront: true
    }
  };

  const MOTION_PRESETS = {
    naturale: { label: 'Naturale Televisivo', swayAmp: 1.0,  gestureAmp: 1.0,  breathAmp: 1.0,  headAmp: 1.0  },
    dinamico: { label: 'Espressivo Dinamico', swayAmp: 1.30, gestureAmp: 1.35, breathAmp: 1.15, headAmp: 1.25 },
    sobrio:   { label: 'Istituzionale Sobrio', swayAmp: 0.55, gestureAmp: 0.60, breathAmp: 0.85, headAmp: 0.55 }
  };

  /** Configurazione scheletrica 2-ossa su posa walking (768x1376) calibrata sul taglio pixel-esatto giacca/manica */
  const RIG_JOINTS = {
    neck:      { x: 386, y: 274 },
    torsoHip:  { x: 386, y: 758 },
    shoulderL: { x: 242, y: 365, r: 28 },
    elbowL:    { x: 229, y: 545, r: 29 },
    shoulderR: { x: 528, y: 365, r: 28 },
    elbowR:    { x: 544, y: 545, r: 30 },
    hipL:      { x: 328, y: 760 },
    hipR:      { x: 444, y: 760 }
  };

  // Bordo esterno reale della giacca (lasciando vuoto il gap sfondo a y=500..720)
  const LEFT_JACKET_SEAM = [
    [246, 338], [250, 360], [259, 400], [270, 440], [268, 500],
    [260, 545], [256, 600], [256, 660], [258, 700], [264, 735], [270, 756]
  ];

  const RIGHT_JACKET_SEAM = [
    [532, 338], [526, 360], [510, 400], [503, 440], [504, 500],
    [510, 545], [514, 620], [514, 670], [508, 715], [500, 745], [496, 756]
  ];

  // Bordo interno reale della manica (tra spalla e polso, ZERO pixel della giacca!)
  const LEFT_SLEEVE_INNER = [
    [246, 338], [250, 360], [258, 400], [266, 440], [262, 495], [250, 545]
  ];
  const RIGHT_SLEEVE_INNER = [
    [532, 338], [526, 360], [512, 400], [505, 440], [508, 495], [517, 545]
  ];

  class SpringValue {
    constructor(initial = 0, stiffness = 95, damping = 16) {
      this.value = initial;
      this.target = initial;
      this.velocity = 0;
      this.stiffness = stiffness;
      this.damping = damping;
    }
    step(dt) {
      const f = (this.target - this.value) * this.stiffness - this.velocity * this.damping;
      this.velocity += f * dt;
      this.value += this.velocity * dt;
      return this.value;
    }
    impulse(dv) {
      this.velocity += dv;
    }
  }

  function smoothstep(e0, e1, x) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  function organicBreathWave(phase) {
    const p = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const norm = p / (Math.PI * 2);
    if (norm < 0.38) {
      return 0.5 - 0.5 * Math.cos((norm / 0.38) * Math.PI);
    }
    return 0.5 + 0.5 * Math.cos(((norm - 0.38) / 0.62) * Math.PI);
  }

  function createOffscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function bakeCroppedPart(srcCanvas, ox, oy, w, h, traceClipFn) {
    const c = createOffscreen(w, h);
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(-ox, -oy);
    ctx.beginPath();
    traceClipFn(ctx);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(srcCanvas, 0, 0);
    ctx.restore();
    return { canvas: c, ox, oy, w, h };
  }

  class AntonioFluidRenderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.width = opts.width || BASE_W;
      this.height = opts.height || BASE_H;
      canvas.width = this.width;
      canvas.height = this.height;

      this.useWebGL = false;
      this.gl = null;
      this.program = null;
      this.ctx2d = this.canvas.getContext('2d');

      this.compCanvas = createOffscreen(BASE_W, BASE_H);
      this.compCtx = this.compCanvas.getContext('2d');

      this.textures = {};
      this.sampledLidRgb = [152, 118, 100];
      this.walkingRig = null;

      this.poseA = 'standing';
      this.poseB = 'standing';
      this.morphT = 1.0;
      this.morphDuration = 0.42;

      this.presetKey = 'naturale';
      this.intensity = 1.0;
      this.armSwingScale = 0.70;
      this.elbowBendScale = 1.00;
      this.facingDir = -1; // default in piedi a destra -> guarda verso sinistra (centro scena)
      this.stageX = 84;

      this.time = 0;
      this.blinkTimer = 2.6;
      this.blinkAmount = 0;
      this.doubleBlinkQueued = false;

      this.springs = {
        swayX:        new SpringValue(0, 48, 12),
        torsoRoll:    new SpringValue(0, 62, 14),
        torsoYaw:     new SpringValue(0, 56, 13),
        leanY:        new SpringValue(0, 82, 15),
        headRoll:     new SpringValue(0, 80, 15),
        headNod:      new SpringValue(0, 96, 16),
        headTurn:     new SpringValue(0, 72, 14),
        shoulderL:    new SpringValue(0, 105, 16),
        mouthOpen:    new SpringValue(0, 260, 22),
        mouthWidth:   new SpringValue(1.0, 220, 20),
        walkWeight:   new SpringValue(0, 72, 14),
        walkCycle:    0,
        gestureDip:   new SpringValue(0, 135, 16),
        speechEnergy: new SpringValue(0, 82, 14),
        facingScale:  new SpringValue(-1, 55, 13)
      };

      this.lighting = {
        brightness: 1.0,
        contrast: 1.0,
        tintR: 255, tintG: 245, tintB: 230, tintAlpha: 0.05
      };
    }

    setArmSwingScale(val) {
      const n = parseFloat(val);
      if (isFinite(n)) this.armSwingScale = Math.max(0.2, Math.min(2.0, n));
    }

    setElbowBendScale(val) {
      const n = parseFloat(val);
      if (isFinite(n)) this.elbowBendScale = Math.max(0.2, Math.min(2.0, n));
    }

    updateFacingFromStageX(xPercent) {
      if (!isFinite(xPercent)) return;
      this.stageX = xPercent;
      const newDir = xPercent < 50 ? 1 : -1;
      if (newDir !== this.facingDir) {
        this.facingDir = newDir;
        this.springs.facingScale.target = newDir;
      }
    }

    setPreset(key) {
      if (MOTION_PRESETS[key]) this.presetKey = key;
    }

    setLighting(cfg) {
      Object.assign(this.lighting, cfg);
    }

    triggerBlink(isDouble = false) {
      if (this.blinkTimer > 0.25) {
        this.blinkTimer = 0.0;
        this.doubleBlinkQueued = isDouble;
      }
    }

    loadPoseSource(poseKey, srcUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        if (/^https?:/i.test(srcUrl)) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          const entry = this._buildSkeletalLayers(poseKey, img);
          this.textures[poseKey] = entry;
          resolve(entry);
        };
        img.onerror = () => resolve(null);
        img.src = srcUrl;
      });
    }

    _buildSkeletalLayers(poseKey, img) {
      const cal = POSE_CALIBRATION[poseKey] || POSE_CALIBRATION.standing;

      // Normalizza l'asset nel canvas canonico 768x1376 mantenendo testa, collo e colletto 100% integri!
      const normCanvas = createOffscreen(BASE_W, BASE_H);
      const normCtx = normCanvas.getContext('2d');
      normCtx.drawImage(img, 0, 0, BASE_W, BASE_H);

      if (poseKey === 'standing') {
        try {
          const lEyeSample = normCtx.getImageData(353, 179, 6, 2).data;
          let sr = 0, sg = 0, sb = 0, sc = 0;
          for (let i = 0; i < lEyeSample.length; i += 4) {
            if (lEyeSample[i + 3] > 200) {
              sr += lEyeSample[i]; sg += lEyeSample[i + 1]; sb += lEyeSample[i + 2]; sc++;
            }
          }
          if (sc > 0) {
            this.sampledLidRgb = [Math.round(sr / sc), Math.round(sg / sc), Math.round(sb / sc)];
          }
        } catch (e) { /* keep fallback */ }
      }

      // Da arms_raised estrae pantaloni + scarpe 100% PULITI e privi di mani sui fianchi/cosce (escludendo i bordi giacca di arms_raised!)
      if (poseKey === 'arms_raised') {
        this.cleanTrousersLegs = bakeCroppedPart(normCanvas, 238, 748, 310, 625, (ctx) => {
          ctx.moveTo(266, 748);
          ctx.lineTo(514, 748);
          ctx.lineTo(524, 810);
          ctx.lineTo(548, 1373);
          ctx.lineTo(238, 1373);
          ctx.lineTo(256, 810);
        });
      }

      // Se è la posa walking, costruisce anche il rig articolato mantenendo comunque testa+collo uniti al busto
      if (poseKey === 'walking') {
        this._buildWalkingArmParts(normCanvas);
      }

      return { img, normCanvas, bodyCanvas: normCanvas, cal, poseKey, ready: true };
    }

    _buildWalkingArmParts(normCanvas) {
      const ctxNorm = normCanvas.getContext('2d');
      const j = RIG_JOINTS;

      const sampleJacketRgb = (x, y) => {
        try {
          const p = ctxNorm.getImageData(x, y, 5, 5).data;
          let r = 0, g = 0, b = 0, n = 0;
          for (let i = 0; i < p.length; i += 4) {
            if (p[i + 3] > 200) { r += p[i]; g += p[i + 1]; b += p[i + 2]; n++; }
          }
          if (n > 0) {
            return [Math.round(r / n * 0.76), Math.round(g / n * 0.76), Math.round(b / n * 0.76)];
          }
        } catch (e) { /* fallback */ }
        return [20, 32, 54];
      };
      const underLeftRgb = sampleJacketRgb(282, 410);
      const underRightRgb = sampleJacketRgb(488, 410);

      // A. Testa + Collo + Giacca in un UNICO blocco continuo da y=15 a y=756 (termina all'orlo giacca, ZERO mano/dita sui pantaloni!)
      const torsoCropped = bakeCroppedPart(normCanvas, 232, 15, 314, 745, (ctx) => {
        ctx.moveTo(232, 15);
        ctx.lineTo(546, 15);
        ctx.lineTo(546, 336);
        ctx.lineTo(532, 338);
        for (let i = 1; i < RIGHT_JACKET_SEAM.length; i++) {
          ctx.lineTo(RIGHT_JACKET_SEAM[i][0], RIGHT_JACKET_SEAM[i][1]);
        }
        ctx.lineTo(270, 756);
        for (let i = LEFT_JACKET_SEAM.length - 2; i >= 1; i--) {
          ctx.lineTo(LEFT_JACKET_SEAM[i][0], LEFT_JACKET_SEAM[i][1]);
        }
        ctx.lineTo(246, 338);
        ctx.lineTo(232, 336);
      });

      const tCtx = torsoCropped.canvas.getContext('2d');
      const tImg = tCtx.getImageData(0, 0, torsoCropped.w, torsoCropped.h);
      const td = tImg.data;
      for (let py = 0; py < torsoCropped.h; py++) {
        const gy = torsoCropped.oy + py;
        if (gy > 744) {
          const fade = 1.0 - smoothstep(744, 756, gy);
          for (let px = 0; px < torsoCropped.w; px++) {
            const idx = (py * torsoCropped.w + px) * 4;
            td[idx + 3] = Math.round(td[idx + 3] * fade);
          }
        }
      }
      tCtx.putImageData(tImg, 0, 0);

      tCtx.save();
      tCtx.globalCompositeOperation = 'destination-over';
      tCtx.fillStyle = `rgb(${underLeftRgb[0]},${underLeftRgb[1]},${underLeftRgb[2]})`;
      tCtx.beginPath();
      tCtx.roundRect(248 - torsoCropped.ox, 355 - torsoCropped.oy, 22, 118, 10);
      tCtx.fill();
      tCtx.fillStyle = `rgb(${underRightRgb[0]},${underRightRgb[1]},${underRightRgb[2]})`;
      tCtx.beginPath();
      tCtx.roundRect(502 - torsoCropped.ox, 355 - torsoCropped.oy, 22, 118, 10);
      tCtx.fill();
      tCtx.restore();

      // B. Braccio Sinistro Schermo (segue SOLO la manica a x<=250, poi si allarga a x<=272 sotto il polsino per il pollice!)
      const upperArmL = bakeCroppedPart(normCanvas, 175, 322, 110, 266, (ctx) => {
        ctx.moveTo(178, 336);
        ctx.quadraticCurveTo(216, 325, 246, 338);
        for (let i = 1; i < LEFT_SLEEVE_INNER.length; i++) {
          ctx.lineTo(LEFT_SLEEVE_INNER[i][0], LEFT_SLEEVE_INNER[i][1]);
        }
        ctx.arc(j.elbowL.x, j.elbowL.y, j.elbowL.r + 3, 0, Math.PI, false);
        ctx.lineTo(178, 545);
      });

      const forearmL = bakeCroppedPart(normCanvas, 175, 504, 108, 324, (ctx) => {
        ctx.arc(j.elbowL.x, j.elbowL.y, j.elbowL.r + 3, Math.PI, 0, false);
        ctx.lineTo(250, 545);
        ctx.lineTo(250, 695);
        ctx.lineTo(252, 725);
        ctx.lineTo(268, 745);
        ctx.lineTo(274, 775);
        ctx.lineTo(274, 825);
        ctx.lineTo(178, 825);
      });
      // Rimuove triangolino chiaro e micro-striscia di pantalone scuro adiacente al pollice sx in walking
      try {
        const fLCtx = forearmL.canvas.getContext('2d');
        const sx = 242 - forearmL.ox, sy = 735 - forearmL.oy, sw = 34, sh = 90;
        const fLImg = fLCtx.getImageData(sx, sy, sw, sh);
        for (let py = 0; py < sh; py++) {
          const gy = 735 + py;
          for (let px = 0; px < sw; px++) {
            const gx = 242 + px;
            const i = (py * sw + px) * 4;
            const r = fLImg.data[i], g = fLImg.data[i + 1], b = fLImg.data[i + 2];
            if (gy >= 770 && gy <= 798 && gx <= 260 && r > 205 && g > 205 && b > 195) {
              fLImg.data[i + 3] = 0;
            } else if (gx >= 256 && Math.max(r, g, b) < 92 && (r - b) < 18) {
              fLImg.data[i + 3] = 0;
            }
          }
        }
        fLCtx.putImageData(fLImg, sx, sy);
      } catch (e) { /* skip */ }

      // C. Braccio Destro Schermo (segue SOLO la manica a x>=517 fino al polsino, poi scende a x=494 sotto y=735!)
      const upperArmR = bakeCroppedPart(normCanvas, 490, 322, 112, 266, (ctx) => {
        ctx.moveTo(532, 338);
        ctx.quadraticCurveTo(562, 325, 596, 336);
        ctx.lineTo(596, 545);
        ctx.arc(j.elbowR.x, j.elbowR.y, j.elbowR.r + 3, 0, Math.PI, false);
        for (let i = RIGHT_SLEEVE_INNER.length - 1; i >= 1; i--) {
          ctx.lineTo(RIGHT_SLEEVE_INNER[i][0], RIGHT_SLEEVE_INNER[i][1]);
        }
      });

      const forearmR = bakeCroppedPart(normCanvas, 490, 504, 110, 324, (ctx) => {
        ctx.arc(j.elbowR.x, j.elbowR.y, j.elbowR.r + 3, Math.PI, 0, false);
        ctx.lineTo(596, 545);
        ctx.lineTo(596, 825);
        ctx.lineTo(494, 825);
        ctx.lineTo(494, 765);
        ctx.lineTo(504, 738);
        ctx.lineTo(516, 718);
        ctx.lineTo(518, 545);
      });
      // Rimuove micro-striscia di pantalone scuro adiacente al pollice dx in walking (preservando il polsino bianco/mano)
      try {
        const fRCtx = forearmR.canvas.getContext('2d');
        const sx = 493 - forearmR.ox, sy = 735 - forearmR.oy, sw = 24, sh = 90;
        const fRImg = fRCtx.getImageData(sx, sy, sw, sh);
        for (let i = 0; i < fRImg.data.length; i += 4) {
          const r = fRImg.data[i], g = fRImg.data[i + 1], b = fRImg.data[i + 2];
          if (Math.max(r, g, b) < 92 && (r - b) < 18) {
            fRImg.data[i + 3] = 0;
          }
        }
        fRCtx.putImageData(fRImg, sx, sy);
      } catch (e) { /* skip */ }

      // D. Gambe walking (per la posa walking)
      const legL = bakeCroppedPart(normCanvas, 265, 745, 128, 625, (ctx) => {
        ctx.rect(265, 745, 128, 625);
      });
      const legR = bakeCroppedPart(normCanvas, 386, 745, 120, 625, (ctx) => {
        ctx.rect(386, 745, 120, 625);
      });

      this.walkingRig = { torso: torsoCropped, upperArmL, forearmL, upperArmR, forearmR, legL, legR };
      // Registra automaticamente le pose umane articolate per interpolazione scheletrica continua (senza dissolvenze fantasma)
      ['welcome_open', 'explain_points', 'present_left', 'confident_close', 'neutral_poise'].forEach((artKey) => {
        this.textures[artKey] = {
          img: null,
          normCanvas: normCanvas,
          bodyCanvas: normCanvas,
          cal: POSE_CALIBRATION[artKey] || POSE_CALIBRATION.welcome_open,
          poseKey: artKey,
          isArticulatedPose: true,
          ready: true
        };
      });
    }

    getAvailableSpeechPoses() {
      return ['welcome_open', 'explain_points', 'present_left', 'confident_close', 'neutral_poise', 'gesturing', 'arms_raised'];
    }

    nextExpressivePose(stepHint) {
      // Alterna progressivamente soprattutto tra le pose articolate continue così le braccia si muovono senza stacchi
      const smoothList = ['welcome_open', 'explain_points', 'present_left', 'confident_close', 'welcome_open', 'explain_points', 'neutral_poise'];
      const targetList = (typeof stepHint === 'number' && stepHint >= 0) ? this.getAvailableSpeechPoses() : smoothList;
      if (typeof stepHint === 'number' && stepHint >= 0) {
        const chosen = targetList[stepHint % targetList.length];
        this.setPose(chosen, 1.35);
        return chosen;
      }
      this._poseCycleIdx = ((this._poseCycleIdx || 0) + 1) % targetList.length;
      if (targetList[this._poseCycleIdx] === this.poseB) {
        this._poseCycleIdx = (this._poseCycleIdx + 1) % targetList.length;
      }
      const nextP = targetList[this._poseCycleIdx];
      this.setPose(nextP, 1.35);
      return nextP;
    }

    setPose(poseKey, transitionSec = 1.25) {
      if (poseKey === this.poseB) return;
      if (this.morphT < 0.99 && this._lastInterpolatedProfile && ARTICULATED_POSE_PROFILES[this.poseA] && ARTICULATED_POSE_PROFILES[this.poseB]) {
        // Salva lo stato articolato esatto a metà corsa per ripartire senza scatti!
        this._frozenStartProfile = Object.assign({}, this._lastInterpolatedProfile);
      } else {
        this._frozenStartProfile = null;
      }
      if (this.morphT < 0.99) {
        this.poseA = this.morphT > 0.5 ? this.poseB : this.poseA;
      } else {
        this.poseA = this.poseB;
      }
      this.poseB = poseKey;
      this.morphT = 0.0;
      this.morphDuration = Math.max(0.28, transitionSec);

      this.springs.leanY.impulse(-1.1);
      if (Math.random() < 0.45) this.triggerBlink(false);
    }

    setBehavioralState(state) {
      const preset = MOTION_PRESETS[this.presetKey] || MOTION_PRESETS.naturale;
      const t = this.time;
      const isSpeaking = !!state.isSpeaking;
      const isWalking = !!state.isWalking;
      const energy = isSpeaking ? (state.speechEnergy ?? 0.65) : 0.0;

      this.springs.speechEnergy.target = energy;
      this.springs.walkWeight.target = isWalking ? 1.0 : 0.0;
      if (isFinite(state.walkPhase)) {
        this.springs.walkCycle = state.walkPhase;
      }

      const swayWave = Math.sin(t * 0.95) * 0.62 + Math.sin(t * 0.43 + 1.1) * 0.38;
      const talkEmphasis = Math.sin(t * 3.1) * 0.5 + Math.sin(t * 4.9) * 0.35;

      this.springs.swayX.target = swayWave * 0.42 * preset.swayAmp * this.intensity
        + (isWalking ? Math.sin(this.springs.walkCycle) * 0.38 : 0);

      this.springs.torsoRoll.target = (Math.sin(t * 0.82 + 0.4) * 0.22 + energy * talkEmphasis * 0.24)
        * preset.swayAmp * this.intensity;

      this.springs.leanY.target = (isWalking ? Math.abs(Math.sin(this.springs.walkCycle)) * 2.2 : 0)
        + energy * Math.max(0, Math.sin(t * 3.6)) * 0.65;

      this.springs.mouthOpen.target = isSpeaking ? Math.max(0, Math.min(1, state.mouthOpen || 0)) : 0;
      this.springs.mouthWidth.target = isSpeaking ? (state.mouthWidth || 1.0) : 1.0;
    }

    pulseAccent(strength = 1.0) {
      const preset = MOTION_PRESETS[this.presetKey] || MOTION_PRESETS.naturale;
      const g = preset.gestureAmp * this.intensity * strength;
      this.springs.leanY.impulse(0.8 * g);
    }

    update(dt) {
      const clampedDt = Math.min(dt, 0.05);
      this.time += clampedDt;

      if (this.morphT < 1.0) {
        this.morphT = Math.min(1.0, this.morphT + clampedDt / this.morphDuration);
        if (this.morphT >= 1.0) {
          this._frozenStartProfile = null;
        }
      }

      Object.values(this.springs).forEach(s => {
        if (s && typeof s.step === 'function') s.step(clampedDt);
      });

      this.blinkTimer -= clampedDt;
      if (this.blinkTimer <= 0) {
        const elapsed = -this.blinkTimer;
        if (elapsed < 0.065) {
          this.blinkAmount = elapsed / 0.065;
        } else if (elapsed < 0.095) {
          this.blinkAmount = 1.0;
        } else if (elapsed < 0.205) {
          this.blinkAmount = 1.0 - (elapsed - 0.095) / 0.110;
        } else {
          this.blinkAmount = 0;
          if (this.doubleBlinkQueued) {
            this.doubleBlinkQueued = false;
            this.blinkTimer = 0.12;
          } else {
            this.blinkTimer = 2.9 + Math.random() * 2.8;
            this.doubleBlinkQueued = Math.random() < 0.22;
          }
        }
      } else {
        this.blinkAmount = 0;
      }
    }

    /**
     * Disegna labiale e battito palpebre direttamente sopra il volto nativo integro della posa corrente
     * (nello stesso sistema di coordinate della posa, così anche se gesturing è specchiata coincide al pixel).
     */
    _drawPoseFacialOverlay(ctx, poseKey) {
      const lm = POSE_FACE_LANDMARKS[poseKey] || POSE_FACE_LANDMARKS.standing;
      const mOpen = this.springs.mouthOpen.value;
      const mWidth = this.springs.mouthWidth.value;

      if (mOpen > 0.06) {
        const mx = lm.mouth[0];
        const my = lm.mouth[1] + 0.5;
        const rx = 7.8 * mWidth;
        const ry = 0.6 + mOpen * 2.5;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(mx, my + 0.7, rx, ry, 0, 0, Math.PI * 2);
        ctx.clip();

        const grad = ctx.createRadialGradient(mx, my + 1.0, 0.8, mx, my + 0.7, rx);
        grad.addColorStop(0, `rgba(26, 8, 10, ${Math.min(0.65, mOpen * 0.70).toFixed(2)})`);
        grad.addColorStop(1, `rgba(62, 20, 22, ${Math.min(0.42, mOpen * 0.48).toFixed(2)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(mx - rx - 1, my - ry, rx * 2 + 2, ry * 2 + 2);

        if (mOpen > 0.48) {
          ctx.fillStyle = `rgba(155, 62, 72, ${Math.min(0.36, (mOpen - 0.48) * 0.68).toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(mx, my + ry * 0.85, rx * 0.44, ry * 0.34, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (this.blinkAmount > 0.02) {
        const lid = this.sampledLidRgb;
        const eyes = [
          { x: lm.eyeL[0], y: lm.eyeL[1] },
          { x: lm.eyeR[0], y: lm.eyeR[1] }
        ];
        eyes.forEach((eye) => {
          const rx = 10.2;
          const ry = 4.5;
          const sweepY = eye.y - ry + this.blinkAmount * (ry * 2.02);

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(eye.x, eye.y, rx, ry, 0, 0, Math.PI * 2);
          ctx.clip();

          ctx.globalAlpha = Math.min(0.95, 0.35 + this.blinkAmount * 0.60);
          ctx.fillStyle = `rgb(${lid[0]}, ${lid[1]}, ${lid[2]})`;
          ctx.fillRect(eye.x - rx - 2, eye.y - ry - 2, rx * 2 + 4, (sweepY - (eye.y - ry)) + 2);

          ctx.strokeStyle = 'rgba(42, 26, 20, 0.72)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(eye.x - rx, sweepY);
          ctx.quadraticCurveTo(eye.x, sweepY + 1.1, eye.x + rx, sweepY);
          ctx.stroke();
          ctx.restore();
        });
      }
    }

    _drawArticulatedRig(ctx, bodyAlpha, motion) {
      const rig = this.walkingRig;
      const walkEntry = this.textures.walking;
      if (!rig || !walkEntry || !walkEntry.ready || bodyAlpha <= 0.01) return;

      const j = RIG_JOINTS;
      const walkW = this.springs.walkWeight.value;
      const phi = this.springs.walkCycle;
      const speechE = this.springs.speechEnergy.value;
      const isSpeaking = speechE > 0.05;

      const armPhaseL = phi;
      const armPhaseR = phi + Math.PI;
      const sinL = Math.sin(armPhaseL);
      const sinR = Math.sin(armPhaseR);

      let shoulderRotL = 0, elbowRotL = 0, shDxL = 0, shDyL = 0, scaleL = 1.0;
      let shoulderRotR = 0, elbowRotR = 0, shDxR = 0, shDyR = 0, scaleR = 1.0;

      if (walkW > 0.01) {
        const fwdL = 0.5 + 0.5 * sinL;
        const fwdR = 0.5 + 0.5 * sinR;

        shoulderRotL = (-0.095 * sinL - 0.018) * this.armSwingScale * walkW;
        shDxL = sinL * 1.8 * this.armSwingScale * walkW;
        shDyL = -fwdL * 2.2 * this.armSwingScale * walkW;
        scaleL = 1.0 + 0.020 * sinL * this.armSwingScale * walkW;

        const bendWaveL = 0.5 + 0.5 * Math.sin(armPhaseL - 0.20);
        elbowRotL = -(0.10 + 0.28 * Math.pow(bendWaveL, 1.15)) * this.elbowBendScale * walkW;

        shoulderRotR = (+0.095 * sinR + 0.018) * this.armSwingScale * walkW;
        shDxR = -sinR * 1.8 * this.armSwingScale * walkW;
        shDyR = -fwdR * 2.2 * this.armSwingScale * walkW;
        scaleR = 1.0 + 0.020 * sinR * this.armSwingScale * walkW;

        const bendWaveR = 0.5 + 0.5 * Math.sin(armPhaseR - 0.20);
        elbowRotR = +(0.10 + 0.28 * Math.pow(bendWaveR, 1.15)) * this.elbowBendScale * walkW;
      }

      if (isSpeaking && walkW < 0.85) {
        const talkW = 1.0 - walkW;
        const microWave = Math.sin(this.time * 2.4);
        shoulderRotL += (-0.025 + microWave * 0.015) * this.armSwingScale * talkW;
        elbowRotL += -(0.08 + speechE * 0.22) * this.elbowBendScale * talkW;
        shoulderRotR += (0.020 + microWave * 0.015) * this.armSwingScale * talkW;
        elbowRotR += +(0.06 + speechE * 0.18) * this.elbowBendScale * talkW;
      }

      const drawArmChain = (upperPart, forearmPart, shoulder, elbow, shRot, elRot, shDx, shDy, armScale, isFront) => {
        ctx.save();
        if (isFront) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = shoulder.x < 386 ? 4 : -4;
          ctx.shadowOffsetY = 5;
        }
        ctx.translate(shoulder.x + shDx, shoulder.y + shDy);
        ctx.rotate(shRot);
        ctx.scale(armScale, armScale);
        ctx.translate(-shoulder.x, -shoulder.y);
        ctx.drawImage(upperPart.canvas, upperPart.ox, upperPart.oy);

        ctx.translate(elbow.x, elbow.y);
        ctx.rotate(elRot);
        ctx.translate(-elbow.x, -elbow.y);
        ctx.drawImage(forearmPart.canvas, forearmPart.ox, forearmPart.oy);
        ctx.restore();
      };

      ctx.save();
      ctx.globalAlpha = bodyAlpha;

      const legRotL = Math.sin(phi + Math.PI) * 0.042 * walkW;
      const legLiftL = -Math.max(0, Math.sin(phi + Math.PI)) * 5.0 * walkW;
      const legRotR = Math.sin(phi) * 0.042 * walkW;
      const legLiftR = -Math.max(0, Math.sin(phi)) * 5.0 * walkW;

      ctx.save();
      ctx.translate(j.hipL.x, j.hipL.y + legLiftL);
      ctx.rotate(legRotL);
      ctx.translate(-j.hipL.x, -j.hipL.y);
      ctx.drawImage(rig.legL.canvas, rig.legL.ox, rig.legL.oy);
      ctx.restore();

      ctx.save();
      ctx.translate(j.hipR.x, j.hipR.y + legLiftR);
      ctx.rotate(legRotR);
      ctx.translate(-j.hipR.x, -j.hipR.y);
      ctx.drawImage(rig.legR.canvas, rig.legR.ox, rig.legR.oy);
      ctx.restore();

      ctx.translate(j.torsoHip.x + motion.swayPx, j.torsoHip.y + motion.leanPx);
      ctx.rotate(motion.torsoRot);
      ctx.translate(-j.torsoHip.x, -j.torsoHip.y);

      const leftInFront = sinL >= 0;
      const rightInFront = sinR >= 0;

      if (!leftInFront) {
        drawArmChain(rig.upperArmL, rig.forearmL, j.shoulderL, j.elbowL, shoulderRotL, elbowRotL, shDxL, shDyL, scaleL, false);
      }
      if (!rightInFront) {
        drawArmChain(rig.upperArmR, rig.forearmR, j.shoulderR, j.elbowR, shoulderRotR, elbowRotR, shDxR, shDyR, scaleR, false);
      }

      // Testa + Collo + Torso interi senza giunture
      ctx.drawImage(rig.torso.canvas, rig.torso.ox, rig.torso.oy);
      this._drawPoseFacialOverlay(ctx, 'walking');

      if (leftInFront) {
        drawArmChain(rig.upperArmL, rig.forearmL, j.shoulderL, j.elbowL, shoulderRotL, elbowRotL, shDxL, shDyL, scaleL, true);
      }
      if (rightInFront) {
        drawArmChain(rig.upperArmR, rig.forearmR, j.shoulderR, j.elbowR, shoulderRotR, elbowRotR, shDxR, shDyR, scaleR, true);
      }

      ctx.restore();
    }

    /**
     * Interpola progressivamente due profili articolati come veri muscoli e articolazioni in movimento continuo.
     */
    _blendArticulatedProfiles(profA, profB, alpha) {
      const lerp = (a, b, t) => a + (b - a) * t;
      const out = {
        shRotL:       lerp(profA.shRotL, profB.shRotL, alpha),
        elRotL:       lerp(profA.elRotL, profB.elRotL, alpha),
        shDxL:        lerp(profA.shDxL, profB.shDxL, alpha),
        shDyL:        lerp(profA.shDyL, profB.shDyL, alpha),
        shRotR:       lerp(profA.shRotR, profB.shRotR, alpha),
        elRotR:       lerp(profA.elRotR, profB.elRotR, alpha),
        shDxR:        lerp(profA.shDxR, profB.shDxR, alpha),
        shDyR:        lerp(profA.shDyR, profB.shDyR, alpha),
        torsoRotBias: lerp(profA.torsoRotBias, profB.torsoRotBias, alpha),
        leanBias:     lerp(profA.leanBias, profB.leanBias, alpha),
        swayBias:     lerp(profA.swayBias, profB.swayBias, alpha),
        cadenceAmpL:  lerp(profA.cadenceAmpL, profB.cadenceAmpL, alpha),
        cadenceAmpR:  lerp(profA.cadenceAmpR, profB.cadenceAmpR, alpha),
        hipShift:     lerp(profA.hipShift, profB.hipShift, alpha),
        leftFront:    true,
        rightFront:   true
      };
      this._lastInterpolatedProfile = out;
      return out;
    }

    /**
     * Disegna una posa umana coordinata (singola o interpolata progressivamente) con movimento naturale fluido
     */
    _drawCoordinatedHumanPose(ctx, poseOrProfile, bodyAlpha, motion) {
      const rig = this.walkingRig;
      const prof = (typeof poseOrProfile === 'string') ? ARTICULATED_POSE_PROFILES[poseOrProfile] : poseOrProfile;
      if (!rig || !prof || bodyAlpha <= 0.01) return;

      const j = RIG_JOINTS;
      const t = this.time;
      const speechE = this.springs.speechEnergy.value;
      const liveFactor = 0.35 + speechE * 0.85;

      // Onde secondarie sfasate (il gomito segue la spalla con un lieve ritardo naturale di ~0.35 rad)
      const wavePrimary = Math.sin(t * 2.65) * 0.65 + Math.sin(t * 4.1 + 0.8) * 0.35;
      const waveFollowL = Math.sin(t * 2.65 - 0.38) * 0.70 + Math.sin(t * 1.35) * 0.30;
      const waveFollowR = Math.sin(t * 2.35 - 0.55) * 0.65 + Math.cos(t * 1.55) * 0.35;
      const weightWave = Math.sin(t * 0.78 + 0.5);

      const flipX = (this.stageX >= 50) ? 1 : -1;
      const shRotL = prof.shRotL + wavePrimary * prof.cadenceAmpL * 0.48 * liveFactor;
      const elRotL = prof.elRotL + waveFollowL * prof.cadenceAmpL * 1.15 * liveFactor;
      const shRotR = prof.shRotR - waveFollowR * prof.cadenceAmpR * 0.45 * liveFactor;
      const elRotR = prof.elRotR + waveFollowR * prof.cadenceAmpR * 1.05 * liveFactor;

      const shDxL = prof.shDxL + wavePrimary * 1.4 * liveFactor;
      const shDyL = prof.shDyL - Math.abs(wavePrimary) * 1.8 * liveFactor;
      const shDxR = prof.shDxR - waveFollowR * 1.1 * liveFactor;
      const shDyR = prof.shDyR - Math.abs(waveFollowR) * 1.2 * liveFactor;

      const drawArmChain = (upperPart, forearmPart, shoulder, elbow, sRot, eRot, dx, dy, isFront) => {
        ctx.save();
        if (isFront) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.26)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = shoulder.x < 386 ? 3 : -3;
          ctx.shadowOffsetY = 5;
        }
        ctx.translate(shoulder.x + dx, shoulder.y + dy);
        ctx.rotate(sRot);
        ctx.translate(-shoulder.x, -shoulder.y);
        ctx.drawImage(upperPart.canvas, upperPart.ox, upperPart.oy);

        ctx.translate(elbow.x, elbow.y);
        ctx.rotate(eRot);
        ctx.translate(-elbow.x, -elbow.y);
        ctx.drawImage(forearmPart.canvas, forearmPart.ox, forearmPart.oy);
        ctx.restore();
      };

      ctx.save();
      ctx.globalAlpha = bodyAlpha;

      if (flipX < 0) {
        ctx.translate(j.torsoHip.x, j.torsoHip.y);
        ctx.scale(-1, 1);
        ctx.translate(-j.torsoHip.x, -j.torsoHip.y);
      }

      // Pantaloni e scarpe 100% PULITI estratti da arms_raised (zero mani sovrapposte alle cosce!)
      const hipTilt = prof.hipShift * (0.55 + 0.45 * weightWave);
      if (this.cleanTrousersLegs) {
        const calA = POSE_CALIBRATION.arms_raised;
        ctx.save();
        ctx.translate(j.torsoHip.x + calA.dx, j.torsoHip.y + calA.dy);
        ctx.rotate(hipTilt * 0.14);
        ctx.scale(calA.scale, calA.scale);
        ctx.translate(-j.torsoHip.x, -j.torsoHip.y);
        ctx.drawImage(this.cleanTrousersLegs.canvas, this.cleanTrousersLegs.ox, this.cleanTrousersLegs.oy);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(j.hipL.x, j.hipL.y);
        ctx.rotate(-hipTilt * 0.35);
        ctx.translate(-j.hipL.x, -j.hipL.y);
        ctx.drawImage(rig.legL.canvas, rig.legL.ox, rig.legL.oy);
        ctx.restore();

        ctx.save();
        ctx.translate(j.hipR.x, j.hipR.y);
        ctx.rotate(hipTilt * 0.35);
        ctx.translate(-j.hipR.x, -j.hipR.y);
        ctx.drawImage(rig.legR.canvas, rig.legR.ox, rig.legR.oy);
        ctx.restore();
      }

      // Coordinazione busto + testa + colletto continui
      const totSway = motion.swayPx + prof.swayBias + weightWave * 2.1;
      const totLean = motion.leanPx + prof.leanBias;
      const totRot = motion.torsoRot + prof.torsoRotBias + wavePrimary * 0.006 * liveFactor;

      ctx.translate(j.torsoHip.x + totSway, j.torsoHip.y + totLean);
      ctx.rotate(totRot);
      ctx.translate(-j.torsoHip.x, -j.torsoHip.y);

      if (!prof.leftFront) {
        drawArmChain(rig.upperArmL, rig.forearmL, j.shoulderL, j.elbowL, shRotL, elRotL, shDxL, shDyL, false);
      }
      if (!prof.rightFront) {
        drawArmChain(rig.upperArmR, rig.forearmR, j.shoulderR, j.elbowR, shRotR, elRotR, shDxR, shDyR, false);
      }

      ctx.drawImage(rig.torso.canvas, rig.torso.ox, rig.torso.oy);
      this._drawPoseFacialOverlay(ctx, 'walking');

      if (prof.leftFront) {
        drawArmChain(rig.upperArmL, rig.forearmL, j.shoulderL, j.elbowL, shRotL, elRotL, shDxL, shDyL, true);
      }
      if (prof.rightFront) {
        drawArmChain(rig.upperArmR, rig.forearmR, j.shoulderR, j.elbowR, shRotR, elRotR, shDxR, shDyR, true);
      }

      ctx.restore();
    }

    /** Disegna una posa intera (standing, arms_raised, gesturing) con collo 100% integro */
    _drawRigidBodyPose(ctx, entry, alpha, motion) {
      if (!entry || !entry.ready || alpha <= 0.01) return;
      const cal = entry.cal;
      const pivotX = RIG_JOINTS.torsoHip.x;
      const pivotY = RIG_JOINTS.torsoHip.y;
      const flipX = (this.stageX >= 50) ? (cal.flipOnRight || 1) : (cal.flipOnLeft || 1);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pivotX + motion.swayPx + cal.dx * flipX, pivotY + motion.leanPx + cal.dy);
      ctx.rotate(motion.torsoRot);
      ctx.scale(cal.scale * flipX, cal.scale);
      ctx.translate(-pivotX, -pivotY);
      ctx.drawImage(entry.bodyCanvas, 0, 0);
      this._drawPoseFacialOverlay(ctx, entry.poseKey || 'standing');
      ctx.restore();
    }

    render() {
      const ctx = this.ctx2d;
      const compCtx = this.compCtx;
      if (!ctx || !compCtx) return;

      const entryA = this.textures[this.poseA];
      const entryB = this.textures[this.poseB];
      if (!entryB || !entryB.ready) return;
      const effectiveA = (entryA && entryA.ready) ? entryA : entryB;

      const morphSmooth = 0.5 - 0.5 * Math.cos(Math.PI * this.morphT);
      const preset = MOTION_PRESETS[this.presetKey] || MOTION_PRESETS.naturale;
      const breathRate = this.springs.speechEnergy.value > 0.15 ? 1.85 : 1.45;
      const breathVal = organicBreathWave(this.time * breathRate) * preset.breathAmp * this.intensity;

      const motion = {
        swayPx: this.springs.swayX.value * 3.8,
        leanPx: this.springs.leanY.value * 1.8 - breathVal * 0.9,
        torsoRot: this.springs.torsoRoll.value * 0.014
      };

      compCtx.clearRect(0, 0, BASE_W, BASE_H);

      const isActivelyWalking = this.springs.walkWeight.value > 0.05;

      const drawBodyPose = (poseKey, entry, alpha) => {
        if (alpha <= 0.01) return;
        if (poseKey === 'walking' && isActivelyWalking && this.walkingRig) {
          this._drawArticulatedRig(compCtx, alpha, motion);
        } else if (entry && entry.isArticulatedPose && this.walkingRig) {
          this._drawCoordinatedHumanPose(compCtx, poseKey, alpha, motion);
        } else {
          this._drawRigidBodyPose(compCtx, entry, alpha, motion);
        }
      };

      // Quando entrambe le pose sono articolate, esegui interpolazione scheletrica PROGRESSIVA su un corpo solo (zero ombre doppie!)
      const profA = this._frozenStartProfile || ARTICULATED_POSE_PROFILES[this.poseA];
      const profB = ARTICULATED_POSE_PROFILES[this.poseB];
      if (this.walkingRig && !isActivelyWalking && profA && profB) {
        const blendedProf = this._blendArticulatedProfiles(profA, profB, morphSmooth);
        this._drawCoordinatedHumanPose(compCtx, blendedProf, 1.0, motion);
      } else {
        if (morphSmooth < 0.99 && this.poseA !== this.poseB && effectiveA !== entryB) {
          drawBodyPose(this.poseA, effectiveA, 1.0 - morphSmooth);
        }
        drawBodyPose(this.poseB, entryB, morphSmooth);
      }

      if (this.lighting.tintAlpha > 0.005) {
        compCtx.save();
        compCtx.globalCompositeOperation = 'source-atop';
        compCtx.globalAlpha = Math.min(0.25, this.lighting.tintAlpha);
        compCtx.fillStyle = `rgb(${this.lighting.tintR},${this.lighting.tintG},${this.lighting.tintB})`;
        compCtx.fillRect(0, 0, BASE_W, BASE_H);
        compCtx.restore();
      }

      ctx.clearRect(0, 0, this.width, this.height);
      ctx.save();
      const b = (this.lighting.brightness || 1.0).toFixed(2);
      const c = (this.lighting.contrast || 1.0).toFixed(2);
      if ('filter' in ctx) {
        ctx.filter = `brightness(${b}) contrast(${c})`;
      }
      ctx.drawImage(this.compCanvas, 0, 0, BASE_W, BASE_H, 0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  global.AntonioFluidRenderer = AntonioFluidRenderer;
  global.ANTONIO_CANONICAL_LANDMARKS = CANONICAL_LANDMARKS;
  global.ANTONIO_POSE_CALIBRATION = POSE_CALIBRATION;
  global.ANTONIO_MOTION_PRESETS = MOTION_PRESETS;
})(window);

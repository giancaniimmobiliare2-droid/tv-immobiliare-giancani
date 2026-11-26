/**
 * AntonioFluidEngine — Motore Scheletrico Rigido 3D (60 FPS, Zero Effetto Onda)
 * Renderizzazione gerarchica multi-osso Canvas 2D in spazio pixel canonico 768x1376:
 * - Volto canonico rigido al 100% (nessuna deformazione mesh, zero sdoppiamenti o allungamenti)
 * - Zero effetto onda (eliminati shader mesh sinusoidali e slicing a strisce orizzontali)
 * - Braccia articolate a 2 ossa (Spalla -> Braccio -> Gomito -> Avambraccio/Mano) con
 *   giunti circolari continui per dondolio naturale e piegamento gomiti in camminata
 * - Labiale fotografico e battito ciliare ancorati al volto rigido
 *
 * — Immobiliare Giancani
 */
(function(global) {
  'use strict';

  const BASE_W = 768;
  const BASE_H = 1376;

  /**
   * Landmark anatomici canonici su asset 768x1376 (spazio testa canonica = standing).
   */
  const CANONICAL_LANDMARKS = {
    eyeL: [358 / BASE_W, 184 / BASE_H],
    eyeR: [405 / BASE_W, 184 / BASE_H],
    mouth: [380 / BASE_W, 238 / BASE_H],
    neck: [386 / BASE_W, 274 / BASE_H],
    footY: 0.968,
    lidColor: [152 / 255, 118 / 255, 100 / 255],
    creaseColor: [0.28, 0.17, 0.12]
  };

  /**
   * Calibrazione corpo-colletto per mantenere sempre identico e fisso il volto canonico.
   */
  const POSE_CALIBRATION = {
    standing:    { dx: 0,  dy: 0,  scale: 1.000, eraseY0: 266, eraseY1: 280, cx: 386 },
    walking:     { dx: 1,  dy: -4, scale: 1.000, eraseY0: 270, eraseY1: 284, cx: 386 },
    arms_raised: { dx: 0,  dy: -4, scale: 1.000, eraseY0: 270, eraseY1: 284, cx: 386 },
    gesturing:   { dx: 34, dy: 20, scale: 0.995, eraseY0: 248, eraseY1: 262, cx: 352 }
  };

  const MOTION_PRESETS = {
    naturale: { label: 'Naturale Televisivo', swayAmp: 1.0,  gestureAmp: 1.0,  breathAmp: 1.0,  headAmp: 1.0  },
    dinamico: { label: 'Espressivo Dinamico', swayAmp: 1.30, gestureAmp: 1.35, breathAmp: 1.15, headAmp: 1.25 },
    sobrio:   { label: 'Istituzionale Sobrio', swayAmp: 0.55, gestureAmp: 0.60, breathAmp: 0.85, headAmp: 0.55 }
  };

  /** Configurazione scheletrica 2-ossa su posa walking (768x1376) */
  const RIG_JOINTS = {
    neck:      { x: 386, y: 274 },
    torsoHip:  { x: 386, y: 810 },
    shoulderL: { x: 244, y: 365, r: 30 },
    elbowL:    { x: 231, y: 545, r: 32 },
    shoulderR: { x: 528, y: 365, r: 30 },
    elbowR:    { x: 544, y: 545, r: 33 },
    hipL:      { x: 328, y: 790 },
    hipR:      { x: 444, y: 790 }
  };

  const LEFT_ARM_SEAM = [
    [246, 338], [250, 355], [255, 385], [261, 415], [267, 445],
    [271, 475], [270, 515], [265, 545], [265, 825]
  ];

  const RIGHT_ARM_SEAM = [
    [532, 338], [526, 355], [513, 385], [508, 415], [505, 445],
    [503, 475], [500, 515], [508, 545], [508, 825]
  ];

  /** Molla smorzata del 2° ordine per transizioni continue senza scatti */
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

  /** Estrae una porzione ritagliata dal canvas sorgente dopo aver applicato una clipPath */
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

      // Inizializza Canvas 2D direttamente (niente WebGL mesh wave shader)
      this.useWebGL = false;
      this.gl = null;
      this.program = null;
      this.ctx2d = this.canvas.getContext('2d');

      this.compCanvas = createOffscreen(BASE_W, BASE_H);
      this.compCtx = this.compCanvas.getContext('2d');

      this.textures = {};
      this.canonicalHead = null;
      this.sampledLidRgb = [152, 118, 100];
      this.walkingRig = null;

      this.poseA = 'standing';
      this.poseB = 'standing';
      this.morphT = 1.0;
      this.morphDuration = 0.34;

      this.presetKey = 'naturale';
      this.intensity = 1.0;
      this.armSwingScale = 0.70;
      this.elbowBendScale = 1.00;
      this.facingDir = 1; // +1 = guarda/indica a destra, -1 = guarda/indica a sinistra
      this.stageX = 48;

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
        facingScale:  new SpringValue(1, 55, 13)
      };

      this.lighting = {
        brightness: 1.0,
        contrast: 1.0,
        tintR: 255, tintG: 245, tintB: 230, tintAlpha: 0.08
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

    /** Si volta sempre verso il lato dell'inquadratura con più spazio libero */
    updateFacingFromStageX(xPercent) {
      if (!isFinite(xPercent)) return;
      this.stageX = xPercent;
      const newDir = xPercent < 50 ? 1 : -1;
      if (newDir !== this.facingDir) {
        this.facingDir = newDir;
        this.springs.facingScale.target = newDir;
        this.springs.headTurn.impulse(newDir * 0.45);
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

      // Normalizza sempre l'asset nel canvas canonico 768x1376
      const normCanvas = createOffscreen(BASE_W, BASE_H);
      const normCtx = normCanvas.getContext('2d');
      normCtx.drawImage(img, 0, 0, BASE_W, BASE_H);

      // 1. Estrai la Testa Canonica Rigida (da standing, o temporaneamente da walking se standing non ancora pronto)
      if (poseKey === 'standing' || (!this.canonicalHead && poseKey === 'walking')) {
        const ox = 270, oy = 30, w = 230, h = 260;
        const headCanvas = createOffscreen(w, h);
        const hCtx = headCanvas.getContext('2d');
        hCtx.drawImage(normCanvas, ox, oy, w, h, 0, 0, w, h);

        const imgData = hCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Campiona tono palpebra superiore reale direttamente dalla foto di Antonio
        try {
          const lEyeSample = normCtx.getImageData(355, 179, 6, 2).data;
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

        // Sfumatura pulita lungo mento/collo escludendo le punte bianche del colletto ai lati
        for (let py = 0; py < h; py++) {
          const gy = oy + py;
          if (gy < 256) continue;
          for (let px = 0; px < w; px++) {
            const gx = ox + px;
            const idx = (py * w + px) * 4;
            if (d[idx + 3] === 0) continue;

            const distCenter = Math.abs(gx - 386);
            // Al centro (mento/collo) sfuma tra y=268 e y=282; ai lati (colletto) taglia sopra y=260..267
            const yCutStart = distCenter > 32 ? 258 : 268;
            const yCutEnd = distCenter > 32 ? 267 : 282;
            if (gy >= yCutEnd) {
              d[idx + 3] = 0;
            } else if (gy > yCutStart) {
              const fade = 1.0 - smoothstep(yCutStart, yCutEnd, gy);
              d[idx + 3] = Math.round(d[idx + 3] * fade);
            }
          }
        }
        hCtx.putImageData(imgData, 0, 0);
        this.canonicalHead = { canvas: headCanvas, ox, oy, w, h, sourcePose: poseKey };
      }

      // 2. Crea il corpo headless della posa (cancella la testa originale sopra la linea collo locale)
      const bodyCanvas = createOffscreen(BASE_W, BASE_H);
      const bCtx = bodyCanvas.getContext('2d');
      bCtx.drawImage(normCanvas, 0, 0);
      const bodyData = bCtx.getImageData(0, 0, BASE_W, BASE_H);
      const bd = bodyData.data;
      const cxMin = Math.max(0, cal.cx - 105);
      const cxMax = Math.min(BASE_W - 1, cal.cx + 105);
      for (let y = 0; y <= cal.eraseY1; y++) {
        const keepFactor = y < cal.eraseY0 ? 0.0 : smoothstep(cal.eraseY0, cal.eraseY1, y);
        for (let x = cxMin; x <= cxMax; x++) {
          const idx = (y * BASE_W + x) * 4;
          if (bd[idx + 3] > 0) {
            bd[idx + 3] = Math.round(bd[idx + 3] * keepFactor);
          }
        }
      }
      bCtx.putImageData(bodyData, 0, 0);

      // 3. Se è la posa walking, segmenta lo scheletro articolato 2-ossa (Braccia + Gomiti + Torso + Gambe)
      if (poseKey === 'walking') {
        this._buildWalkingArmParts(normCanvas, bodyCanvas);
      }

      return { img, normCanvas, bodyCanvas, cal, ready: true };
    }

    _buildWalkingArmParts(normCanvas, headlessBodyCanvas) {
      const ctxNorm = normCanvas.getContext('2d');
      const j = RIG_JOINTS;

      // Campiona dinamicamente il colore della giacca vicino alle ascelle per i tasselli di continuità (tutti i 7 abiti)
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

      // A. Torso isolato tra le due cuciture delle maniche (y = 266..805)
      const torsoCropped = bakeCroppedPart(headlessBodyCanvas, 232, 260, 314, 550, (ctx) => {
        ctx.moveTo(246, 264);
        ctx.lineTo(532, 264);
        for (let i = 0; i < RIGHT_ARM_SEAM.length; i++) {
          ctx.lineTo(RIGHT_ARM_SEAM[i][0], Math.min(805, RIGHT_ARM_SEAM[i][1]));
        }
        ctx.lineTo(508, 805);
        ctx.lineTo(265, 805);
        for (let i = LEFT_ARM_SEAM.length - 1; i >= 0; i--) {
          ctx.lineTo(LEFT_ARM_SEAM[i][0], Math.min(805, LEFT_ARM_SEAM[i][1]));
        }
      });

      // Sfuma delicatamente il bordo inferiore del torso (y=790..805) e aggiungi tasselli ascelle dietro il torso
      const tCtx = torsoCropped.canvas.getContext('2d');
      const tImg = tCtx.getImageData(0, 0, torsoCropped.w, torsoCropped.h);
      const td = tImg.data;
      for (let py = 0; py < torsoCropped.h; py++) {
        const gy = torsoCropped.oy + py;
        if (gy > 790) {
          const fade = 1.0 - smoothstep(790, 805, gy);
          for (let px = 0; px < torsoCropped.w; px++) {
            const idx = (py * torsoCropped.w + px) * 4;
            td[idx + 3] = Math.round(td[idx + 3] * fade);
          }
        }
      }
      tCtx.putImageData(tImg, 0, 0);

      // Tasselli sotto-ascella dietro la cucitura per evitare spiragli quando il braccio oscilla avanti/indietro
      tCtx.save();
      tCtx.globalCompositeOperation = 'destination-over';
      tCtx.fillStyle = `rgb(${underLeftRgb[0]},${underLeftRgb[1]},${underLeftRgb[2]})`;
      tCtx.beginPath();
      tCtx.roundRect(238 - torsoCropped.ox, 355 - torsoCropped.oy, 36, 145, 14);
      tCtx.fill();
      tCtx.fillStyle = `rgb(${underRightRgb[0]},${underRightRgb[1]},${underRightRgb[2]})`;
      tCtx.beginPath();
      tCtx.roundRect(498 - torsoCropped.ox, 355 - torsoCropped.oy, 36, 145, 14);
      tCtx.fill();
      tCtx.restore();

      // B. Braccio Sinistro Schermo (Braccio Destro di Antonio) - 2 Ossa con cappuccio circolare al gomito
      const upperArmL = bakeCroppedPart(headlessBodyCanvas, 175, 322, 112, 264, (ctx) => {
        ctx.moveTo(178, 336);
        ctx.quadraticCurveTo(216, 325, 246, 338);
        for (let i = 1; i <= 7; i++) {
          ctx.lineTo(LEFT_ARM_SEAM[i][0], LEFT_ARM_SEAM[i][1]);
        }
        ctx.arc(j.elbowL.x, j.elbowL.y, j.elbowL.r, 0, Math.PI, false);
        ctx.lineTo(178, 545);
      });

      const forearmL = bakeCroppedPart(headlessBodyCanvas, 175, 506, 108, 322, (ctx) => {
        ctx.arc(j.elbowL.x, j.elbowL.y, j.elbowL.r, Math.PI, 0, false);
        ctx.lineTo(265, 545);
        ctx.lineTo(265, 825);
        ctx.lineTo(178, 825);
      });

      // C. Braccio Destro Schermo (Braccio Sinistro di Antonio) - 2 Ossa con cappuccio circolare al gomito
      const upperArmR = bakeCroppedPart(headlessBodyCanvas, 492, 322, 108, 264, (ctx) => {
        ctx.moveTo(532, 338);
        ctx.quadraticCurveTo(562, 325, 596, 336);
        ctx.lineTo(596, 545);
        ctx.arc(j.elbowR.x, j.elbowR.y, j.elbowR.r, 0, Math.PI, false);
        for (let i = 7; i >= 1; i--) {
          ctx.lineTo(RIGHT_ARM_SEAM[i][0], RIGHT_ARM_SEAM[i][1]);
        }
      });

      const forearmR = bakeCroppedPart(headlessBodyCanvas, 498, 506, 102, 322, (ctx) => {
        ctx.arc(j.elbowR.x, j.elbowR.y, j.elbowR.r, Math.PI, 0, false);
        ctx.lineTo(596, 545);
        ctx.lineTo(596, 825);
        ctx.lineTo(508, 825);
        ctx.lineTo(508, 545);
      });

      // D. Gambe isolate sotto la giacca (y = 772..1345)
      const legL = bakeCroppedPart(headlessBodyCanvas, 255, 772, 134, 575, (ctx) => {
        ctx.rect(256, 774, 131, 570);
      });
      const legR = bakeCroppedPart(headlessBodyCanvas, 384, 772, 136, 575, (ctx) => {
        ctx.rect(386, 774, 132, 570);
      });

      this.walkingRig = {
        torso: torsoCropped,
        upperArmL,
        forearmL,
        upperArmR,
        forearmR,
        legL,
        legR
      };
    }

    setPose(targetPose, impulseStrength = 1.0) {
      if (!POSE_CALIBRATION[targetPose] || targetPose === this.poseB) return;
      this.poseA = this.poseB;
      this.poseB = targetPose;
      this.morphT = 0.0;

      this.springs.gestureDip.impulse(0.45 * impulseStrength);
      this.springs.shoulderL.impulse(-0.40 * impulseStrength);
      if (targetPose === 'gesturing') {
        this.springs.torsoYaw.target = -0.25;
        this.springs.headTurn.target = -0.22;
        this.springs.torsoRoll.impulse(-0.18 * impulseStrength);
      } else if (targetPose === 'arms_raised') {
        this.springs.torsoYaw.target = 0.0;
        this.springs.headTurn.target = 0.0;
        this.springs.torsoRoll.impulse(0.12 * impulseStrength);
        this.springs.headNod.impulse(-0.35);
      } else {
        this.springs.torsoYaw.target = 0.0;
        this.springs.headTurn.target = 0.0;
        this.springs.torsoRoll.impulse(0.08 * impulseStrength);
      }
      if (this.blinkAmount < 0.05 && Math.random() < 0.55) {
        this.triggerBlink(false);
      }
    }

    setBehavioralState({ isSpeaking = false, speechEnergy = 0, mouthOpen = 0, mouthWidth = 1.0, isWalking = false, walkPhase = 0 }) {
      const preset = MOTION_PRESETS[this.presetKey] || MOTION_PRESETS.naturale;
      const amp = this.intensity;

      this.springs.speechEnergy.target = isSpeaking ? Math.max(0.25, speechEnergy) : 0;
      this.springs.mouthOpen.target = isSpeaking ? mouthOpen : 0;
      this.springs.mouthWidth.target = isSpeaking ? mouthWidth : 1.0;
      this.springs.walkWeight.target = isWalking ? 1.0 : 0.0;
      if (isWalking) this.springs.walkCycle = walkPhase;

      const t = this.time;
      if (isWalking) {
        this.springs.swayX.target = Math.sin(walkPhase) * 0.14 * amp;
        this.springs.torsoRoll.target = -Math.sin(walkPhase) * 0.06 * amp;
        this.springs.headRoll.target = Math.sin(walkPhase) * 0.04 * amp;
        this.springs.headNod.target = 0.04;
        this.springs.leanY.target = 0.10;
      } else if (isSpeaking) {
        const g = preset.gestureAmp * amp;
        const h = preset.headAmp * amp;
        const leanDesc = this.poseB === 'gesturing' ? 0.35 : 0.18;
        this.springs.swayX.target = (Math.sin(t * 0.85) * 0.34 + Math.sin(t * 0.41) * 0.22 + this.facingDir * 0.14) * preset.swayAmp * amp;
        this.springs.torsoRoll.target = (Math.sin(t * 1.15) * 0.26 + Math.cos(t * 0.55) * 0.16 + this.facingDir * 0.12) * g;
        this.springs.leanY.target = leanDesc + speechEnergy * 0.38 * g;
        this.springs.headRoll.target = (Math.sin(t * 1.35 + 0.7) * 0.38 + Math.sin(t * 0.62) * 0.24) * h;
        this.springs.headNod.target = (Math.sin(t * 2.6) * 0.22 + 0.14) * speechEnergy * h;
        this.springs.headTurn.target = this.facingDir * 0.24 * h;
        this.springs.shoulderL.target = speechEnergy * 0.28 * g;
      } else {
        this.springs.swayX.target = (Math.sin(t * 0.55) * 0.28 + Math.sin(t * 0.23) * 0.16) * preset.swayAmp * amp;
        this.springs.torsoRoll.target = (Math.sin(t * 0.48 + 0.4) * 0.16 + Math.cos(t * 0.27) * 0.08) * preset.swayAmp * amp;
        this.springs.leanY.target = Math.sin(t * 0.35) * 0.06;
        this.springs.headRoll.target = (Math.sin(t * 0.65 + 1.1) * 0.24 + Math.sin(t * 0.29) * 0.10) * preset.headAmp * amp;
        this.springs.headNod.target = Math.sin(t * 0.42) * 0.10 * preset.headAmp * amp;
        this.springs.headTurn.target = Math.sin(t * 0.31) * 0.14 * preset.headAmp * amp + this.facingDir * 0.10;
        this.springs.shoulderL.target = Math.sin(t * 0.72) * 0.06;
      }
    }

    pulseAccent(strength = 1.0) {
      const preset = MOTION_PRESETS[this.presetKey] || MOTION_PRESETS.naturale;
      const g = preset.gestureAmp * this.intensity * strength;
      this.springs.headNod.impulse(2.0 * g);
      this.springs.shoulderL.impulse(-1.1 * g);
      this.springs.leanY.impulse(0.9 * g);
    }

    update(dt) {
      const clampedDt = Math.min(dt, 0.05);
      this.time += clampedDt;

      if (this.morphT < 1.0) {
        this.morphT = Math.min(1.0, this.morphT + clampedDt / this.morphDuration);
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
     * Disegna il rig articolato a 2 ossa (camminata con dondolio braccia dalle spalle,
     * piegamento naturale dei gomiti, z-ordering avanti/dietro al busto e falcata gambe).
     */
    _drawArticulatedRig(ctx, bodyAlpha, motion) {
      const rig = this.walkingRig;
      const walkEntry = this.textures.walking;
      if (!rig || !walkEntry || !walkEntry.ready || bodyAlpha <= 0.01) return;

      const j = RIG_JOINTS;
      const cal = walkEntry.cal;
      const walkW = this.springs.walkWeight.value;
      const phi = this.springs.walkCycle;
      const speechE = this.springs.speechEnergy.value;
      const isSpeaking = speechE > 0.05;

      // Dondolio e piegamento braccia in contro-fase durante la camminata (o gesti gomito durante il parlato)
      const armPhaseL = phi;
      const armPhaseR = phi + Math.PI;
      const sinL = Math.sin(armPhaseL);
      const sinR = Math.sin(armPhaseR);

      let shoulderRotL = 0, elbowRotL = 0, shDxL = 0, shDyL = 0, scaleL = 1.0;
      let shoulderRotR = 0, elbowRotR = 0, shDxR = 0, shDyR = 0, scaleR = 1.0;

      if (walkW > 0.01) {
        const fwdL = 0.5 + 0.5 * sinL;
        const fwdR = 0.5 + 0.5 * sinR;

        // Spalla sinistra schermo (oscilla verso l'interno nella fase avanti e all'esterno dietro)
        shoulderRotL = (-0.095 * sinL - 0.018) * this.armSwingScale * walkW;
        shDxL = sinL * 1.8 * this.armSwingScale * walkW;
        shDyL = -fwdL * 2.2 * this.armSwingScale * walkW;
        scaleL = 1.0 + 0.020 * sinL * this.armSwingScale * walkW;

        // Piegamento gomito sinistro: sempre verso l'interno/alto (da -6° dietro a -22° avanti)
        const bendWaveL = 0.5 + 0.5 * Math.sin(armPhaseL - 0.20);
        elbowRotL = -(0.10 + 0.28 * Math.pow(bendWaveL, 1.15)) * this.elbowBendScale * walkW;

        // Spalla destra schermo (contro-fase opposta)
        shoulderRotR = (+0.095 * sinR + 0.018) * this.armSwingScale * walkW;
        shDxR = -sinR * 1.8 * this.armSwingScale * walkW;
        shDyR = -fwdR * 2.2 * this.armSwingScale * walkW;
        scaleR = 1.0 + 0.020 * sinR * this.armSwingScale * walkW;

        // Piegamento gomito destro: sempre verso l'interno/alto (da +6° dietro a +22° avanti)
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

        // Osso 1: Spalla -> Gomito (rigido)
        ctx.drawImage(upperPart.canvas, upperPart.ox, upperPart.oy);

        // Osso 2: Gomito -> Avambraccio + Mano (rotazione gerarchica attorno al perno circolare del gomito)
        ctx.translate(elbow.x, elbow.y);
        ctx.rotate(elRot);
        ctx.translate(-elbow.x, -elbow.y);
        ctx.drawImage(forearmPart.canvas, forearmPart.ox, forearmPart.oy);
        ctx.restore();
      };

      ctx.save();
      ctx.globalAlpha = bodyAlpha;
      ctx.translate(cal.dx, cal.dy);

      // 1. Gambe ancorate ai fianchi con leggera falcata opposta alle braccia
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

      // 2. Parte superiore del corpo (Busto rigido + Braccia a 2 ossa con profondità Z dinamica)
      ctx.translate(j.torsoHip.x + motion.swayPx, j.torsoHip.y + motion.leanPx);
      ctx.rotate(motion.torsoRot);
      ctx.translate(-j.torsoHip.x, -j.torsoHip.y);

      const leftInFront = sinL >= 0;
      const rightInFront = sinR >= 0;

      // Braccia in fase posteriore dietro la giacca
      if (!leftInFront) {
        drawArmChain(rig.upperArmL, rig.forearmL, j.shoulderL, j.elbowL, shoulderRotL, elbowRotL, shDxL, shDyL, scaleL, false);
      }
      if (!rightInFront) {
        drawArmChain(rig.upperArmR, rig.forearmR, j.shoulderR, j.elbowR, shoulderRotR, elbowRotR, shDxR, shDyR, scaleR, false);
      }

      // Busto rigido con respirazione naturale appena percettibile sul solo petto (zero deformazione onde)
      ctx.drawImage(rig.torso.canvas, rig.torso.ox, rig.torso.oy);

      // Braccia in fase anteriore davanti alla giacca con ombra di profondità
      if (leftInFront) {
        drawArmChain(rig.upperArmL, rig.forearmL, j.shoulderL, j.elbowL, shoulderRotL, elbowRotL, shDxL, shDyL, scaleL, true);
      }
      if (rightInFront) {
        drawArmChain(rig.upperArmR, rig.forearmR, j.shoulderR, j.elbowR, shoulderRotR, elbowRotR, shDxR, shDyR, scaleR, true);
      }

      ctx.restore();
    }

    /** Disegna una posa statica (standing, arms_raised, gesturing) come corpo rigido senza onde */
    _drawRigidBodyPose(ctx, entry, alpha, motion) {
      if (!entry || !entry.ready || alpha <= 0.01) return;
      const cal = entry.cal;
      const pivotX = RIG_JOINTS.torsoHip.x;
      const pivotY = RIG_JOINTS.torsoHip.y;
      const fScale = this.springs.facingScale ? this.springs.facingScale.value : 1.0;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pivotX + motion.swayPx + cal.dx * fScale, pivotY + motion.leanPx + cal.dy);
      ctx.rotate(motion.torsoRot);
      ctx.scale(cal.scale * fScale, cal.scale);
      ctx.translate(-pivotX, -pivotY);
      ctx.drawImage(entry.bodyCanvas, 0, 0);
      ctx.restore();
    }

    /**
     * Disegna la Testa Canonica Rigida (1:1 pixel reali, zero deformazione mandibola/guance)
     * con cavità labiale fotografica e battito palpebre ancorati rigidi al volto.
     */
    _drawHeadFacialRig(ctx, motion) {
      if (!this.canonicalHead) return;
      const head = this.canonicalHead;
      const neck = RIG_JOINTS.neck;
      const hip = RIG_JOINTS.torsoHip;

      ctx.save();
      // Segue rigorosamente la posizione del colletto del busto
      ctx.translate(hip.x + motion.swayPx, hip.y + motion.leanPx);
      ctx.rotate(motion.torsoRot);
      ctx.translate(-hip.x, -hip.y);

      // Rotazione euclidea pura (1:1 aspect ratio) del capo intorno al perno del collo
      ctx.translate(neck.x, neck.y);
      ctx.rotate(motion.headRot);
      ctx.translate(-neck.x + motion.headShiftX, -neck.y + motion.headShiftY);

      // 1. Volto canonico 100% rigido e indeformabile
      ctx.drawImage(head.canvas, head.ox, head.oy);

      // 2. Cavità orale fotografica compatta e centrata sul sorriso reale (preserva i denti originali)
      const mOpen = this.springs.mouthOpen.value;
      const mWidth = this.springs.mouthWidth.value;
      if (mOpen > 0.06) {
        const mx = CANONICAL_LANDMARKS.mouth[0] * BASE_W - 1.0;
        const my = CANONICAL_LANDMARKS.mouth[1] * BASE_H + 0.5;
        const rx = 8.0 * mWidth;
        const ry = 0.6 + mOpen * 2.6;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(mx, my + 0.8, rx, ry, 0, 0, Math.PI * 2);
        ctx.clip();

        // Ombra morbida della sola apertura inferiore, senza rettangolo artificiale sui denti
        const grad = ctx.createRadialGradient(mx, my + 1.2, 0.8, mx, my + 0.8, rx);
        grad.addColorStop(0, `rgba(26, 8, 10, ${Math.min(0.68, mOpen * 0.72).toFixed(2)})`);
        grad.addColorStop(1, `rgba(62, 20, 22, ${Math.min(0.45, mOpen * 0.50).toFixed(2)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(mx - rx - 1, my - ry, rx * 2 + 2, ry * 2 + 2);

        if (mOpen > 0.48) {
          ctx.fillStyle = `rgba(155, 62, 72, ${Math.min(0.38, (mOpen - 0.48) * 0.7).toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(mx, my + ry * 0.85, rx * 0.45, ry * 0.34, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Battito ciliare fotorealistico con tono pelle reale della palpebra di Antonio
      if (this.blinkAmount > 0.02) {
        const lid = this.sampledLidRgb;
        const eyes = [
          { x: CANONICAL_LANDMARKS.eyeL[0] * BASE_W, y: CANONICAL_LANDMARKS.eyeL[1] * BASE_H },
          { x: CANONICAL_LANDMARKS.eyeR[0] * BASE_W, y: CANONICAL_LANDMARKS.eyeR[1] * BASE_H }
        ];
        eyes.forEach((eye) => {
          const rx = 10.5;
          const ry = 4.6;
          const sweepY = eye.y - ry + this.blinkAmount * (ry * 2.02);

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(eye.x, eye.y, rx, ry, 0, 0, Math.PI * 2);
          ctx.clip();

          ctx.globalAlpha = Math.min(0.95, 0.35 + this.blinkAmount * 0.60);
          ctx.fillStyle = `rgb(${lid[0]}, ${lid[1]}, ${lid[2]})`;
          ctx.fillRect(eye.x - rx - 2, eye.y - ry - 2, rx * 2 + 4, (sweepY - (eye.y - ry)) + 2);

          // Linea ciglia sottile al bordo inferiore della palpebra
          ctx.strokeStyle = 'rgba(42, 26, 20, 0.72)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(eye.x - rx, sweepY);
          ctx.quadraticCurveTo(eye.x, sweepY + 1.2, eye.x + rx, sweepY);
          ctx.stroke();
          ctx.restore();
        });
      }

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

      // Parametri di moto rigido puro (niente onda, solo rotazioni e micro-traslazioni euclidee)
      const motion = {
        swayPx: this.springs.swayX.value * 4.5,
        leanPx: this.springs.leanY.value * 2.2 - breathVal * 1.1,
        torsoRot: this.springs.torsoRoll.value * 0.018,
        headRot: this.springs.headRoll.value * 0.019,
        headShiftX: this.springs.headTurn.value * 1.6,
        headShiftY: this.springs.headNod.value * 1.8
      };

      // Componi la scena completa sul buffer interno 768x1376
      compCtx.clearRect(0, 0, BASE_W, BASE_H);

      const drawBodyPose = (poseKey, entry, alpha) => {
        if (alpha <= 0.01) return;
        if (poseKey === 'walking' && this.walkingRig) {
          this._drawArticulatedRig(compCtx, alpha, motion);
        } else {
          this._drawRigidBodyPose(compCtx, entry, alpha, motion);
        }
      };

      if (morphSmooth < 0.99 && this.poseA !== this.poseB && effectiveA !== entryB) {
        drawBodyPose(this.poseA, effectiveA, 1.0 - morphSmooth);
      }
      drawBodyPose(this.poseB, entryB, morphSmooth);

      // Disegna la testa canonica UNA SOLA VOLTA sopra ogni posa (zero doppia faccia o perdita forma)
      this._drawHeadFacialRig(compCtx, motion);

      // Tinta studio ambientale uniforme su tutta la figura composta
      if (this.lighting.tintAlpha > 0.005) {
        compCtx.save();
        compCtx.globalCompositeOperation = 'source-atop';
        compCtx.globalAlpha = Math.min(0.25, this.lighting.tintAlpha);
        compCtx.fillStyle = `rgb(${this.lighting.tintR},${this.lighting.tintG},${this.lighting.tintB})`;
        compCtx.fillRect(0, 0, BASE_W, BASE_H);
        compCtx.restore();
      }

      // Trasferimento finale sul canvas visibile con filtro luce/contrasto ambientale uniforme
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

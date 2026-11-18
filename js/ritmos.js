/* ============================================================
   SONARE — Caixa de Ritmos (Drum Machine)
   - 4 padrões pré-definidos (rock, samba, bossa, reggae)
   - 8 peças (bumbo, caixa, hi-hat fechado, hi-hat aberto, prato, tom 1, tom 2, chimbal)
   - BPM 60-200 ajustável
   - Sons sintéticos via Web Audio API (sem arquivos)
   - Liga/desliga cada peça independentemente
============================================================ */

const Ritmos = {
  audioCtx: null,
  masterGain: null,
  volume: 0.7,

  // Padrões: array de 16 passos por peça
  // B = bumbo, S = caixa, H = hi-hat fechado, O = hi-hat aberto,
  // C = prato, T = tom 1, t = tom 2, X = chimbal
  patterns: {
    rock: [
      'B...B...B...B...',
      '..S...S...S...S.',
      'H.H.H.H.H.H.H.H.',
      '................',
      '....C...........',
      '................',
      'T...........t...',
      '................',
    ],
    samba: [
      'B.B.BB..B.B.BB..',
      '..S...S...S...S.',
      'H.H.H.H.H.H.H.H.',
      '....t...t...t...',
      '....C...........',
      '................',
      '.T..............',
      '................',
    ],
    bossa: [
      'B..B.B.B..B..B..',
      '..S...S...S.S.S.',
      'H.H.H.H.H.H.H.H.',
      '................',
      '..........C.....',
      '................',
      '......T...t.....',
      '................',
    ],
    reggae: [
      'B...B...B...B...',
      '..S...S...S...S.',
      'H.H...H.H.H...H.',
      '................',
      '....C...........',
      '................',
      '......t.........',
      '................',
    ],
    jazz: [
      'B..B.B..B..B.B..',
      '....S..S..S..S..',
      'H.H.H.H.H.H.H.H.',
      '......O.O......O',
      '....C...........',
      '....T...t...t...',
      '...t...........t',
      '................',
    ],
    funk: [
      'B...B..B..B.B.B.',
      '..S.S.S..S.S..S.',
      'H.H.H.H.H.H.H.H.',
      '......O...O.....',
      '....C...........',
      '..t..t..t..t..t..',
      'T...........t...',
      '................',
    ],
    forro: [
      'B.BB..B.BB..B.BB',
      '..S...S...S...S.',
      'H.H.H.H.H.H.H.H.',
      '....X...X...X...',
      '....C...........',
      '..T...t...T...t.',
      '.T..............',
      '................',
    ],
    pagode: [
      'B.B.B.B.B.B.B.B.',
      '..S...S..S..S...',
      'H.H.H.H.H.H.H.H.',
      '....X...X...X...',
      '....C...........',
      '..T..t..T..t..T.',
      '......t.........',
      '................',
    ],
  },

  // Versão ORIGINAL (para reset)
  patternsOriginal: null,

  pieceNames: {
    bumbo: 'Bumbo',
    caixa: 'Caixa',
    hiHatClosed: 'Hi-Hat',
    hiHatOpen: 'Hi-Hat Aberto',
    prato: 'Prato',
    tom1: 'Tom 1',
    tom2: 'Tom 2',
    chimbal: 'Chimbal',
  },

  currentPattern: 'rock',
  enabledPieces: {
    bumbo: true,
    caixa: true,
    hiHatClosed: true,
    hiHatOpen: false,
    prato: false,
    tom1: false,
    tom2: false,
    chimbal: false,
  },
  // Volume individual por peça (0-1)
  pieceVolumes: {
    bumbo: 1.0,
    caixa: 0.85,
    hiHatClosed: 0.5,
    hiHatOpen: 0.6,
    prato: 0.5,
    tom1: 0.7,
    tom2: 0.7,
    chimbal: 0.5,
  },
  // Customizações por padrão (salvas no localStorage)
  customPatterns: null,
  bpm: 120,
  isPlaying: false,
  currentStep: 0,
  intervalId: null,
  el: {},

  /* ============================================================
     UI: gera o HTML da aba
  ============================================================ */
  renderUI() {
    const container = document.getElementById('ritmos-content');
    if (!container) return;

    const patternKeys = Object.keys(this.patterns);

    container.innerHTML = `
      <div class="ritmos-app">
        <div class="ritmos-bpm">
          <label>BPM: <strong id="ritmos-bpm-value">${this.bpm}</strong></label>
          <button class="ritmos-btn-mini" id="ritmos-bpm-down">−</button>
          <input type="range" id="ritmos-bpm-slider" min="60" max="200" value="${this.bpm}" />
          <button class="ritmos-btn-mini" id="ritmos-bpm-up">+</button>
        </div>

        <div class="ritmos-patterns">
          <label>Padrão:</label>
          <div class="ritmos-pattern-btns">
            ${patternKeys.map(p => `<button class="ritmos-btn-pattern ${p === this.currentPattern ? 'active' : ''}" data-pattern="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</button>`).join('')}
          </div>
        </div>

        <div class="ritmos-pieces">
          <label>Peças (ligadas):</label>
          <div class="ritmos-piece-btns">
            ${Object.entries(this.pieceNames).map(([key, name]) => `
              <button class="ritmos-btn-piece ${this.enabledPieces[key] ? 'active' : ''}" data-piece="${key}">${this.enabledPieces[key] ? '☑' : '☐'} ${name}</button>
            `).join('')}
          </div>
        </div>

        <div class="ritmos-grid" id="ritmos-grid">
          ${Object.entries(this.pieceNames).map(([pieceKey, pieceName]) => `
            <div class="ritmos-row">
              <div class="ritmos-row-label">${pieceName}</div>
              <div class="ritmos-row-steps">
                ${Array.from({length: 16}).map((_, i) => {
                  const step = this.getStepChar(this.patterns[this.currentPattern][this.getPieceIndex(pieceKey)], i);
                  return `<div class="ritmos-step ${step ? 'active' : ''}" data-piece="${pieceKey}" data-step="${i}">${step || '·'}</div>`;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="ritmos-controls">
          <button class="ritmos-btn-play" id="ritmos-play">▶ Tocar</button>
          <button class="ritmos-btn-stop" id="ritmos-stop" disabled>⏸ Parar</button>
        </div>

        <div class="ritmos-mixer">
          <label>🎚️ Mixer de peças:</label>
          <div class="ritmos-mixer-grid">
            ${Object.entries(this.pieceNames).map(([key, name]) => `
              <div class="ritmos-mixer-row">
                <span class="ritmos-mixer-label">${name}</span>
                <input type="range" min="0" max="100" value="${Math.round((this.pieceVolumes[key] || 0) * 100)}" data-piece-vol="${key}" />
                <span class="ritmos-mixer-value">${Math.round((this.pieceVolumes[key] || 0) * 100)}%</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ritmos-volume">
          <label>🔊 Volume master: <strong id="ritmos-volume-value">${Math.round(this.volume * 100)}%</strong></label>
          <input type="range" id="ritmos-volume-slider" min="0" max="100" value="${Math.round(this.volume * 100)}" />
        </div>

        <div class="ritmos-actions">
          <button class="ritmos-btn-reset" id="ritmos-reset">🔄 Restaurar padrão "${this.currentPattern}"</button>
        </div>
      </div>
    `;
  },

  getPieceIndex(pieceKey) {
    const order = ['bumbo', 'caixa', 'hiHatClosed', 'hiHatOpen', 'prato', 'tom1', 'tom2', 'chimbal'];
    return order.indexOf(pieceKey);
  },

  getStepChar(patternLine, step) {
    return patternLine[step] || '';
  },

  /* ============================================================
     Inicialização: bind dos botões
  ============================================================ */
  init() {
    // Salva original patterns
    if (!this.patternsOriginal) {
      this.patternsOriginal = JSON.parse(JSON.stringify(this.patterns));
    }
    // Carrega customizações salvas
    this.loadCustomizations();
    this.renderUI();

    // BPM
    document.getElementById('ritmos-bpm-down').addEventListener('click', () => {
      this.bpm = Math.max(60, this.bpm - 5);
      this.updateBPMDisplay();
    });
    document.getElementById('ritmos-bpm-up').addEventListener('click', () => {
      this.bpm = Math.min(200, this.bpm + 5);
      this.updateBPMDisplay();
    });
    document.getElementById('ritmos-bpm-slider').addEventListener('input', (e) => {
      this.bpm = Number(e.target.value);
      this.updateBPMDisplay();
      if (this.isPlaying) this.restartLoop();
    });

    // Padrões
    document.querySelectorAll('[data-pattern]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-pattern]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPattern = btn.dataset.pattern;
        this.updateGrid();
      });
    });

    // Peças (toggle on/off)
    document.querySelectorAll('[data-piece].ritmos-btn-piece').forEach(btn => {
      btn.addEventListener('click', () => {
        const piece = btn.dataset.piece;
        this.enabledPieces[piece] = !this.enabledPieces[piece];
        btn.classList.toggle('active');
        btn.innerHTML = (this.enabledPieces[piece] ? '☑ ' : '☐ ') + this.pieceNames[piece];
      });
    });

    // Toggle de peça direto no grid (clicar no step liga/desliga)
    document.querySelectorAll('.ritmos-step').forEach(step => {
      step.addEventListener('click', () => {
        const piece = step.dataset.piece;
        const i = Number(step.dataset.step);
        this.toggleStep(piece, i, step);
      });
    });

    // Play/Stop
    document.getElementById('ritmos-play').addEventListener('click', () => this.start());
    document.getElementById('ritmos-stop').addEventListener('click', () => this.stop());

    // Volume
    document.getElementById('ritmos-volume-slider').addEventListener('input', (e) => {
      this.volume = Number(e.target.value) / 100;
      if (this.masterGain) this.masterGain.gain.value = this.volume;
      document.getElementById('ritmos-volume-value').textContent = e.target.value;
    });

    // Mixer de peças (volume individual)
    document.querySelectorAll('[data-piece-vol]').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const piece = e.target.dataset.pieceVol;
        const value = Number(e.target.value) / 100;
        this.pieceVolumes[piece] = value;
        e.target.nextElementSibling.textContent = e.target.value + '%';
        this.saveCustomizations();
      });
    });

    // Botão de reset
    document.getElementById('ritmos-reset').addEventListener('click', () => this.resetPattern());
  },

  updateBPMDisplay() {
    document.getElementById('ritmos-bpm-value').textContent = this.bpm;
    document.getElementById('ritmos-bpm-slider').value = this.bpm;
  },

  updateGrid() {
    const grid = document.getElementById('ritmos-grid');
    if (!grid) return;
    const rows = grid.querySelectorAll('.ritmos-row');
    rows.forEach((row, rowIndex) => {
      const pieceKey = Object.keys(this.pieceNames)[rowIndex];
      const patternLine = this.patterns[this.currentPattern][this.getPieceIndex(pieceKey)];
      const steps = row.querySelectorAll('.ritmos-step');
      steps.forEach((step, i) => {
        const char = this.getStepChar(patternLine, i);
        step.classList.toggle('active', !!char);
        step.textContent = char || '·';
      });
    });
  },

  toggleStep(pieceKey, stepIndex, el) {
    const pieceIdx = this.getPieceIndex(pieceKey);
    const pattern = this.patterns[this.currentPattern];
    let line = pattern[pieceIdx];
    const newLine = line.split('').map((c, i) => {
      if (i !== stepIndex) return c;
      if (c) return '';
      return this.getCharForPiece(pieceKey);
    }).join('');
    pattern[pieceIdx] = newLine;
    el.classList.toggle('active');
    el.textContent = el.classList.contains('active') ? this.getCharForPiece(pieceKey) : '·';
    this.saveCustomizations();  // Salva ao editar
  },

  /* ============================================================
     Persistência: salva customizações no localStorage
  ============================================================ */
  loadCustomizations() {
    try {
      const saved = localStorage.getItem('sonare-ritmos-custom');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.patterns) {
          // Aplica apenas os padrões modificados
          for (const p of Object.keys(data.patterns)) {
            if (this.patterns[p]) {
              this.patterns[p] = data.patterns[p];
            }
          }
        }
        if (data.pieceVolumes) {
          this.pieceVolumes = { ...this.pieceVolumes, ...data.pieceVolumes };
        }
        if (data.enabledPieces) {
          this.enabledPieces = { ...this.enabledPieces, ...data.enabledPieces };
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar customizações:', e);
    }
  },

  saveCustomizations() {
    try {
      const data = {
        patterns: this.patterns,
        pieceVolumes: this.pieceVolumes,
        enabledPieces: this.enabledPieces,
        updatedAt: Date.now(),
      };
      localStorage.setItem('sonare-ritmos-custom', JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar customizações:', e);
    }
  },

  resetPattern() {
    if (!this.patternsOriginal) return;
    if (!confirm(`Restaurar o padrão "${this.currentPattern}" para o original? Suas customizações serão perdidas.`)) return;
    this.patterns[this.currentPattern] = JSON.parse(JSON.stringify(this.patternsOriginal[this.currentPattern]));
    this.saveCustomizations();
    this.updateGrid();
    showToast('Padrão restaurado.');
  },

  getCharForPiece(pieceKey) {
    const map = {
      bumbo: 'B',
      caixa: 'S',
      hiHatClosed: 'H',
      hiHatOpen: 'O',
      prato: 'C',
      tom1: 'T',
      tom2: 't',
      chimbal: 'X',
    };
    return map[pieceKey] || '·';
  },

  /* ============================================================
     Loop e áudio
  ============================================================ */
  async start() {
    if (this.isPlaying) return;

    // Lazy init AudioContext (precisa de user gesture)
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioCtx.destination);
    }

    // Resume caso esteja suspended
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.currentStep = 0;
    document.getElementById('ritmos-play').disabled = true;
    document.getElementById('ritmos-stop').disabled = false;

    // 16 passos por compasso, 4 sub-passos por tempo
    // Para BPM=120, um tempo = 500ms, 1 passo = 125ms
    const interval = (60 / this.bpm) * 1000 / 4;
    this.intervalId = setInterval(() => this.tick(), interval);
  },

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    document.getElementById('ritmos-play').disabled = false;
    document.getElementById('ritmos-stop').disabled = true;
    this.clearStepHighlight();
  },

  restartLoop() {
    if (this.intervalId) clearInterval(this.intervalId);
    const interval = (60 / this.bpm) * 1000 / 4;
    this.intervalId = setInterval(() => this.tick(), interval);
  },

  tick() {
    const pattern = this.patterns[this.currentPattern];
    const stepsInMeasure = 16;

    for (let i = 0; i < pattern.length; i++) {
      const pieceKey = Object.keys(this.pieceNames)[i];
      if (!this.enabledPieces[pieceKey]) continue;
      const char = pattern[i][this.currentStep];
      if (!char || char === '.') continue;
      this.tocarPeca(pieceKey);
    }

    // Highlight visual
    this.highlightStep(this.currentStep);

    // Avança passo
    this.currentStep = (this.currentStep + 1) % stepsInMeasure;
  },

  highlightStep(stepIndex) {
    this.clearStepHighlight();
    const steps = document.querySelectorAll(`.ritmos-step[data-step="${stepIndex}"]`);
    steps.forEach(s => s.classList.add('playing'));
    setTimeout(() => this.clearStepHighlight(), 100);
  },

  clearStepHighlight() {
    document.querySelectorAll('.ritmos-step.playing').forEach(s => s.classList.remove('playing'));
  },

  /* ============================================================
     Sons sintéticos via Web Audio API
  ============================================================ */
  tocarPeca(pieceKey) {
    const ctx = this.audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const pieceVol = this.pieceVolumes[pieceKey] || 0.7;

    switch (pieceKey) {
      case 'bumbo':
        this.tocarBumbo(now, pieceVol);
        break;
      case 'caixa':
        this.tocarCaixa(now, pieceVol);
        break;
      case 'hiHatClosed':
        this.tocarHiHat(now, false, pieceVol);
        break;
      case 'hiHatOpen':
        this.tocarHiHat(now, true, pieceVol);
        break;
      case 'prato':
        this.tocarPrato(now, pieceVol);
        break;
      case 'tom1':
        this.tocarTom(now, 120, pieceVol);
        break;
      case 'tom2':
        this.tocarTom(now, 90, pieceVol);
        break;
      case 'chimbal':
        this.tocarChimbal(now, pieceVol);
        break;
    }
  },

  tocarBumbo(now, vol) {
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  },

  tocarCaixa(now, vol) {
    const ctx = this.audioCtx;
    // Tom (corpo do snare)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
    // Ruído (o "ssss" do snare)
    const noise = this.makeNoise(0.15);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    noise.connect(filter).connect(noiseGain).connect(this.masterGain);
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.start(now);
    noise.stop(now + 0.15);
  },

  tocarHiHat(now, aberto, vol) {
    const ctx = this.audioCtx;
    const dur = aberto ? 0.3 : 0.05;
    const noise = this.makeNoise(dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter).connect(gain).connect(this.masterGain);
    noise.start(now);
    noise.stop(now + dur);
  },

  tocarPrato(now, vol) {
    const ctx = this.audioCtx;
    const dur = 1.2;
    const noise = this.makeNoise(dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter).connect(gain).connect(this.masterGain);
    noise.start(now);
    noise.stop(now + dur);
  },

  tocarTom(now, freq, vol) {
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.2);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  },

  tocarChimbal(now) {
    const ctx = this.audioCtx;
    const dur = 0.4;
    const noise = this.makeNoise(dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter).connect(gain).connect(this.masterGain);
    noise.start(now);
    noise.stop(now + dur);
  },

  // Util: cria buffer de ruído branco
  makeNoise(duration) {
    const ctx = this.audioCtx;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  },
};

// Torna global
window.Ritmos = Ritmos;

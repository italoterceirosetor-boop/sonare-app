// ============= AFINADOR CROMÁTICO =============

const Tuner = {
  audioContext: null,
  analyser: null,
  microphone: null,
  isRunning: false,
  rafId: null,
  buffer: null,
  sampleRate: 44100,

  // Notas de afinação padrão (em Hz) - E2, A2, D3, G3, B3, E4
  standardTuning: {
    'E2': 82.41, 'A2': 110.00, 'D3': 146.83,
    'G3': 196.00, 'B3': 246.94, 'E4': 329.63
  },

  currentString: null,
  useReferenceSound: false,
  currentStandard: 'standard',
  tuningOffsets: {
    standard: 0,
    dropD: { 'E2': -5 },  // 6ª corda D2 = 73.42Hz
    openG: { 'E2': -5, 'A2': -2, 'D3': 0, 'G3': 0, 'B3': 0, 'E4': -5 }, // D G D G B D
    halfDown: -1 // todos meio tom abaixo
  },

  init() {
    document.getElementById('tunerStart').addEventListener('click', () => this.start());
    document.getElementById('tunerStop').addEventListener('click', () => this.stop());
    document.getElementById('tunerSound').addEventListener('change', e => {
      this.useReferenceSound = e.target.checked;
    });
    document.getElementById('tunerStandard').addEventListener('change', e => {
      this.currentStandard = e.target.value;
      this.updateStringButtons();
    });

    // Botões de cordas (tocam som de referência)
    document.querySelectorAll('#stringButtons button').forEach(btn => {
      btn.addEventListener('click', () => {
        const freq = parseFloat(btn.dataset.freq);
        this.currentString = btn.dataset.string;
        document.querySelectorAll('#stringButtons button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.useReferenceSound) this.playReferenceTone(freq);
      });
    });
  },

  updateStringButtons() {
    const buttons = document.querySelectorAll('#stringButtons button');
    const offset = this.tuningOffsets[this.currentStandard];
    buttons.forEach(btn => {
      const stringName = btn.dataset.string;
      let freq = parseFloat(btn.dataset.freq);
      if (this.currentStandard === 'dropD' && stringName === 'E2') {
        freq = 73.42; // D2
        btn.textContent = 'D (6ª)';
      } else if (this.currentStandard === 'openG') {
        if (stringName === 'E2') { freq = 73.42; btn.textContent = 'D (6ª)'; }
        else if (stringName === 'A2') { freq = 98.00; btn.textContent = 'G (5ª)'; }
        else if (stringName === 'E4') { freq = 293.66; btn.textContent = 'D (1ª)'; }
      } else if (this.currentStandard === 'halfDown') {
        freq = freq * Math.pow(2, -1/12);
        btn.textContent = btn.textContent.replace(/\)$/, '♭)');
      } else {
        // restaurar
        if (stringName === 'E2') btn.textContent = 'E (6ª)';
        else if (stringName === 'A2') btn.textContent = 'A (5ª)';
        else if (stringName === 'D3') btn.textContent = 'D (4ª)';
        else if (stringName === 'G3') btn.textContent = 'G (3ª)';
        else if (stringName === 'B3') btn.textContent = 'B (2ª)';
        else if (stringName === 'E4') btn.textContent = 'E (1ª)';
      }
      btn.dataset.freq = freq;
    });
  },

  async start() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
      this.buffer = new Float32Array(4096);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      this.microphone = stream;
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      this.isRunning = true;
      document.getElementById('tunerStart').disabled = true;
      document.getElementById('tunerStop').disabled = false;
      document.getElementById('tunerStatus').textContent = 'Ouvindo... toque uma corda';
      this.update();
    } catch (err) {
      this.showToast('Erro ao acessar microfone. Permita o acesso.');
      console.error(err);
    }
  },

  stop() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.microphone) {
      this.microphone.getTracks().forEach(t => t.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    document.getElementById('tunerStart').disabled = false;
    document.getElementById('tunerStop').disabled = true;
    document.getElementById('tunerStatus').textContent = 'Aguardando áudio...';
    document.getElementById('tunerNote').textContent = '--';
    document.getElementById('tunerFreq').textContent = '0.0 Hz';
    document.getElementById('tunerNeedle').style.left = '50%';
  },

  // Algoritmo YIN para detecção de pitch
  detectPitch(buffer, sampleRate) {
    const threshold = 0.1;
    const bufferSize = buffer.length;
    const halfSize = Math.floor(bufferSize / 2);

    // Diferença quadrática
    const yinBuffer = new Float32Array(halfSize);
    for (let tau = 0; tau < halfSize; tau++) {
      yinBuffer[tau] = 0;
    }

    for (let tau = 1; tau < halfSize; tau++) {
      let sum = 0;
      for (let i = 0; i < halfSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // Diferença cumulativa
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfSize; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
    }

    // Encontrar o primeiro mínimo abaixo do threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < halfSize; tau++) {
      if (yinBuffer[tau] < threshold) {
        while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate === -1) return null;

    // Interpolação parabólica
    let betterTau;
    const x0 = (tauEstimate < 1) ? tauEstimate : tauEstimate - 1;
    const x2 = (tauEstimate + 1 < halfSize) ? tauEstimate + 1 : tauEstimate;
    if (x0 === tauEstimate) {
      betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
    } else if (x2 === tauEstimate) {
      betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
    } else {
      const s0 = yinBuffer[x0];
      const s1 = yinBuffer[tauEstimate];
      const s2 = yinBuffer[x2];
      betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }

    return sampleRate / betterTau;
  },

  frequencyToNote(freq) {
    if (freq <= 0) return null;
    // A4 = 440Hz, número MIDI = 69
    const midi = 69 + 12 * Math.log2(freq / 440);
    const roundedMidi = Math.round(midi);
    const note = NOTE_FREQUENCIES[((roundedMidi % 12) + 12) % 12];
    const octave = Math.floor(roundedMidi / 12) - 1;
    const cents = Math.round((midi - roundedMidi) * 100);
    return {
      note: note.note,
      name: note.name,
      octave,
      cents,
      exactFreq: freq
    };
  },

  update() {
    if (!this.isRunning) return;
    this.rafId = requestAnimationFrame(() => this.update());

    this.analyser.getFloatTimeDomainData(this.buffer);

    // Calcular RMS para detectar se há sinal
    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);

    if (rms < 0.01) {
      // Silêncio
      return;
    }

    const freq = this.detectPitch(this.buffer, this.sampleRate);
    if (!freq || freq < 50 || freq > 1500) {
      document.getElementById('tunerNote').textContent = '--';
      document.getElementById('tunerFreq').textContent = '0.0 Hz';
      document.getElementById('tunerStatus').textContent = 'Toque uma corda mais forte';
      document.getElementById('tunerStatus').className = 'tuner-status';
      document.getElementById('tunerNeedle').style.left = '50%';
      document.getElementById('tunerNeedle').className = 'tuner-needle';
      return;
    }

    const detected = this.frequencyToNote(freq);
    if (!detected) return;

    document.getElementById('tunerNote').textContent = detected.note;
    document.getElementById('tunerFreq').textContent = freq.toFixed(2) + ' Hz';

    // Calcular diferença em cents e mover agulha
    const cents = detected.cents;
    const clampedCents = Math.max(-50, Math.min(50, cents));
    const percent = 50 + clampedCents;
    const needle = document.getElementById('tunerNeedle');
    needle.style.left = percent + '%';

    const status = document.getElementById('tunerStatus');
    if (Math.abs(cents) < 5) {
      needle.className = 'tuner-needle';
      status.className = 'tuner-status in-tune';
      status.textContent = '✓ Afinado!';
    } else if (cents < 0) {
      needle.className = 'tuner-needle flat';
      status.className = 'tuner-status flat';
      status.textContent = `Abaixo: aperte a cravelha (${cents} cents)`;
    } else {
      needle.className = 'tuner-needle sharp';
      status.className = 'tuner-status sharp';
      status.textContent = `Acima: afrouxe a cravelha (+${cents} cents)`;
    }

    // Verificar se está afinando uma corda específica
    if (this.currentString) {
      const targetFreq = this.currentString ? parseFloat(document.querySelector(`#stringButtons button[data-string="${this.currentString}"]`).dataset.freq) : null;
      if (targetFreq) {
        const targetCents = Math.round(1200 * Math.log2(freq / targetFreq));
        if (Math.abs(targetCents) < 5) {
          status.textContent = `✓ Corda ${this.currentString} afinada!`;
        } else {
          status.textContent = `Corda ${this.currentString}: ${targetCents > 0 ? '+' : ''}${targetCents} cents`;
        }
      }
    }
  },

  playReferenceTone(freq) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 1.5);
  },

  showToast(msg) {
    if (window.App && SonareApp.toast) SonareApp.toast(msg);
  }
};

// ============= METRÔNOMO =============

const Metronome = {
  audioContext: null,
  isRunning: false,
  bpm: 120,
  beatsPerMeasure: 4,
  currentBeat: 0,
  intervalId: null,
  nextNoteTime: 0,
  timerWorker: null,
  lookAhead: 25, // ms
  scheduleAheadTime: 0.1, // s

  init() {
    document.getElementById('metroBpm').addEventListener('input', e => {
      this.bpm = parseInt(e.target.value);
      document.getElementById('metroDisplay').textContent = this.bpm;
    });
    document.getElementById('metroBeats').addEventListener('change', e => {
      this.beatsPerMeasure = parseInt(e.target.value);
    });
    document.getElementById('metroStart').addEventListener('click', () => this.start());
    document.getElementById('metroStop').addEventListener('click', () => this.stop());
  },

  ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  start() {
    this.ensureContext();
    this.isRunning = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    document.getElementById('metroStart').disabled = true;
    document.getElementById('metroStop').disabled = false;
    this.scheduler();
  },

  stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    document.getElementById('metroStart').disabled = false;
    document.getElementById('metroStop').disabled = true;
    this.currentBeat = 0;
  },

  scheduler() {
    if (!this.isRunning) return;
    this.intervalId = setInterval(() => {
      while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.currentBeat, this.nextNoteTime);
        this.advance();
      }
    }, this.lookAhead);
  },

  advance() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
  },

  scheduleNote(beatNumber, time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    if (beatNumber === 0) {
      // Batida forte (acorde inicial)
      osc.frequency.value = 1000;
      gain.gain.value = 0.3;
    } else {
      osc.frequency.value = 800;
      gain.gain.value = 0.2;
    }
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.05);
  }
};

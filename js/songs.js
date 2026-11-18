// ============= MÚSICAS E CIFRAS =============

const Songs = {
  customSongs: JSON.parse(localStorage.getItem('customSongs') || '[]'),
  playedSongs: JSON.parse(localStorage.getItem('playedSongs') || '[]'),
  currentSong: null,
  currentTranspose: 0,
  currentCapo: 0,
  searchTerm: '',
  categoryFilter: 'all',
  autoscrollEnabled: false,
  autoscrollInterval: null,

  init() {
    document.getElementById('songSearch').addEventListener('input', e => {
      this.searchTerm = e.target.value.toLowerCase();
      this.render();
    });
    document.getElementById('songFilter').addEventListener('change', e => {
      this.categoryFilter = e.target.value;
      this.render();
    });
    document.getElementById('songAdd').addEventListener('click', () => {
      this.openAddSong();
    });
    document.getElementById('songKey').addEventListener('change', e => {
      this.currentTranspose = parseInt(e.target.value);
      this.renderLyrics();
    });
    document.getElementById('songCapo').addEventListener('change', e => {
      this.currentCapo = parseInt(e.target.value);
      this.renderLyrics();
    });
    document.getElementById('songMetronome').addEventListener('click', () => {
      const bpm = this.currentSong?.bpm || 120;
      document.getElementById('metroBpm').value = bpm;
      document.getElementById('metroDisplay').textContent = bpm;
      Metronome.bpm = bpm;
      document.getElementById('metronomeModal').hidden = false;
    });
    document.getElementById('songAutoscroll').addEventListener('click', () => {
      this.toggleAutoscroll();
    });
    document.getElementById('addSongForm').addEventListener('submit', e => this.handleAddSong(e));
    this.render();
  },

  getAllSongs() {
    return [...SONGS_LIBRARY, ...this.customSongs];
  },

  render() {
    const list = document.getElementById('songList');
    if (!list) return;
    list.innerHTML = '';
    let songs = this.getAllSongs();
    if (this.categoryFilter !== 'all') {
      songs = songs.filter(s => s.category === this.categoryFilter);
    }
    if (this.searchTerm) {
      songs = songs.filter(s =>
        s.title.toLowerCase().includes(this.searchTerm) ||
        s.artist.toLowerCase().includes(this.searchTerm)
      );
    }

    if (!songs.length) {
      list.innerHTML = '<p class="muted">Nenhuma música encontrada.</p>';
      return;
    }

    songs.forEach(song => {
      const isPlayed = this.playedSongs.includes(song.id);
      const item = document.createElement('div');
      item.className = 'song-item';
      item.innerHTML = `
        <div class="song-info">
          <h3>${isPlayed ? '✓ ' : ''}${escHTML(song.title)}</h3>
          <div class="song-artist">${escHTML(song.artist)} • Tom: ${escHTML(song.key)}</div>
          <div class="song-tags">
            <span class="badge">${escHTML(song.category)}</span>
            ${song.bpm ? `<span class="badge">${escHTML(song.bpm)} BPM</span>` : ''}
          </div>
        </div>
        <button class="secondary" data-del="${escHTML(song.id)}">▶ Tocar</button>
      `;
      item.querySelector('button').addEventListener('click', e => {
        e.stopPropagation();
        this.openSong(song);
      });
      item.addEventListener('click', () => this.openSong(song));
      list.appendChild(item);
    });
  },

  openSong(song) {
    this.currentSong = song;
    this.currentTranspose = 0;
    this.currentCapo = 0;
    document.getElementById('songTitle').textContent = `${song.title} - ${song.artist}`;
    document.getElementById('songMeta').textContent =
      `${this.categoryLabel(song.category)} • Tom original: ${song.key} • ${song.bpm || 120} BPM`;

    // Popular select de transposição
    const keySelect = document.getElementById('songKey');
    keySelect.innerHTML = '';
    for (let i = -6; i <= 6; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      const transposedKey = this.transposeKey(song.key, i);
      opt.textContent = (i === 0 ? 'Tom original: ' : (i > 0 ? '+' : '') + i + ' → ') + transposedKey;
      if (i === 0) opt.selected = true;
      keySelect.appendChild(opt);
    }

    // Capo
    const capoSelect = document.getElementById('songCapo');
    capoSelect.innerHTML = '<option value="0">Sem capo</option>';
    for (let i = 1; i <= 12; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Capo ${i} (${this.transposeKey(song.key, i)})`;
      capoSelect.appendChild(opt);
    }

    this.renderLyrics();
    document.getElementById('songModal').hidden = false;

    // Marcar como tocada
    if (!this.playedSongs.includes(song.id)) {
      this.playedSongs.push(song.id);
      localStorage.setItem('playedSongs', JSON.stringify(this.playedSongs));
    }
  },

  // Transpor uma nota (soma semitons)
  transposeKey(key, semitones) {
    if (!key) return 'C';
    // Trata notas com sustenido/bemol
    const isFlat = key.includes('b');
    let normalized = key;
    if (isFlat) {
      // Converter bemol para sustenido equivalente
      const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
      normalized = map[key] || key;
    }
    const idx = KEYS.indexOf(normalized);
    if (idx === -1) return key;
    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;
    return KEYS[newIdx];
  },

  // Transpor uma cifra individual (ex: "Am7" com +2 -> "Bm7")
  // Suporta baixo invertido: "C/E" -> "D/F#"
  transposeChord(chord, semitones) {
    if (semitones === 0) return chord;
    // Separar baixo invertido (depois da barra)
    const parts = chord.split('/');
    const transposedMain = this._transposeRoot(parts[0], semitones);
    if (parts.length === 1) return transposedMain;
    const transposedBass = this._transposeRoot(parts[1], semitones);
    return transposedMain + '/' + transposedBass;
  },

  _transposeRoot(root, semitones) {
    // Match raiz (com opcional sustenido/bemol) + sufixo
    const match = root.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return root;
    const noteRoot = match[1];
    const suffix = match[2];
    const isFlat = noteRoot.includes('b');
    let normalized = noteRoot;
    if (isFlat) {
      const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
      normalized = map[noteRoot] || noteRoot;
    }
    const idx = KEYS.indexOf(normalized);
    if (idx === -1) return root;
    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12;
    return KEYS[newIdx] + suffix;
  },

  renderLyrics() {
    if (!this.currentSong) return;
    const lyrics = escHTML(this.currentSong.lyrics || '');
    // Detectar cifras entre colchetes: [C], [Am7], [G/B], etc
    const html = lyrics
      .split('\n')
      .map(line => {
        // Linha com cifras
        if (line.includes('[')) {
          let processed = line.replace(/\[([^\]]+)\]/g, (m, chord) => {
            const transposed = this.transposeChord(chord, this.currentTranspose);
            return `<span class="chord" data-chord="${transposed}">${transposed}</span>`;
          });
          return processed;
        } else if (line.match(/^\[(Intro|Verso|Refrão|Ponte|Solo|Base|Final)/i)) {
          return `<span class="section">${line.replace(/[\[\]]/g, '')}</span>`;
        } else {
          return line;
        }
      })
      .join('\n');

    const lyricsDiv = document.getElementById('songLyrics');
    lyricsDiv.innerHTML = html;

    // Adicionar listeners nas cifras
    lyricsDiv.querySelectorAll('.chord').forEach(span => {
      span.addEventListener('click', () => {
        const chordName = span.dataset.chord;
        Theory.showChordDiagram(chordName);
      });
    });
  },

  toggleAutoscroll() {
    const lyricsDiv = document.getElementById('songLyrics');
    if (this.autoscrollEnabled) {
      clearInterval(this.autoscrollInterval);
      this.autoscrollEnabled = false;
      document.getElementById('songAutoscroll').textContent = '📜 Auto-scroll';
      return;
    }
    this.autoscrollEnabled = true;
    document.getElementById('songAutoscroll').textContent = '⏸ Pausar scroll';
    this.autoscrollInterval = setInterval(() => {
      lyricsDiv.scrollTop += 1;
    }, 100);
  },

  categoryLabel(cat) {
    return {
      popular: 'Popular', mpb: 'MPB', rock: 'Rock',
      sertanejo: 'Sertanejo', gospel: 'Gospel',
      bossa: 'Bossa Nova', infantil: 'Infantil'
    }[cat] || cat;
  },

  openAddSong() {
    const form = document.getElementById('addSongForm');
    form.reset();
    const keySelect = form.querySelector('select[name="key"]');
    keySelect.innerHTML = KEYS.map(k => `<option value="${k}">${k}</option>`).join('');
    document.getElementById('addSongModal').hidden = false;
  },

  handleAddSong(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const song = {
      id: 'custom_' + Date.now(),
      title: data.get('title'),
      artist: data.get('artist'),
      category: data.get('category'),
      key: data.get('key'),
      bpm: parseInt(data.get('bpm')) || 120,
      lyrics: data.get('lyrics')
    };
    this.customSongs.push(song);
    localStorage.setItem('customSongs', JSON.stringify(this.customSongs));
    document.getElementById('addSongModal').hidden = true;
    SonareApp.toast('✓ Música adicionada!');
    this.render();
  }
};

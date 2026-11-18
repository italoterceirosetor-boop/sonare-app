// ============= TEORIA: RENDERIZAÇÃO DE ACORDES, NOTAS E ESCALAS =============

const Theory = {
  renderNotes() {
    const grid = document.getElementById('notesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const noteNames = [
      { n: 'C',  p: 'Dó' }, { n: 'C#', p: 'Dó#' }, { n: 'D',  p: 'Ré' },
      { n: 'D#', p: 'Ré#' }, { n: 'E',  p: 'Mi' },  { n: 'F',  p: 'Fá' },
      { n: 'F#', p: 'Fá#' }, { n: 'G',  p: 'Sol' }, { n: 'G#', p: 'Sol#' },
      { n: 'A',  p: 'Lá' },  { n: 'A#', p: 'Lá#' }, { n: 'B',  p: 'Si' }
    ];
    noteNames.forEach(({ n, p }) => {
      const card = document.createElement('div');
      card.className = 'chord-card';
      card.innerHTML = `<div class="chord-name">${n}</div><div style="font-size:11px;color:#9ca3c4;margin-top:2px">${p}</div>`;
      grid.appendChild(card);
    });
  },

  renderChords() {
    const grid = document.getElementById('chordsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const main = ['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'F', 'G7'];
    main.forEach(c => {
      if (!CHORDS[c]) return;
      const card = document.createElement('div');
      card.className = 'chord-card';
      card.innerHTML = `<div class="chord-name">${c}</div><div style="font-size:10px;color:#9ca3c4;margin-top:2px">${CHORDS[c].name}</div>`;
      card.onclick = () => this.showChordDiagram(c);
      grid.appendChild(card);
    });
  },

  renderScales() {
    const grid = document.getElementById('scalesGrid');
    if (!grid) return;
    // Escala de Dó Maior no braço (1ª posição, trastes 0-4)
    const strings = ['E', 'B', 'G', 'D', 'A', 'E']; // 1ª a 6ª
    const scaleCMaj = [
      // [corda, traste, nota, root?]
      [6, 0, 'E', false], [6, 2, 'F#', false], [6, 3, 'G', false],
      [5, 0, 'A', false], [5, 2, 'B', false], [5, 3, 'C', true],
      [4, 0, 'D', false], [4, 2, 'E', false], [4, 3, 'F', false],
      [3, 0, 'G', false], [3, 2, 'A', false], [3, 4, 'B', false],
      [2, 1, 'C', true], [2, 3, 'D', false],
      [1, 0, 'E', false], [1, 3, 'G', false]
    ];
    let html = '<h4>Escala de Dó Maior (1ª posição)</h4><div class="fretboard">';
    strings.forEach((sName, idx) => {
      const stringNum = idx + 1;
      html += `<div class="fret-string">
        <div class="string-label">${sName}</div>
        <div class="fret-cells">`;
      for (let fret = 0; fret <= 5; fret++) {
        const note = scaleCMaj.find(([c, f]) => c === stringNum && f === fret);
        const cls = note ? (note[3] ? 'has-note root' : 'has-note') : '';
        const txt = note ? note[2] : '';
        const first = fret === 0 ? 'first' : '';
        html += `<div class="fret-cell ${first} ${cls}">${txt}</div>`;
      }
      html += '</div></div>';
    });
    html += '</div>';
    grid.innerHTML = html;
  },

  renderProgressions() {
    const grid = document.getElementById('progressionGrid');
    if (!grid) return;
    const progressions = [
      { name: 'I - V - vi - IV (em C)', prog: 'C - G - Am - F' },
      { name: 'I - vi - IV - V (em G)', prog: 'G - Em - C - D' },
      { name: 'ii - V - I (em C)', prog: 'Dm - G7 - C' },
      { name: 'I - IV - V (em D)', prog: 'D - G - A' }
    ];
    let html = '';
    progressions.forEach(p => {
      html += `<div style="background:#0f1729;padding:12px;border-radius:8px;margin-bottom:8px">
        <strong style="color:#f4a261">${p.name}</strong><br>
        <span style="font-family:monospace;font-size:16px">${p.prog}</span>
      </div>`;
    });
    grid.innerHTML = html;
  },

  // Diagrama de acorde (SVG)
  showChordDiagram(chordName) {
    const chord = CHORDS[chordName];
    if (!chord) return;
    const modal = document.getElementById('chordModal');
    document.getElementById('chordTitle').textContent = `${chordName} - ${chord.name}`;
    const diagram = document.getElementById('chordDiagram');
    const info = document.getElementById('chordInfo');

    // Construir SVG do diagrama
    const numStrings = 6;
    const numFrets = 4;
    const fretWidth = 35;
    const stringSpacing = fretWidth;
    const padTop = 40, padLeft = 30;
    const totalW = padLeft + stringSpacing * (numStrings - 1) + 30;
    const totalH = padTop + 30 + numFrets * 30 + 30;

    let svg = `<svg viewBox="0 0 ${totalW} ${totalH}" style="width:100%;height:auto;max-width:240px;display:block;margin:0 auto">`;
    // Trastes (linhas horizontais)
    for (let f = 0; f <= numFrets; f++) {
      const y = padTop + 30 + f * 30;
      svg += `<line x1="${padLeft}" y1="${y}" x2="${padLeft + stringSpacing * 5}" y2="${y}" stroke="#9ca3c4" stroke-width="${f === 0 ? 5 : 1}"/>`;
    }
    // Cordas (linhas verticais)
    for (let s = 0; s < numStrings; s++) {
      const x = padLeft + s * stringSpacing;
      svg += `<line x1="${x}" y1="${padTop + 30}" x2="${x}" y2="${padTop + 30 + numFrets * 30}" stroke="#9ca3c4" stroke-width="1"/>`;
    }
    // Marcação de pestana
    if (chord.barres && chord.barres.length) {
      chord.barres.forEach(barreFret => {
        const y = padTop + 30 + (barreFret - 0.5) * 30;
        svg += `<rect x="${padLeft}" y="${y - 6}" width="${stringSpacing * 5}" height="12" fill="#2a9d8f" rx="6"/>`;
        svg += `<text x="${padLeft + stringSpacing * 2.5}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#1a1a2e">1</text>`;
      });
    }
    // Notas
    const fingerNames = ['Polegar', 'Indicador', 'Médio', 'Anelar', 'Mínimo'];
    const stringLabels = ['E', 'A', 'D', 'G', 'B', 'E']; // 6ª, 5ª, 4ª, 3ª, 2ª, 1ª
    // chord.frets: índice 0 = 6ª corda (mais grave)
    for (let s = 0; s < numStrings; s++) {
      const stringNum = 6 - s; // 6,5,4,3,2,1
      const fret = chord.frets[s];
      const finger = chord.fingers ? chord.fingers[s] : 0;
      const x = padLeft + s * stringSpacing;
      if (fret === 0) {
        // Corda solta - bolinha aberta
        svg += `<circle cx="${x}" cy="${padTop + 12}" r="7" fill="none" stroke="#f4a261" stroke-width="2"/>`;
      } else if (fret === 'x') {
        // Não tocar
        svg += `<text x="${x}" y="${padTop + 18}" text-anchor="middle" font-size="14" fill="#e76f51" font-weight="bold">×</text>`;
      } else {
        // Nota pressionada
        const y = padTop + 30 + (fret - 0.5) * 30;
        // Não desenhar bolinha se já existe pestano
        const isBarre = chord.barres && chord.barres.includes(fret);
        if (!isBarre) {
          svg += `<circle cx="${x}" cy="${y}" r="11" fill="#f4a261"/>`;
          if (finger) svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1a2e">${finger}</text>`;
        }
      }
    }
    // Labels das cordas no topo
    for (let s = 0; s < numStrings; s++) {
      const x = padLeft + s * stringSpacing;
      const stringLabel = stringLabels[s];
      const fret = chord.frets[s];
      const color = fret === 'x' ? '#e76f51' : (fret === 0 ? '#06d6a0' : '#9ca3c4');
      svg += `<text x="${x}" y="${padTop - 10}" text-anchor="middle" font-size="13" font-weight="bold" fill="${color}">${stringLabel}</text>`;
    }
    svg += '</svg>';
    diagram.innerHTML = svg;

    // Info: dedos usados
    let infoHtml = '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px;font-size:13px">';
    const usedFingers = [...new Set(chord.fingers.filter(f => f > 0))].sort();
    usedFingers.forEach(f => {
      infoHtml += `<span class="badge">${f} = ${fingerNames[f - 1]}</span>`;
    });
    infoHtml += '</div>';
    info.innerHTML = infoHtml;

    modal.hidden = false;
  },

  /**
   * Monta os botões de tópicos a partir do conteúdo atual (inclui os
   * tópicos novos criados no admin). Esconde tópicos de outro nível.
   */
  renderTabs(manterAtivo = true) {
    const wrap = document.querySelector('.theory-tabs');
    if (!wrap) return;
    const fonte = (typeof THEORY_CONTENT !== 'undefined' ? THEORY_CONTENT : window.THEORY_CONTENT) || {};
    const nivelAluno = window.SONARE_NIVEL || null;
    const ORDEM = ['notes', 'chords', 'scales', 'chordProgressions', 'chordReading', 'tab'];
    const chaves = Object.keys(fonte)
      .filter(k => fonte[k] && (!fonte[k].nivel || !nivelAluno || fonte[k].nivel === nivelAluno))
      .sort((a, b) => {
        const ia = ORDEM.indexOf(a), ib = ORDEM.indexOf(b);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        return String(fonte[a].title || a).localeCompare(String(fonte[b].title || b));
      });

    const ativoAntes = manterAtivo ? wrap.querySelector('.theory-tab.active')?.dataset.topic : null;
    const ativo = chaves.includes(ativoAntes) ? ativoAntes : chaves[0];

    wrap.innerHTML = '';
    for (const k of chaves) {
      const b = document.createElement('button');
      b.className = 'theory-tab' + (k === ativo ? ' active' : '');
      b.dataset.topic = k;
      b.textContent = fonte[k].title || k;
      b.addEventListener('click', () => {
        wrap.querySelectorAll('.theory-tab').forEach(t => t.classList.remove('active'));
        b.classList.add('active');
        this.showTabContent(k);
      });
      wrap.appendChild(b);
    }
    if (ativo) this.showTabContent(ativo);
    else document.getElementById('theoryContent').innerHTML = '<p class="muted">Nenhum tópico de teoria no seu nível ainda.</p>';
  },

  showTabContent(topic) {
    const content = document.getElementById('theoryContent');
    const fonteTeoria = (typeof THEORY_CONTENT !== 'undefined' ? THEORY_CONTENT : (window.THEORY_CONTENT || (window.SonareConteudo && window.SonareConteudo.teoria) || {}));
    const t = fonteTeoria[topic];
    if (!t) return;
    content.innerHTML = `<h2 style="color:#f4a261;margin-bottom:16px">${escHTML(t.title)}</h2>${limparHTML(t.html)}`;
    // Pós-renders
    if (topic === 'notes') this.renderNotes();
    if (topic === 'chords') this.renderChords();
    if (topic === 'scales') this.renderScales();
    if (topic === 'chordProgressions') this.renderProgressions();
  }
};

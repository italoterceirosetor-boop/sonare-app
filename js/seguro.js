/* ============================================================
   SONARE — Proteção ao mostrar textos vindos do banco
   - escHTML(texto): mostra como texto puro (sem virar HTML)
   - limparHTML(html): mantém a formatação do editor do admin
     (negrito, títulos, listas, links...) e remove scripts,
     eventos (onclick, onerror...) e links "javascript:".
============================================================ */
(function () {
  function escHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const TAGS_OK = new Set([
    'A', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'P', 'BR', 'HR', 'DIV', 'SPAN',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
    'PRE', 'CODE', 'SMALL', 'SUB', 'SUP', 'MARK',
    'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'IMG', 'FIGURE', 'FIGCAPTION',
  ]);
  // 'id' é usado pela teoria (ex.: grade de notas/acordes desenhada depois)
  const ATTRS_OK = new Set(['id', 'href', 'src', 'alt', 'title', 'class', 'style', 'colspan', 'rowspan', 'target', 'rel', 'width', 'height']);
  const URL_OK = /^(https?:|mailto:|tel:|#|\/|\.\/|data:image\/(png|jpe?g|gif|webp);)/i;

  function limparHTML(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    const limpar = (el) => {
      for (const filho of [...el.children]) {
        if (!TAGS_OK.has(filho.tagName)) {
          // Tags perigosas somem inteiras; as desconhecidas viram só o texto
          if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|FORM|INPUT|BUTTON|TEXTAREA|SELECT|LINK|META|BASE|SVG|MATH)$/.test(filho.tagName)) {
            filho.remove();
          } else {
            filho.replaceWith(...filho.childNodes);
            limpar(el);
            return;
          }
          continue;
        }
        for (const at of [...filho.attributes]) {
          const nome = at.name.toLowerCase();
          if (!ATTRS_OK.has(nome)) { filho.removeAttribute(at.name); continue; }
          if ((nome === 'href' || nome === 'src') && !URL_OK.test(at.value.trim())) filho.removeAttribute(at.name);
          if (nome === 'style' && /expression|url\s*\(|javascript:/i.test(at.value)) filho.removeAttribute(at.name);
        }
        if (filho.tagName === 'A' && filho.getAttribute('target') === '_blank') filho.setAttribute('rel', 'noopener noreferrer');
        limpar(filho);
      }
    };
    limpar(doc.body);
    return doc.body.innerHTML;
  }

  window.escHTML = escHTML;
  window.limparHTML = limparHTML;
})();

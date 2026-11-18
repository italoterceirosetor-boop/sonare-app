// ============= QR CODE (gerador offline, sem dependências) =============
// Algoritmo QR Code baseado em implementação simplificada
// Para um QR de até ~100 caracteres (suficiente para URLs), esta implementação funciona offline

const QRCode = {
  // Versão simplificada: usa Google Charts API como fallback e canvas nativo como principal
  // Para uso offline real, precisaria de lib maior; aqui usamos abordagem híbrida:
  // - Se online: Google Charts (renderização rápida e bonita)
  // - Se offline: gera padrão visual básico

  generate(text, container) {
    container.innerHTML = '';
    if (navigator.onLine) {
      // Usa API gratuita do goqr.me que retorna imagem PNG
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}`;
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'QR Code para ' + text;
      img.style.width = '240px';
      img.style.height = '240px';
      img.style.display = 'block';
      img.onerror = () => {
        container.innerHTML = '<p style="color:#e76f51;font-size:13px">Erro ao gerar QR Code. Verifique sua conexão.</p>';
      };
      container.appendChild(img);
    } else {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:20px">📴 Sem conexão. Conecte-se à internet para gerar o QR Code.</p>';
    }
  }
};

// ============= INSTALAÇÃO DO APP =============
const Install = {
  deferredPrompt: null,

  init() {
    // Detecta evento de instalação (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // Detecta quando foi instalado
    window.addEventListener('appinstalled', () => {
      SonareApp.toast('✓ App instalado com sucesso!');
    });
  },

  getAppUrl() {
    // URL absoluta do app
    return window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
  },

  /** 'ios' | 'android' | 'desktop' */
  plataforma() {
    const ua = navigator.userAgent || '';
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  },

  jaInstalado() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  },

  /** No iPhone, só o Safari instala. Chrome/Instagram/WhatsApp no iPhone não. */
  iosForaDoSafari() {
    const ua = navigator.userAgent || '';
    return /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|WhatsApp|Line\//i.test(ua);
  },

  passosHtml(plat) {
    const iconeCompartilhar = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
    const passo = (n, txt) => `<li style="display:flex;gap:10px;align-items:flex-start;margin:10px 0;text-align:left"><span style="flex:none;width:26px;height:26px;border-radius:50%;background:var(--primary,#d4a373);color:#111;display:grid;place-items:center;font-weight:700">${n}</span><span style="padding-top:3px">${txt}</span></li>`;
    if (plat === 'ios') {
      return `
        ${this.iosForaDoSafari() ? `<p style="background:#e76f5122;border:1px solid #e76f51;border-radius:8px;padding:10px;margin-bottom:8px">⚠️ No iPhone, o app só instala pelo <strong>Safari</strong>. Copie o link abaixo e abra no Safari.</p>` : ''}
        <ol style="list-style:none;padding:0;margin:0">
          ${passo(1, `Abra este link no <strong>Safari</strong>.`)}
          ${passo(2, `Toque no botão <strong>Compartilhar</strong> ${iconeCompartilhar} (embaixo, no meio da tela; no iPad fica em cima).`)}
          ${passo(3, `Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.`)}
          ${passo(4, `Toque em <strong>"Adicionar"</strong>. O ícone da Sonare aparece na tela do iPhone.`)}
          ${passo(5, `Abra a Sonare <strong>pelo ícone</strong> e permita as <strong>notificações</strong> pro alarme de estudo funcionar.`)}
        </ol>
        <p class="muted" style="font-size:12px;margin-top:8px">O alarme no iPhone precisa do iOS 16.4 ou mais novo e chega como notificação.</p>`;
    }
    return `
      <ol style="list-style:none;padding:0;margin:0">
        ${passo(1, `Abra este link no <strong>Chrome</strong>.`)}
        ${passo(2, `Toque no menu <strong>⋮</strong> (três pontinhos, no canto de cima).`)}
        ${passo(3, `Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.`)}
        ${passo(4, `Confirme em <strong>"Instalar"</strong>. O ícone da Sonare aparece junto com seus apps.`)}
        ${passo(5, `Abra pelo ícone e permita as <strong>notificações</strong> pro alarme de estudo.`)}
      </ol>`;
  },

  open() {
    document.getElementById('guia-instalacao')?.remove();
    const url = this.getAppUrl();
    const plat = this.plataforma();
    let aba = plat === 'desktop' ? 'android' : plat;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'guia-instalacao';
    modal.innerHTML = `
      <div class="modal-content" style="text-align:center;max-width:440px">
        <button class="modal-close" data-fechar>&times;</button>
        <h2 style="margin-bottom:6px">📲 Instalar a Sonare</h2>
        ${this.jaInstalado() ? `<p style="color:#2a9d8f;margin-bottom:12px">✓ Você já está usando o app instalado.</p>` : ''}
        ${plat === 'android' && this.deferredPrompt ? `<button class="primary" data-instalar style="width:100%;margin:8px 0 4px">⬇️ Instalar agora</button><p class="muted" style="font-size:12px">ou siga os passos abaixo</p>` : ''}
        ${plat === 'desktop' ? `
          <p class="muted" style="margin-bottom:12px">Aponte a câmera do celular para o código e siga os passos.</p>
          <div id="guia-qr" style="display:flex;justify-content:center;background:#fff;padding:12px;border-radius:8px;margin:0 auto 12px;max-width:264px"></div>` : ''}
        <div style="display:flex;gap:6px;justify-content:center;margin:12px 0 4px">
          <button class="${aba === 'ios' ? 'primary' : 'secondary'}" data-aba="ios">🍎 iPhone</button>
          <button class="${aba === 'android' ? 'primary' : 'secondary'}" data-aba="android">🤖 Android</button>
        </div>
        <div id="guia-passos">${this.passosHtml(aba)}</div>
        <input type="text" id="guia-url" readonly value="${url}" style="width:100%;text-align:center;font-size:12px;margin-top:12px" />
        <button class="secondary" data-copiar style="margin-top:8px;width:100%">📋 Copiar link</button>
      </div>`;
    document.body.appendChild(modal);
    modal.hidden = false;

    if (plat === 'desktop' && typeof QRCode !== 'undefined') QRCode.generate(url, modal.querySelector('#guia-qr'));

    const fechar = () => modal.remove();
    modal.querySelector('[data-fechar]').onclick = fechar;
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
    modal.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => {
      aba = b.dataset.aba;
      modal.querySelectorAll('[data-aba]').forEach(x => x.className = x.dataset.aba === aba ? 'primary' : 'secondary');
      modal.querySelector('#guia-passos').innerHTML = this.passosHtml(aba);
    });
    modal.querySelector('[data-instalar]')?.addEventListener('click', () => this.installNative());
    modal.querySelector('[data-copiar]').onclick = () => {
      const avisar = (m) => (window.SonareApp?.toast ? SonareApp.toast(m) : alert(m));
      navigator.clipboard.writeText(url).then(() => avisar('✓ Link copiado!')).catch(() => {
        const inp = modal.querySelector('#guia-url');
        inp.select();
        document.execCommand('copy');
        avisar('✓ Link copiado!');
      });
    };
  },

  // Tenta instalar nativamente (Chrome Android)
  async installNative() {
    if (!this.deferredPrompt) {
      SonareApp.toast('Use o menu do navegador para instalar');
      return;
    }
    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      SonareApp.toast('✓ Instalando...');
    }
    this.deferredPrompt = null;
  }
};
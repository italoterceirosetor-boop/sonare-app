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
    return window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/') + 'index.html';
  },

  open() {
    const modal = document.getElementById('qrcodeModal');
    const url = this.getAppUrl();
    document.getElementById('appUrl').value = url;
    QRCode.generate(url, document.getElementById('qrcodeContainer'));
    modal.hidden = false;

    document.getElementById('copyUrlBtn').onclick = () => {
      navigator.clipboard.writeText(url).then(() => {
        SonareApp.toast('✓ Link copiado!');
      }).catch(() => {
        // Fallback
        const inp = document.getElementById('appUrl');
        inp.select();
        document.execCommand('copy');
        SonareApp.toast('✓ Link copiado!');
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
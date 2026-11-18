# Sonare App — PWA

App da **Escola de Música Sonare** (Pimenta Bueno / RO). PWA instalável, roda
offline, com painel admin pra cadastrar aulas e alarme de estudo pro aluno.

- App do aluno: `./index.html`
- Painel admin: `./admin.html`

## Como funciona

| Peça | Onde mora | Como atualiza |
|---|---|---|
| Conteúdo das aulas | `IndexedDB` no dispositivo do aluno | Admin exporta JSON, aluno importa pelo app |
| Cadastro de alunos e geração de código | `IndexedDB` no dispositivo do admin | Mesmo dispositivo (exportar não inclui alunos — é local) |
| Lembrete de estudo | `IndexedDB` (config) + `Notification API` + overlay full-screen | Aluno configura no próprio app |
| Cache offline | `service worker` (`sw.js`) — estratégia cache-first | Cache invalidado automaticamente quando `CACHE_VERSION` mudar |

## Testar localmente (sem instalar)

```bash
cd sonare-app
python -m http.server 8080
```

Abra `http://localhost:8080` no Chrome desktop pra testar. Para testar no
celular pela rede local, descubra o IP do PC (`ipconfig`) e abra
`http://SEU-IP:8080` no navegador do celular.

> Service worker só funciona em `http://localhost` ou `https`. Não funciona
> abrindo o arquivo direto (`file://`).

## Códigos de aluno

Os alunos são cadastrados no painel admin (aba **Alunos**), que gera códigos
no formato `XXXX-NNNN` e grava no Firebase. O aluno digita o código no app; o
servidor confere (índice `/codigos`) sem expor a lista de alunos.

O professor entra no admin com a conta Google (ou e-mail/senha) e precisa estar
liberado em `/admins/{uid}` no Realtime Database. As regras de acesso ficam em
`database.rules.json` — cole no console do Firebase (Realtime Database → Regras)
sempre que mudar.

## Conteúdo de exemplo

O `data/seed.json` carrega automaticamente no primeiro acesso do aluno e
contém:

- 1 vídeo-aula (acordes essenciais)
- 1 áudio (exercício de ritmo)
- 1 aula em texto (leitura de cifras)

As URLs de mídia apontam pra arquivos públicos do W3C/SoundJay — funcionam
pra demo, mas para uso real, hospede os vídeos/áudios em algum lugar
(Google Drive com link direto, Vimeo, S3, etc.) e cole a URL no admin.

## Painel admin

Três abas:

1. **Aulas** — cadastra vídeo, áudio, PDF ou texto. Cada aula tem
   instrumento, professor (Leonel, Lucas, Gesiel), descrição e ordem.
2. **Alunos** — cadastra aluno, gera código único `XXXX-NNNN`, permite
   revogar e copiar o código pra mandar no WhatsApp.
3. **Dados** — exporta `aulas.json` (pra mandar pros alunos importarem),
   importa JSON de outro dispositivo, e tem botão de "apagar tudo".

## Alarme de estudo

Quando chega no horário configurado (default 19:00, dias úteis), o app:

1. Se está aberto → toma a tela inteira com overlay, toca som em loop,
   vibra, exige confirmação ("Confirmar que vou estudar"). Som continua até
   o aluno apertar.
2. Se está em background → dispara notificação do sistema com vibração
   e `requireInteraction: true`. Clicar na notificação abre o overlay.
3. Depois de confirmado, há cooldown de 5 minutos antes de re-disparar.

> **Importante:** em PWA o alarme só dispara se o dispositivo estiver
> ligado e o navegador não foi morto pelo sistema. Ao empacotar como APK
> via PWABuilder, dá pra configurar pra iniciar junto com o sistema e
> sobreviver melhor.

## Empacotar como APK pra Android

### Caminho 1 — PWABuilder (mais fácil, recomendado)

1. Suba o conteúdo desta pasta em algum hosting HTTPS:
   - **GitHub Pages** (grátis): crie um repo, commit desta pasta, ative Pages
   - **Netlify** (grátis): arraste a pasta em https://app.netlify.com/drop
   - **Vercel** (grátis): `npx vercel` na pasta

   Anote a URL, ex.: `https://seuuser.github.io/sonare-app/`

2. Abra https://www.pwabuilder.com e cole a URL.

3. Clique em **Package For Stores → Android**.

4. Configure:
   - Package ID: `br.com.sonare.app` (ou outro domínio seu)
   - App version: `1.0.0`
   - Display: `standalone`

5. Baixe o **Signed APK** (PWABuilder assina com chave própria — só pra
   sideload/instalação direta, **não serve pra Play Store**).

6. Transfira o `.apk` pro celular Android, abra, habilite "instalar de
   fontes desconhecidas" pro Chrome/navegador, instale.

### Caminho 2 — Bubblewrap (controle total, chave de assinatura sua)

```bash
npm i -g @bubblewrap/cli
```

Roda local, gera `.aab` que pode ser publicado na Play Store (precisa de
conta Google Play Developer, US$ 25 uma vez).

Documentação: https://github.com/GoogleChromeLabs/bubblewrap

### iOS

iOS aceita PWAs, mas tem limitações (Service Worker restrito, sem
notificação full-screen, sem fullscreen API). O app abre e roda offline,
mas o alarme fica limitado às notificações comuns do Safari.

## Estrutura de arquivos

```
sonare-app/
├── index.html          # app do aluno
├── admin.html          # painel admin
├── manifest.webmanifest
├── sw.js               # service worker
├── README.md
├── css/styles.css      # reaproveita paleta do site institucional
├── js/
│   ├── app.js          # aluno: login, home, detalhe
│   ├── admin.js        # admin: CRUD
│   ├── alarm.js        # alarme full-screen
│   └── db.js           # wrapper IndexedDB
├── data/seed.json      # aulas e alunos-exemplo (carrega no 1º acesso)
└── assets/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png
    └── _gerar_icones.py   # script pra regenerar ícones se mudar a paleta
```

## O que não dá pra ser 100% à prova de bala

O pedido era "alarme que o aluno não consiga remover". **Em celular isso
não existe** — o sistema operacional sempre dá ao usuário uma forma de
matar o app e cancelar permissões. O que esse app garante:

- ✅ Alarme toma a tela inteira com som + vibração até o aluno confirmar
- ✅ Confirmação é obrigatória (não tem como fechar overlay sem apertar botão)
- ✅ Notificação persistente (`requireInteraction: true`) quando em background
- ✅ Cooldown de 5 min após confirmar pra não floodar

Mas o aluno sempre pode: matar o app, desinstalar, desativar notificações do
app nas configurações do sistema. **Isso é por design do Android/iOS**, e
fingir que dá pra burlar seria prometer algo que não cumpre.

## Próximos passos (depois que validar)

- Trocar URLs de mídia no `seed.json` por conteúdo real da Sonare
- Hospedar o PWA (GitHub Pages é o mais simples)
- Gerar APK via PWABuilder
- Instalar em 1-2 celulares de teste
- Validar alarme em horário real (não só simulação)
- Quando sentir necessidade → migrar conteúdo pra Firebase pra admin
  atualizar e aluno sincronizar sem precisar exportar/importar JSON

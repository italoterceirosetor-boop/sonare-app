// ============= DADOS DO APLICATIVO =============

// Acordes com diagramas (posições no braço: [corda, traste, dedo])
// cordas: 1-6 (1=Mi agudo, 6=Mi grave). 0 = corda solta, x = não tocar
const CHORDS = {
  'C':  { frets: [0, 1, 0, 2, 3, 'x'], fingers: [0, 1, 0, 2, 3, 0], barres: [], name: 'Dó Maior' },
  'D':  { frets: ['x','x',0,2,3,2], fingers: [0,0,0,1,3,2], barres: [], name: 'Ré Maior' },
  'E':  { frets: [0,2,2,1,0,0], fingers: [0,2,3,1,0,0], barres: [], name: 'Mi Maior' },
  'F':  { frets: [1,3,3,2,1,1], fingers: [1,3,4,2,1,1], barres: [1], name: 'Fá Maior' },
  'G':  { frets: [3,2,0,0,0,3], fingers: [2,1,0,0,0,3], barres: [], name: 'Sol Maior' },
  'A':  { frets: ['x',0,2,2,2,0], fingers: [0,0,1,2,3,0], barres: [], name: 'Lá Maior' },
  'B':  { frets: ['x',2,4,4,4,2], fingers: [0,1,3,4,2,1], barres: [2], name: 'Si Maior' },
  'Am': { frets: ['x',0,2,2,1,0], fingers: [0,0,2,3,1,0], barres: [], name: 'Lá Menor' },
  'Dm': { frets: ['x','x',0,2,3,1], fingers: [0,0,0,2,3,1], barres: [], name: 'Ré Menor' },
  'Em': { frets: [0,2,2,0,0,0], fingers: [0,2,3,0,0,0], barres: [], name: 'Mi Menor' },
  'Bm': { frets: ['x',2,4,4,3,2], fingers: [0,1,3,4,2,1], barres: [2], name: 'Si Menor' },
  'Fm': { frets: [1,3,3,1,1,1], fingers: [1,3,4,1,1,1], barres: [1], name: 'Fá Menor' },
  'Cm': { frets: ['x',3,5,5,4,3], fingers: [0,1,3,4,2,1], barres: [3], name: 'Dó Menor' },
  'Gm': { frets: [3,5,5,3,3,3], fingers: [1,3,4,1,1,1], barres: [3], name: 'Sol Menor' },
  'D7': { frets: ['x','x',0,2,1,2], fingers: [0,0,0,2,1,3], barres: [], name: 'Ré com 7ª' },
  'G7': { frets: [3,2,0,0,0,1], fingers: [3,2,0,0,0,1], barres: [], name: 'Sol com 7ª' },
  'C7': { frets: [0,1,3,2,3,1], fingers: [0,1,3,2,4,1], barres: [], name: 'Dó com 7ª' },
  'A7': { frets: ['x',0,2,0,2,0], fingers: [0,0,1,0,2,0], barres: [], name: 'Lá com 7ª' },
  'E7': { frets: [0,2,0,1,0,0], fingers: [0,2,0,1,0,0], barres: [], name: 'Mi com 7ª' },
  'B7': { frets: ['x',2,1,2,0,2], fingers: [0,2,1,3,0,4], barres: [], name: 'Si com 7ª' },
  'F7': { frets: [1,3,1,2,1,1], fingers: [1,3,1,2,1,1], barres: [1], name: 'Fá com 7ª' },
  'Em7': { frets: [0,2,0,0,0,0], fingers: [0,1,0,0,0,0], barres: [], name: 'Mi menor com 7ª' },
  'Am7': { frets: ['x',0,2,0,1,0], fingers: [0,0,1,0,2,0], barres: [], name: 'Lá menor com 7ª' },
  'Dm7': { frets: ['x','x',0,2,1,1], fingers: [0,0,0,2,1,1], barres: [], name: 'Ré menor com 7ª' },
  'G7M':{ frets: [3,2,0,0,0,2], fingers: [3,2,0,0,0,1], barres: [], name: 'Sol Maior com 7ª' },
  'C7M':{ frets: [0,1,0,2,3,'x'], fingers: [0,1,0,2,3,0], barres: [], name: 'Dó Maior com 7ª' },
  'Dsus4':{frets:['x','x',0,2,3,3],fingers:[0,0,0,1,2,3],barres:[],name:'Ré sus4'},
  'Asus2':{frets:['x',0,2,2,0,0],fingers:[0,0,1,2,0,0],barres:[],name:'Lá sus2'},
  'Esus4':{frets:[0,2,2,2,0,0],fingers:[0,1,2,3,0,0],barres:[],name:'Mi sus4'},
};

// Notas musicais com suas frequências em Hz
const NOTE_FREQUENCIES = [
  { note: 'C',  name: 'Dó',   octave: 0, freq: 16.35 },
  { note: 'C#', name: 'Dó#',  octave: 0, freq: 17.32 },
  { note: 'D',  name: 'Ré',   octave: 0, freq: 18.35 },
  { note: 'D#', name: 'Ré#',  octave: 0, freq: 19.45 },
  { note: 'E',  name: 'Mi',   octave: 0, freq: 20.60 },
  { note: 'F',  name: 'Fá',   octave: 0, freq: 21.83 },
  { note: 'F#', name: 'Fá#',  octave: 0, freq: 23.12 },
  { note: 'G',  name: 'Sol',  octave: 0, freq: 24.50 },
  { note: 'G#', name: 'Sol#', octave: 0, freq: 25.96 },
  { note: 'A',  name: 'Lá',   octave: 0, freq: 27.50 },
  { note: 'A#', name: 'Lá#',  octave: 0, freq: 29.14 },
  { note: 'B',  name: 'Si',   octave: 0, freq: 30.87 },
];

// Todas as notas em todas as oitavas
const ALL_NOTES = [];
for (let oct = 0; oct < 9; oct++) {
  for (const n of NOTE_FREQUENCIES) {
    ALL_NOTES.push({
      note: n.note,
      name: n.name,
      octave: oct,
      freq: n.freq * Math.pow(2, oct)
    });
  }
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ============= BIBLIOTECA DE MÚSICAS =============
var SONGS_LIBRARY = [
  {
    id: 's1', title: 'Casa no Campo', artist: 'Zezé Di Camargo & Luciano',
    category: 'sertanejo', key: 'G', bpm: 110,
    lyrics: `[Intro] G  C  G  D

[Verso 1]
G                    C
Eu quero uma casa no campo
          G                D
Do tamanho ideal, pra paz que eu quero
G                       C
Um pomar, uma horta um lugar
          G         D      G
Pra plantar o que se comer

[Refrão]
C            G
Casa no campo
D              G
Lar doce lar
C            G
Casa no campo
D              G
Lar doce lar

[Verso 2]
G                       C
Eu quero um cavalo que ouça
           G               D
O meu cantar, o meu assobio
G                    C
Que leve eu pra onde eu quiser
            G       D       G
E que volte quando eu pedir`
  },
  {
    id: 's2', title: 'Trem-Bala', artist: 'Ana Vilela',
    category: 'mpb', key: 'G', bpm: 95,
    lyrics: `[Intro] G  D  Em  C

[Verso 1]
G               D
Não é sobre ter
            Em         C
Tudo no seu lugar
G            D
É sobre saber
        Em         C
Se tem alguém pra te ouvir

[Refrão]
G                D
Trem-bala, segue em frente
            Em            C
Sem olhar pra trás
G                  D
A vida é assim
              Em        C
Um dia vai, outro vem

[Verso 2]
G                D
Não é sobre ser
           Em           C
O melhor de todos
G            D
É sobre ser
        Em         C
Aquele que faz o bem`
  },
  {
    id: 's3', title: 'Asa Branca', artist: 'Luiz Gonzaga',
    category: 'popular', key: 'G', bpm: 120,
    lyrics: `[Intro] G  C  G  D  G

[Verso 1]
G
Quando olhei a terra ardendo
            C
Qual fogueira de São João
G
Eu perguntei a Deus do céu, ai
            D           G
Por que tamanha judiação

[Refrão]
G
Asa branca, asa branca
         C
Leva eu pra casa
G
Leva eu pra casa
            D          G
Leva eu pra casa, meu bem

[Verso 2]
G
Se我没有 mais a tua presença
            C
Meu lugá já não tem mais graça
G
Por isso eu faço essa viagem
            D           G
Pra te ver, minha cabocla`
  },
  {
    id: 's4', title: 'Eu Sei Que Vou Te Amar', artist: 'Tom Jobim',
    category: 'bossa', key: 'D', bpm: 90,
    lyrics: `[Intro] Dm  G7  C  F

[Verso 1]
Dm                    G7
Eu sei que vou te amar
                C
Por toda a minha vida eu vou te amar
Dm                    G7
Em cada despedida eu vou te amar
                C
Por toda a minha vida

[Refrão]
F                  G7
Amor, prazer e dor
            C
Tudo isso me dás
F               G7
E assim será
            C
Por toda a minha vida`
  },
  {
    id: 's5', title: 'Stand By Me', artist: 'Ben E. King',
    category: 'rock', key: 'C', bpm: 100,
    lyrics: `[Intro] C  Am  C  Am

[Verso 1]
C                    Am
When the night has come
           C                Am
And the land is dark
        C                G
And the moon is the only
            F       G
Light we'll see

[Refrão]
C       G
No, I won't be afraid
Am        Em
No, I won't shed a tear
F                G
Just as long as you stand
C
Stand by me

[Verso 2]
C                    Am
So darlin, darlin
       C
Stand by me
        Am
Oh, stand by me
       C
Stand by me
       G
Stand by me`
  },
  {
    id: 's6', title: 'Amazing Grace', artist: 'Tradicional',
    category: 'gospel', key: 'G', bpm: 80,
    lyrics: `[Intro] G  C  G  D  G

[Verso 1]
G
Amazing grace
        C
How sweet the sound
        G         D
That saved a wretch
            G
Like me

[Refrão]
G
I once was lost
        C
But now am found
        G         D        G
Was blind but now I see

[Verso 2]
G
'Twas grace that taught
        C
My heart to fear
        G         D
And grace my
            G
Fears relieved`
  },
  {
    id: 's7', title: 'Atirei o Pau no Gato', artist: 'Infantil',
    category: 'infantil', key: 'C', bpm: 130,
    lyrics: `[Intro] C  F  C  G

[Verso 1]
C
Atirei o pau no gato
F
Mas o gato não morreu
C
Dona Chica assustou-se
G                C
Com o berro que o gato deu

[Refrão]
C
Miau, miau, miau
F
Miau, miau, miau
C
Dona Chica assustou-se
G                C
Com o berro que o gato deu`
  },
  {
    id: 's8', title: 'Garota de Ipanema', artist: 'Tom Jobim',
    category: 'bossa', key: 'F', bpm: 130,
    lyrics: `[Intro] F  G7  Am  G

[Verso 1]
F            G7
Olha que coisa mais linda
            Am             G
Mais cheia de graça
F               G7
É ela, menina, que vem e que passa
        Am             G
Num doce balanço, a caminho do mar

[Refrão]
F          G7
Moça do corpo dourado
        Am        G
Do sol de Ipanema
F          G7
O seu balançado é mais que um poema
        Am        G
É a coisa mais linda que eu jamais vi`
  },
  {
    id: 's9', title: 'Sina', artist: 'Djavan',
    category: 'mpb', key: 'C', bpm: 95,
    lyrics: `[Intro] C  Am  Dm  G7

[Verso 1]
C                    Am
É, sina de não ser nada
        Dm        G7
Sem teu amor
C                  Am
Tudo vira cinza e nada
        Dm         G7
Fica com sabor

[Refrão]
C              G7
Volta, meu amor
        Am          G
Volta pra mim
F               G
Não vás embora assim`
  },
  {
    id: 's10', title: 'Knockin\' on Heaven\'s Door', artist: 'Bob Dylan',
    category: 'rock', key: 'G', bpm: 80,
    lyrics: `[Intro] G  D  C  G

[Verso 1]
G                D
Mama take this badge
            C           G
Off of me
G                  D
I can't use it anymore
         C                G
It's getting dark, too dark to see
          D
Feels like I'm
        C        G
Knockin' on heaven's door

[Refrão]
G
Knock, knock, knockin'
D
On heaven's door
C
Knock, knock, knockin'
G
On heaven's door`
  },
  // ============ GOSPEL / EVANGÉLICAS ============
  {
    id: 'g1', title: 'Tua Graça Me Basta', artist: 'Diante do Trono',
    category: 'gospel', key: 'C', bpm: 75,
    lyrics: `[Intro] C  Am  F  G

[Verso 1]
C                 Am
Tua graça me basta
              F           G
O Teu amor é tudo que eu preciso
C              Am
Em Tua presença
            F              G
Encontro a paz que o mundo não dá

[Refrão]
C               G
Tua graça me basta
Am                F
Tua graça me basta
C                G
Em todo momento
F            C
Tua graça me basta

[Verso 2]
C              Am
Quando estou fraco
              F            G
És a minha força e o meu sustento
C              Am
Em meio à fraqueza
          F          G
O Teu poder se faz completo`
  },
  {
    id: 'g2', title: 'Dias de Elias', artist: 'Luciano Camargo',
    category: 'gospel', key: 'E', bpm: 130,
    lyrics: `[Intro] E  B  C#m  A

[Verso 1]
E
Esses são dias de Elias
B
Pra quem conhece o Deus de Israel
C#m
Dias de culto e oração
A
Pra quem não tem medo de ser usado

[Refrão]
E
Os dias de Elias
B
Estão chegando
C#m
Pra quem clama o nome do Senhor
A
Os céus se abrirão
E
E a chuva há de cair
B
Sobre a tua vida
C#m           A
Sobre a tua casa
E
E sobre tudo o que é teu`
  },
  {
    id: 'g3', title: 'Jeová Jireh', artist: 'Aline Barros',
    category: 'gospel', key: 'A', bpm: 80,
    lyrics: `[Intro] A  E  F#m  D

[Verso 1]
A
Jeová Jiré
            E
O meu provedor
F#m
Tens o que eu preciso
         D
No Teu grande amor
A
Jeová Jiré
            E
O meu provedor
F#m
Tens o que eu preciso
         D
No Teu grande amor

[Refrão]
A                E
Quem dEle se aproxima
F#m            D
Não sai frustrado
A                E
Quem dEle se aproxima
F#m            D
Não sai de mãos vazias
A                E
Quem dEle se aproxima
F#m            D
Não sai frustrado
A                E
Quem dEle se aproxima
F#m            D
Não sai frustrado`
  },
  {
    id: 'g4', title: 'Digno É', artist: 'Vineyard',
    category: 'gospel', key: 'C', bpm: 70,
    lyrics: `[Intro] C  Am  F  G

[Verso 1]
C                Am
Digno é o Cordeiro
F               G
Que foi morto
C              Am
De receber o poder
F                G
E a riqueza, a sabedoria
C            Am
A força e a honra
F            G
A glória e o louvor

[Refrão]
C        F
Digno, digno, digno
G              C
É o Cordeiro de Deus
C        F
Digno, digno, digno
G              C
É o Cordeiro de Deus

[Verso 2]
C                Am
Ao que está assentado
F               G
No trono
C                Am
E ao Cordeiro
F            G
Seja o louvor`
  },
  {
    id: 'g5', title: 'Porque Ele Vive', artist: 'Harpa Cristã',
    category: 'gospel', key: 'G', bpm: 90,
    lyrics: `[Intro] G  C  G  D

[Verso 1]
G                    C
Deus enviou seu Filho amado
              G             D
Pra me salvar da condenação
G               C
Jesus, o Cristo, o Ungido
            G        D        G
Pôr-se em meu lugar no Calvário

[Refrão]
G
Porque Ele vive, posso crer no amanhã
C
Porque Ele vive, temor não há
G                D
Mas eu não sei, não sei a razão
G      C      G
De tanto amor, de tanto amor

[Verso 2]
G                   C
Deus enviou seu Filho amado
             G              D
E pela fé eu O recebi
G                C
E de Sua morte recebi a vida
           G       D        G
E com Jesus eu vou ressurgir`
  },
  {
    id: 'g6', title: 'Grandioso És Tu', artist: 'Harpa Cristã',
    category: 'gospel', key: 'D', bpm: 85,
    lyrics: `[Intro] D  A  Bm  G

[Verso 1]
D
Senhor meu Deus, quando eu
A
Maravilhado olho a criação
Bm
E vejo o céu, as estrelas
G
E a terra onde habitei

[Refrão]
D
Quão grande és Tu
A
Quão grande és Tu
Bm
Quão grande és Tu
G
Quão grande és Tu

[Verso 2]
D
Quando eu caminho pelos
A
Vales verdes e floridos
Bm
Ouço as aves mil cantando
G
E a brisa suave a sussurrar

[Verso 3]
D
E quando penso que Jesus
A
Morreu por mim no Calvário
Bm
E vive agora, vive eternamente
G
Pra me levar ao Seu lar`
  },
  {
    id: 'g7', title: 'Alvo Mais Que a Neve', artist: 'Harpa Cristã',
    category: 'gospel', key: 'F', bpm: 90,
    lyrics: `[Intro] F  C  Dm  Bb

[Verso 1]
F          C
Mais branco que a neve
Dm         Bb
Mais branco que a neve
F          C
Tu me lavarás
Bb           C
E mais branco me farás

[Refrão]
F          C
Alvo mais que a neve
Dm         Bb
Alvo mais que a neve
F          C
Tu me lavarás
Bb        C      F
E mais branco me farás

[Verso 2]
F          C
Mais puro que o lírio
Dm         Bb
Mais puro que o lírio
F          C
Tu me farás
Bb           C
Mais puro me farás`
  },
  {
    id: 'g8', title: 'Vencendo Vem Jesus', artist: 'Harpa Cristã',
    category: 'gospel', key: 'G', bpm: 100,
    lyrics: `[Intro] G  D  C  G

[Verso 1]
G
Vencendo vem Jesus
D
O Rei da glória
C                  G
O Capitão das hostes
D         G
É o Senhor

[Refrão]
G
Vencendo vem Jesus
D
Com Seu poder
C
A morte venceu
G
E vivo está

[Verso 2]
G
Os santos e os anjos
D
A voz levantam
C
Ao Rei dos reis
G
D       G
Hosana cantam`
  },
  {
    id: 'g9', title: 'Teus Sonhos', artist: 'Eliã Oliveira',
    category: 'gospel', key: 'A', bpm: 95,
    lyrics: `[Intro] A  E  F#m  D

[Verso 1]
A            E
Não deixe os seus sonhos
F#m           D
Morrerem no coração
A            E
Não deixe o desânimo
F#m           D
Tirar a sua fé

[Refrão]
A
Teus sonhos Deus tem
E
No livro da vida
F#m
E vão se realizar
D
No tempo dEle
A
Teus sonhos Deus tem
E
São lindos demais
F#m
E vão acontecer
D
Confia no Senhor

[Verso 2]
A            E
Levante a sua cabeça
F#m             D
E olhe pra cima
A            E
Deus está contigo
F#m           D
E nunca te deixou`
  },
  {
    id: 'g10', title: 'Nada Além do Sangue', artist: 'Isaías Saad',
    category: 'gospel', key: 'C', bpm: 75,
    lyrics: `[Intro] C  Am  F  G

[Verso 1]
C
O que pode me lavar
Am
De todo o meu pecado
F
É o sangue de Jesus
G
Que me faz purificado

[Refrão]
C
Nada além do sangue
Am
De Jesus, meu Senhor
F
Só Ele é suficiente
G
Pra me dar o Seu amor

[Verso 2]
C
Não há outro remédio
Am
Pra minha enfermidade
F
É o sangue precioso
G
Que me trás liberdade`
  },
  {
    id: 'g11', title: 'Yahweh (Yaveh)', artist: 'Nívea Soares',
    category: 'gospel', key: 'D', bpm: 80,
    lyrics: `[Intro] D  A  Bm  G

[Verso 1]
D                A
Yahweh, Yahweh
Bm                G
Precioso é o Teu nome
D                A
Yahweh, Yahweh
Bm                G
Precioso é o Teu nome

[Refrão]
D
Não há outro nome
A
Não há outro nome
Bm
Não há outro nome
G
Como o Teu, Senhor

[Verso 2]
D                A
Jesus, Jesus
Bm                G
Precioso é o Teu nome
D                A
Jesus, Jesus
Bm                G
Precioso é o Teu nome`
  },
  {
    id: 'g12', title: 'Eu Navegarei', artist: 'Vineyard',
    category: 'gospel', key: 'G', bpm: 120,
    lyrics: `[Intro] G  C  G  C

[Verso 1]
G               C
Eu navegarei nas águas
G               C
Eu navegarei nas águas
G               C
Eu navegarei nas águas
        D
Se Tu me guiar

[Refrão]
G         C
Profundo chama
G         C
Profundo chama
G         C
Eu vou mais fundo
D
Em Teu amor

[Verso 2]
G             C
Onde Tu fores eu irei
G             C
Onde Tu fores eu irei
G             C
Onde Tu fores eu irei
       D
Te seguirei`
  },
  {
    id: 'g13', title: 'A Casa é Sua', artist: 'Casa Worship',
    category: 'gospel', key: 'C', bpm: 85,
    lyrics: `[Intro] C  Am  F  G

[Verso 1]
C
A casa é Sua
Am
A casa é Sua
F
A casa é Sua
G
E nós somos Seus

[Refrão]
C
Bem-vindo, Espírito
Am
Bem-vindo, Espírito
F
Bem-vindo, Espírito
G
Bem-vindo aqui

[Verso 2]
C
Toma o Teu lugar
Am
Toma o Teu lugar
F
Toma o Teu lugar
G
Aqui é Teu lar`
  },
  {
    id: 'g14', title: 'Lugar Secreto', artist: 'Gabriela Rocha',
    category: 'gospel', key: 'C', bpm: 90,
    lyrics: `[Intro] C  Am  F  G

[Verso 1]
C
Eu quero estar
Am
No lugar secreto
F
Ao pé do Teu trono
G
Pra Te adorar

[Refrão]
C
Ali eu encontro
Am
A paz que só Tu dás
F
Ali eu encontro
G
A Tua presença real

[Verso 2]
C
No silêncio santo
Am
Eu ouço a Tua voz
F
E o Teu Espírito
G
Me enche de Ti`
  },
  {
    id: 'g15', title: 'Oceanos (Onde Meus Pés Podem Falhar)', artist: 'Hillsong',
    category: 'gospel', key: 'D', bpm: 80,
    lyrics: `[Intro] D  A  Bm  G

[Verso 1]
D                A
Tu me chamas sobre as águas
Bm                G
Onde meus pés podem falhar
D              A
E é ali que me encontro
Bm              G
Com olhos fitos em Ti

[Refrão]
D
E me chamas
A
E mergulho
Bm
No Teu amor
G
E o meu coração
D
Se rende
A
Sem medo
Bm
Onde Tu estás
G
A água se firma

[Verso 2]
D                A
E a minha fé será
Bm                G
Como os meus olhos em Ti
D              A
E nas promessas
Bm              G
Onde Tu me levas a andar`
  },
  {
    id: 'g16', title: 'Quão Grande É o Meu Amor', artist: 'Vineyard',
    category: 'gospel', key: 'C', bpm: 95,
    lyrics: `[Intro] C  F  C  G

[Verso 1]
C                  F
Quão grande é o meu amor
            C          G
Por Ti, ó meu Senhor
C                 F
E eu me renderei
        C           G
A Ti, ó meu Jesus

[Refrão]
C          G
E por Ti eu dançarei
Am         F
E por Ti eu cantarei
C          G
E com todo o meu ser
F           C
Te adorarei, Senhor

[Verso 2]
C                 F
E nada me separará
            C          G
Do Teu grande amor
C                F
E em todo tempo eu vou
        C           G
Te amar, ó meu Jesus`
  }
];

// ============= EXERCÍCIOS =============
var EXERCISES = [
  {
    id: 'ex1', title: 'Esquentando os Dedos', level: 'beginner',
    duration: '5 min', category: 'Digitação',
    description: 'Exercício básico para soltar os dedos e ganhar agilidade.',
    steps: [
      'Coloque os dedos 1, 2, 3 e 4 nas cordas 2, 3 e 4 no primeiro traste',
      'Toque cada dedo individualmente, um por um, em sequência',
      'Mantenha o pulso relaxado e a mão firme',
      'Repita o padrão 1-2-3-4 por 2 minutos',
      'Agora inverta: 4-3-2-1 por mais 2 minutos',
      'Tente fazer isso sem olhar para o braço'
    ],
    tip: 'Comece devagar. Velocidade vem com o tempo.'
  },
  {
    id: 'ex2', title: 'Troca de Acordes C - G', level: 'beginner',
    duration: '10 min', category: 'Acordes',
    description: 'Treine a mudança entre dois acordes fundamentais.',
    steps: [
      'Forme o acorde de Dó (C) com a mão esquerda',
      'Toque as 5 cordas uma vez cada (de cima para baixo)',
      'Troque para o acorde de Sol (G)',
      'Toque as 6 cordas uma vez cada',
      'Alterne: C-G-C-G, devagar no início',
      'Aumente a velocidade gradualmente',
      'Mantenha um metrônomo em 60 BPM'
    ],
    tip: 'Não tire a mão do braço entre as trocas. Apenas mova os dedos.'
  },
  {
    id: 'ex3', title: 'Pestana Simples (F)', level: 'beginner',
    duration: '15 min', category: 'Acordes',
    description: 'Domine o acorde de Fá com pestana no primeiro traste.',
    steps: [
      'Pressione todas as 6 cordas no primeiro traste com o dedo 1',
      'Posicione os dedos 2, 3 e 4 nas cordas 3, 5 e 4 nos trastes 2 e 3',
      'Toque cada corda individualmente para verificar se todas soam claras',
      'Ajuste a pressão do polegar atrás do braço se necessário',
      'Pratique transições F - C e F - G',
      'Comece com pestana parcial (apenas 2-3 cordas) se necessário'
    ],
    tip: 'O polegar deve ficar atrás do braço, oposto aos outros dedos.'
  },
  {
    id: 'ex4', title: 'Arpejo Simples', level: 'beginner',
    duration: '8 min', category: 'Ritmo',
    description: 'Aprenda a tocar notas individuais em sequência.',
    steps: [
      'Use o acorde de C (Dó)',
      'Toque as cordas na ordem: 5ª, 3ª, 2ª, 1ª, 2ª, 3ª',
      'Mantenha ritmo constante com metrônomo em 70 BPM',
      'Use os dedos polegar (5ª), indicador (3ª), médio (2ª), anelar (1ª)',
      'Repita o padrão continuamente',
      'Experimente em outros acordes (G, Am, F)'
    ],
    tip: 'A mão direita deve fazer movimentos circulares, como se segurasse uma bolinha.'
  },
  {
    id: 'ex5', title: 'Escala de Dó Maior', level: 'intermediate',
    duration: '12 min', category: 'Escalas',
    description: 'Toque a escala de Dó maior no braço do violão.',
    steps: [
      'Posicione o dedo 1 no traste 1 da 2ª corda (Dó)',
      'Continue: traste 3 da 2ª (Ré), traste 5 da 3ª (Mi)',
      'Desça: traste 5 da 1ª, traste 3 da 1ª, traste 1 da 1ª',
      'Pratique em ambas as direções: ascendente e descendente',
      'Aumente a velocidade progressivamente',
      'Tente tocar com alternância de dedos (i-m, m-i)'
    ],
    tip: 'A escala de Dó não tem sustenidos ou bemóis, é a mais fácil.'
  },
  {
    id: 'ex6', title: 'Dedilhado de Bossa Nova', level: 'intermediate',
    duration: '15 min', category: 'Ritmo',
    description: 'Aprenda o padrão rítmico clássico da bossa nova.',
    steps: [
      'Use o acorde de C (Dó)',
      'Padrão: polegar-índice-médio-anelar-médio-indice',
      'Tempo: J J J j j j (J = polegar, j = outros dedos)',
      'Mantenha as palhetadas pares e constantes',
      'Mude para G, Am, F7',
      'Pratique com metrônomo em 120 BPM'
    ],
    tip: 'O polegar toca as cordas graves (4ª, 5ª, 6ª), os outros as agudas.'
  },
  {
    id: 'ex7', title: 'Hammer-on e Pull-off', level: 'intermediate',
    duration: '10 min', category: 'Técnica',
    description: 'Técnicas de legato para deixar o som mais fluido.',
    steps: [
      'Hammer-on: toque uma nota e com força bata o dedo na mesma corda em um traste acima',
      'Exemplo: traste 3 da 3ª corda, martele o traste 5 com o dedo médio',
      'Pull-off: ao contrário, puxe o dedo para baixo',
      'Exemplo: traste 5, puxe para traste 3',
      'Alterne hammer-on e pull-off entre os mesmos trastes',
      'Tente fazer com o metrônomo em 80 BPM'
    ],
    tip: 'O som deve ser claro, sem que a corda seja tocada duas vezes.'
  },
  {
    id: 'ex8', title: 'Acordes com Pestano (Barre)', level: 'intermediate',
    duration: '20 min', category: 'Acordes',
    description: 'Domine os acordes com pestana em diferentes posições.',
    steps: [
      'Pratique F (Fá) - pestano no traste 1',
      'Bm (Si menor) - pestano no traste 2',
      'C#m (Dó# menor) - pestano no traste 4',
      'F# (Fá#) - pestano no traste 2',
      'Mantenha a pressão uniforme em todas as cordas',
      'Verifique corda por corda se o som é limpo'
    ],
    tip: 'A chave é posicionar o dedo 1 bem rente ao traste, não no meio dele.'
  },
  {
    id: 'ex9', title: 'Bends (Afinação)', level: 'advanced',
    duration: '15 min', category: 'Técnica',
    description: 'Técnica de curvar a corda para alterar a afinação.',
    steps: [
      'Toque a 3ª corda no traste 7 (nota Si)',
      'Com os dedos 2 e 3, puxe a corda para cima',
      'Tente chegar a nota Dó# (um tom acima)',
      'Pratique bend de meio tom e um tom',
      'Use os dedos 2 e 3 juntos para ter mais força',
      'Tente bend na 1ª e 2ª cordas também'
    ],
    tip: 'O bend deve ser firme e constante. Não solte bruscamente.'
  },
  {
    id: 'ex10', title: 'Vibrato', level: 'advanced',
    duration: '10 min', category: 'Técnica',
    description: 'Adicione expressão às suas notas com vibrato.',
    steps: [
      'Toque uma nota aguda (ex: traste 12 da 1ª corda)',
      'Mova o dedo levemente para cima e para baixo rapidamente',
      'O movimento deve vir do pulso, não do dedo',
      'Mantenha a pressão constante',
      'Pratique diferentes intensidades de vibrato',
      'Combine vibrato com bends'
    ],
    tip: 'Bom vibrato é o que diferencia amadores de profissionais.'
  },
  {
    id: 'ex11', title: 'Tapping', level: 'advanced',
    duration: '20 min', category: 'Técnica',
    description: 'Técnica avançada de tocar com ambas as mãos no braço.',
    steps: [
      'Mão direita: dedos médio e indicador no braço',
      'Mão esquerda: dedos no braço também',
      'Comece com um padrão simples: 5-7-12-7-5-7-12',
      'Mantenha o ritmo firme com metrônomo',
      'Aumente a velocidade aos poucos',
      'Experimente padrões mais complexos'
    ],
    tip: 'O tapping exige muita coordenação. Pratique devagar primeiro.'
  },
  {
    id: 'ex12', title: 'Palhetada Alternada', level: 'intermediate',
    duration: '10 min', category: 'Técnica',
    description: 'Treine velocidade com palhetada alternada.',
    steps: [
      'Use uma palheta (plectro)',
      'Alterne para baixo e para cima continuamente',
      'Comece com a palheta em uma única corda',
      'Mantenha metrônomo em 100 BPM',
      'Aumente para 120, 140, 160 BPM gradualmente',
      'Aplique o padrão em uma escala'
    ],
    tip: 'O movimento deve vir do punho, não do braço todo.'
  }
];

// ============= TEORIA MUSICAL =============
var THEORY_CONTENT = {
  notes: {
    title: 'Notas Musicais',
    html: `
      <h3>As 12 notas da música ocidental</h3>
      <p>A música ocidental utiliza 12 notas básicas, que se repetem em diferentes oitavas:</p>
      <div class="chord-grid" id="notesGrid"></div>
      <h4>Como memorizar</h4>
      <p>Para iniciantes, as notas são representadas pelas letras A a G. As notas com sustenido (#) ou bemol (b) são chamadas de <strong>acidentes</strong>:</p>
      <ul>
        <li><strong>Sustenido (#)</strong>: sobe meio tom. Ex: C# é meio tom acima de C</li>
        <li><strong>Bemol (b)</strong>: desce meio tom. Ex: Db é meio tom abaixo de D</li>
        <li>C# = Db (mesma nota, escrita diferente - <em>enharmônica</em>)</li>
      </ul>
      <h4>Notas no violão</h4>
      <p>As cordas soltas do violão (padrão) são afinadas em: <strong>E A D G B E</strong> (Mi Lá Ré Sol Si Mi), da 6ª (mais grossa) à 1ª (mais fina).</p>
      <h4>Escala Cromática (todas as notas em sequência)</h4>
      <p>C - C# - D - D# - E - F - F# - G - G# - A - A# - B - C</p>
    `
  },
  chords: {
    title: 'Acordes',
    html: `
      <h3>O que é um acorde?</h3>
      <p>Um acorde é um conjunto de três ou mais notas tocadas simultaneamente. Os acordes mais comuns no violão são as <strong>tríades</strong> (3 notas): tônica, terça e quinta.</p>
      <h4>Tipos principais</h4>
      <ul>
        <li><strong>Maior</strong>: som alegre, positivo (ex: C, G, D)</li>
        <li><strong>Menor</strong>: som triste, melancólico (ex: Am, Dm, Em)</li>
        <li><strong>Com 7ª</strong>: som jazzístico, tenso (ex: G7, C7)</li>
        <li><strong>Suspenso (sus)</strong>: som indefinido, pede resolução (ex: Dsus4)</li>
      </ul>
      <h4>Acordes abertos essenciais</h4>
      <p>Toque os acordes abaixo. São a base da maioria das músicas populares:</p>
      <div class="chord-grid" id="chordsGrid"></div>
      <h4>Como formar um acorde maior</h4>
      <p>Exemplo: acorde de Dó Maior (C) = Dó + Mi + Sol. As notas são: C - E - G.</p>
      <h4>Como formar um acorde menor</h4>
      <p>Basta abaixar a terça meio tom. Exemplo: Dó menor (Cm) = C - D# - G.</p>
    `
  },
  scales: {
    title: 'Escalas',
    html: `
      <h3>O que é uma escala?</h3>
      <p>Uma escala é uma sequência de notas em ordem ascendente ou descendente. As escalas formam a base da melodia e da improvisação.</p>
      <h4>Escala Maior Natural</h4>
      <p>Padrão de tons e semitons: T - T - St - T - T - T - St</p>
      <p><strong>Exemplo em Dó Maior:</strong> C - D - E - F - G - A - B - C</p>
      <h4>Escala Menor Natural</h4>
      <p>Padrão: T - St - T - T - St - T - T</p>
      <p><strong>Exemplo em Lá Menor:</strong> A - B - C - D - E - F - G - A</p>
      <h4>Escala Pentatônica</h4>
      <p>Possui apenas 5 notas. Muito usada em rock e blues. <strong>Pentatônica Maior:</strong> 1, 2, 3, 5, 6. <strong>Pentatônica Menor:</strong> 1, b3, 4, 5, b7.</p>
      <h4>Escala de Blues</h4>
      <p>É a pentatônica menor acrescida da nota blue (b5): 1, b3, 4, b5, 5, b7.</p>
      <h4>Como aplicar no violão</h4>
      <p>Pratique a escala de Dó Maior em todo o braço. Comece com a pentatônica, que é mais fácil e útil para solos.</p>
      <div id="scalesGrid"></div>
    `
  },
  chordProgressions: {
    title: 'Campo Harmônico',
    html: `
      <h3>Campo Harmônico Maior</h3>
      <p>É o conjunto dos 7 acordes formados a partir de cada nota da escala maior. Os graus têm funções específicas:</p>
      <h4>Graus do campo harmônico de Dó Maior</h4>
      <ul>
        <li><strong>I (C)</strong> - Tônica: centro, repouso</li>
        <li><strong>ii (Dm)</strong> - Supertônica: preparação</li>
        <li><strong>iii (Em)</strong> - Mediante: relativa</li>
        <li><strong>IV (F)</strong> - Subdominante: movimento</li>
        <li><strong>V (G)</strong> - Dominante: tensão</li>
        <li><strong>vi (Am)</strong> - Submediante: relativa menor</li>
        <li><strong>vii° (B°)</strong> - Sensível: resolução</li>
      </ul>
      <h4>Progressões mais comuns</h4>
      <p>As progressões são a "receita" de como os acordes se conectam:</p>
      <ul>
        <li><strong>I - V - vi - IV</strong> ("4 acordes nobres"): super comum em pop</li>
        <li><strong>ii - V - I</strong>: jazz, bossa nova</li>
        <li><strong>I - vi - IV - V</strong>: anos 50, rock clássico</li>
        <li><strong>vi - IV - I - V</strong>: pop moderno</li>
      </ul>
      <h4>Exemplos em diferentes tons</h4>
      <div id="progressionGrid"></div>
    `
  },
  chordReading: {
    title: 'Lendo Cifras',
    html: `
      <h3>O que é uma cifra?</h3>
      <p>Cifra é uma forma simplificada de representar acordes. Em vez de escrever as notas, usamos símbolos como "Am", "C7", "G/B".</p>
      <h4>Estrutura básica</h4>
      <p><strong>[Nota][Acidente][Tipo][Extensão]/[Baixo]</strong></p>
      <ul>
        <li><strong>Nota</strong>: A, B, C, D, E, F, G</li>
        <li><strong>Acidente</strong>: # (sustenido) ou b (bemol). Ex: F#, Bb</li>
        <li><strong>Tipo</strong>: m (menor), 7, maj7, sus4, dim, aug</li>
        <li><strong>Baixo</strong>: nota após a barra. Ex: C/E = C com Mi no baixo</li>
      </ul>
      <h4>Exemplos práticos</h4>
      <ul>
        <li><strong>C</strong> = Dó Maior</li>
        <li><strong>Cm</strong> = Dó menor</li>
        <li><strong>C7</strong> = Dó com sétima dominante</li>
        <li><strong>Cmaj7</strong> = Dó maior com sétima maior</li>
        <li><strong>Csus4</strong> = Dó com quarta suspensa</li>
        <li><strong>C/E</strong> = Dó maior com Mi no baixo</li>
        <li><strong>Cadd9</strong> = Dó com nona adicionada</li>
      </ul>
      <h4>Transposição</h4>
      <p>Se você quer mudar o tom de uma música, basta somar a diferença. Ex: música em C, quer em D, suba 2 tons. Cada acorde sobe 2 semitons: C→D, Am→Bm, F→G.</p>
      <h4>Notação de ritmo</h4>
      <p>Em cifras, às vezes aparece "/" para indicar "uma vez" e "/" para continuar: "C / / /" = C por 4 batidas.</p>
    `
  },
  tab: {
    title: 'Tablatura',
    html: `
      <h3>O que é tablatura (TAB)?</h3>
      <p>A tablatura é um sistema de notação específico para instrumentos de cordas. Mostra exatamente onde colocar os dedos no braço.</p>
      <h4>Como ler</h4>
      <p>É composta por 6 linhas horizontais (uma para cada corda). De cima para baixo:</p>
      <ul>
        <li>1ª linha: 1ª corda (Mi agudo, a mais fina)</li>
        <li>2ª linha: 2ª corda (Si)</li>
        <li>3ª linha: 3ª corda (Sol)</li>
        <li>4ª linha: 4ª corda (Ré)</li>
        <li>5ª linha: 5ª corda (Lá)</li>
        <li>6ª linha: 6ª corda (Mi grave, a mais grossa)</li>
      </ul>
      <h4>Os números</h4>
      <p>Os números nas linhas indicam o traste onde apertar a corda. 0 = corda solta.</p>
      <h4>Exemplo de TAB</h4>
      <pre style="background:#0f1729;padding:12px;border-radius:8px;font-family:monospace;color:#f4a261;">
E|--------0-----------0--------|
B|------1---1-------1---1------|
G|----0-------0---0-------0----|
D|------------------------------|
A|------------------------------|
E|------------------------------|
      </pre>
      <p>Isso significa: 0 (corda solta Mi) - 1 (traste 1 do Si) - 0 (Sol solta) - 1 - 0 - 1 ...</p>
      <h4>Símbolos comuns</h4>
      <ul>
        <li><strong>h</strong> = hammer-on (ex: 5h7 = martela do 5 para o 7)</li>
        <li><strong>p</strong> = pull-off (ex: 7p5 = puxa do 7 para o 5)</li>
        <li><strong>b</strong> = bend (ex: 7b9 = curva do 7 para o 9)</li>
        <li><strong>/</strong> ou <strong>\\</strong> = slide (ex: 5/7 = desliza do 5 para o 7)</li>
        <li><strong>x</strong> = não tocar a corda</li>
      </ul>
    `
  }
};

// ============= APOSTILAS / LIÇÕES =============
var LESSONS = [
  // ============ INICIANTE ============
  {
    id: 'l1', level: 'beginner', order: 1,
    title: '1. Conhecendo o Violão', duration: '15 min',
    summary: 'Partes do violão, postura correta, como segurar o instrumento',
    content: `
<h3>Bem-vindo ao mundo do violão!</h3>
<p>Antes de tocar qualquer nota, você precisa conhecer o instrumento e aprender a postura correta. Isso evita dores e lesões, além de melhorar o som.</p>

<h4>Partes do Violão</h4>
<ul>
<li><strong>Corpo (bojo)</strong>: a caixa de ressonância. É onde sai o som amplificado.</li>
<li><strong>Braço (escala)</strong>: a parte longa onde ficam os trastes e você coloca os dedos.</li>
<li><strong>Trastes</strong>: as barras de metal no braço. Cada traste representa um semitom.</li>
<li><strong>Cordas</strong>: 6 cordas. Da mais grossa (6ª, Mi grave) à mais fina (1ª, Mi agudo).</li>
<li><strong>Tarraxas (cravelhas)</strong>: onde você afina o violão. Gire para apertar/afinar.</li>
<li><strong>Pestana (Nut)</strong>: a parte branca no topo do braço, antes do 1º traste.</li>
<li><strong>Rastilho (Ponte)</strong>: onde as cordas se fixam no corpo.</li>
<li><strong>Palheta/Plectro</strong>: opcional, usado para rasgar cordas.</li>
</ul>

<h4>Postura Correta (Sentado)</h4>
<ol>
<li>Sente-se em uma cadeira firme, sem braços. A coluna deve ficar reta, sem curvar.</li>
<li>Coloque a cintura do violão sobre a perna direita (se canhoto, inverta).</li>
<li>A coxa deve estar levemente inclinada para baixo, para que o braço do violão suba em ângulo.</li>
<li>As costas do violão encostam levemente no peito/barriga.</li>
<li>Os pés apoiados no chão, paralelos.</li>
<li>O ombro esquerdo relaxado, sem tensão.</li>
</ol>

<h4>Postura em Pé (com correia)</h4>
<ul>
<li>A altura ideal: o braço do violão fica paralelo ao chão.</li>
<li>Ajuste a correia para que o violão fique em uma altura confortável para tocar.</li>
</ul>

<h4>Posição das Mãos</h4>
<p><strong>Mão direita (tocante):</strong></p>
<ul>
<li>Polegar: responsável pelas cordas graves (4ª, 5ª, 6ª).</li>
<li>Indicador (i), Médio (m), Anelar (a): responsáveis pelas cordas agudas (3ª, 2ª, 1ª).</li>
<li>Mindinho: geralmente não é usado, apoia na boca do violão.</li>
</ul>

<p><strong>Mão esquerda (fretadora):</strong></p>
<ul>
<li>Polegar atrás do braço, oposto ao dedo indicador (1).</li>
<li>Dedos curvados, como se estivessem segurando uma bolinha pequena.</li>
<li>A ponta dos dedos (não a parte de baixo) aperta a corda, bem rente ao traste.</li>
</ul>

<h4>💡 Dica de ouro</h4>
<p>A pressão dos dedos no braço deve ser firme, mas sem tensão. Se seus dedos ficam brancos ou doloridos, você está apertando demais. Relaxe a mão e respire.</p>
    `
  },
  {
    id: 'l2', level: 'beginner', order: 2,
    title: '2. Acordes Básicos (Em, Am, G, C, D)', duration: '30 min',
    summary: 'Os 5 acordes essenciais que abrem 80% das músicas',
    content: `
<h3>Os 5 Acordes Essenciais</h3>
<p>Domine estes 5 acordes e você conseguirá tocar a grande maioria das músicas populares. São eles: <strong>Em, Am, G, C e D</strong>.</p>

<h4>1. Em (Mi Menor) - O mais fácil</h4>
<p>Dedos: 2 na 5ª corda (2º traste), 3 na 4ª corda (2º traste). As outras cordas soltas.</p>
<ul><li>É o primeiro acorde que todo iniciante aprende.</li><li>Toca as 6 cordas.</li></ul>

<h4>2. Am (Lá Menor)</h4>
<p>Dedos: 1 na 2ª corda (1º traste), 2 na 3ª corda (2º traste), 3 na 4ª corda (2º traste). A 5ª e 6ª cordas soltas. A 1ª não toca.</p>
<ul><li>Som melancólico, muito usado em baladas.</li></ul>

<h4>3. G (Sol Maior)</h4>
<p>Dedos: 1 na 5ª corda (2º traste), 2 na 6ª corda (3º traste), 3 na 1ª corda (3º traste). As outras cordas soltas.</p>
<ul><li>Um dos mais importantes. Toca as 6 cordas.</li></ul>

<h4>4. C (Dó Maior)</h4>
<p>Dedos: 1 na 2ª corda (1º traste), 2 na 4ª corda (2º traste), 3 na 5ª corda (3º traste). A 6ª não toca. A 3ª solta.</p>
<ul><li>Som alegre, brilhante.</li></ul>

<h4>5. D (Ré Maior)</h4>
<p>Dedos: 1 na 3ª corda (2º traste), 2 na 2ª corda (3º traste), 3 na 1ª corda (2º traste). A 4ª, 5ª e 6ª cordas não tocam.</p>
<ul><li>Apenas 4 cordas, som aveludado.</li></ul>

<h4>Como Treinar a Troca de Acordes</h4>
<ol>
<li>Forme um acorde (ex: Em) e toque as cordas uma vez.</li>
<li>Troque para outro (ex: Am) SEM tirar a mão do braço, só movimente os dedos.</li>
<li>Toque o segundo acorde.</li>
<li>Volte para o primeiro. Repita 10 vezes.</li>
<li>Agora troque para um terceiro acorde. Continue a sequência.</li>
</ol>

<h4>Sequência Recomendada de Estudo</h4>
<ol>
<li>Aprenda Em → pratique 2 dias</li>
<li>Adicione Am → pratique 2 dias</li>
<li>Adicione G → pratique 2 dias</li>
<li>Adicione C → pratique 3 dias</li>
<li>Adicione D → pratique 3 dias</li>
<li>Comece a tocar músicas simples que usem esses 5</li>
</ol>

<h4>💡 Dica</h4>
<p>Não tire a mão do braço entre as trocas. Os dedos devem deslizar/movimentar mantendo sempre alguma parte em contato com as cordas. Isso é mais rápido e eficiente.</p>
    `
  },
  {
    id: 'l3', level: 'beginner', order: 3,
    title: '3. Como Ler Cifras', duration: '20 min',
    summary: 'Interpretando cifras em qualquer música ou site de cifras',
    content: `
<h3>Decifrando o Código</h3>
<p>Cifra é uma forma simplificada de representar acordes em uma música. Vamos aprender a ler!</p>

<h4>Estrutura Básica</h4>
<p>Uma cifra segue o formato: <strong>[Nota][Acidente][Tipo][Extensão]</strong></p>

<h4>Letras das Notas</h4>
<ul>
<li><strong>A</strong> = Lá</li>
<li><strong>B</strong> = Si</li>
<li><strong>C</strong> = Dó</li>
<li><strong>D</strong> = Ré</li>
<li><strong>E</strong> = Mi</li>
<li><strong>F</strong> = Fá</li>
<li><strong>G</strong> = Sol</li>
</ul>

<h4>Acidentes</h4>
<ul>
<li><strong># (sustenido)</strong>: sobe meio tom. Ex: F# = Fá sustenido</li>
<li><strong>b (bemol)</strong>: desce meio tom. Ex: Bb = Si bemol</li>
</ul>

<h4>Tipos de Acorde</h4>
<ul>
<li><strong>Sem sufixo</strong>: Maior (C = Dó Maior)</li>
<li><strong>m</strong>: Menor (Cm = Dó menor)</li>
<li><strong>7</strong>: Com 7ª dominante (C7)</li>
<li><strong>maj7</strong>: Com 7ª maior (Cmaj7)</li>
<li><strong>sus4</strong>: 4ª suspensa (Csus4)</li>
<li><strong>add9</strong>: 9ª adicionada (Cadd9)</li>
</ul>

<h4>Como Ler na Prática</h4>
<p>Em uma cifra, os acordes aparecem em cima da letra, indicando onde trocar:</p>
<pre style="background:#0f1729;padding:12px;border-radius:8px;font-family:monospace;color:#f4a261">
         C        G
   Subiu o morro, a lua clareou
         Am       F
   E o sertão inteiro acordou
</pre>
<p>Aqui, no início de cada frase, você troca para o acorde indicado.</p>

<h4>Como Ler Repetições</h4>
<p>Quando um acorde fica por várias batidas, às vezes aparece assim:</p>
<ul>
<li><strong>C / / /</strong> = C por 4 batidas</li>
<li><strong>C / /</strong> = C por 3 batidas</li>
</ul>

<h4>Seção [Intro], [Verso], [Refrão]</h4>
<p>Essas marcações indicam partes da música. Use a mesma sequência de acordes para cada verso, e geralmente o refrão tem acordes próprios.</p>

<h4>💡 Dica</h4>
<p>Quando encontrar um acorde que não conhece, use o <strong>diagrama de acordes</strong> no app. Toque em qualquer cifra na seção de Músicas para ver o diagrama!</p>
    `
  },
  {
    id: 'l4', level: 'beginner', order: 4,
    title: '4. Ritmos Básicos (Batida)', duration: '25 min',
    summary: 'Os 3 ritmos mais usados: batida simples, valsinha e bossa',
    content: `
<h3>O Coração da Música: O Ritmo</h3>
<p>Acordes corretos com ritmo ruim = música sem graça. Acordes simples com bom ritmo = música que agrada. Por isso, treine ritmo muito!</p>

<h4>1. Batida Simples (Pop/Rock)</h4>
<p>É o ritmo mais usado. Mão direita faz movimento para baixo e para cima alternado.</p>
<p><strong>Contagem: 1 2 3 4 | 1 2 3 4</strong></p>
<p><strong>Direção: ↓ ↑ ↓ ↑ | ↓ ↑ ↓ ↑</strong></p>
<ul>
<li>↓ = palhetada para baixo (toca todas as cordas do acorde)</li>
<li>↑ = palhetada para cima (toca as cordas agudas)</li>
</ul>

<h4>2. Valsinha (3/4)</h4>
<p>Usada em músicas como "Parabéns pra Você", "Happy Birthday", "Asa Branca".</p>
<p><strong>Contagem: 1 2 3 | 1 2 3</strong></p>
<p><strong>Direção: ↓ ↑ ↓ | ↓ ↑ ↓</strong></p>
<p>O movimento é mais "saltitante", com pausa no terceiro tempo.</p>

<h4>3. Bossa Nova (Simplificada)</h4>
<p>Ritmo brasileiro sofisticado, com síncope característica.</p>
<p><strong>Contagem em 4/4: 1 e 2 e 3 e 4 e</strong></p>
<p><strong>Direção: ↓ . ↑ ↑ . ↑ ↓ .</strong></p>
<p>Onde "." = pausa e "↑ ↓" = palhetadas mais rápidas. Treine devagar!</p>

<h4>Como Praticar</h4>
<ol>
<li>Escolha uma música fácil (ex: "Asa Branca" para valsinha)</li>
<li>Use o <strong>metrônomo</strong> do app em 60-80 BPM</li>
<li>Toque a batida SEM trocar de acorde primeiro. Só o ritmo.</li>
<li>Quando o ritmo estiver firme, adicione a troca de acordes</li>
<li>Aumente o BPM gradualmente (10 BPM por semana)</li>
</ol>

<h4>Dica Importante: A Mão</h4>
<p>Use o punho, não o braço todo. O movimento é do pulso, relaxado, como se estivesse batendo numa mesa com as costas da mão.</p>
    `
  },
  {
    id: 'l5', level: 'beginner', order: 5,
    title: '5. Dedilhado Básico', duration: '20 min',
    summary: 'Tocando notas individuais: arpejo simples com 4 dedos',
    content: `
<h3>Dedilhado: Tocando Corda por Corda</h3>
<p>Em vez de tocar todas as cordas juntas, no dedilhado você toca uma de cada vez, criando um efeito mais delicado. Muito usado em MPB, bossa nova, e baladas.</p>

<h4>Arpejo com 4 Dedos (i-m-a)</h4>
<p>Use os dedos da mão direita: indicador (i), médio (m), anelar (a), e o polegar (p) para as cordas graves.</p>

<h4>Padrão Mais Comum (4 batidas por compasso)</h4>
<p>Para um acorde de C (Dó):</p>
<ol>
<li>5ª corda com o POLEGAR (Lá)</li>
<li>3ª corda com o INDICADOR (Dó)</li>
<li>2ª corda com o MÉDIO (Mi)</li>
<li>1ª corda com o ANELAR (Sol)</li>
<li>3ª corda com o MÉDIO (Dó)</li>
<li>2ª corda com o INDICADOR (Mi)</li>
</ol>
<p>Isso forma o arpejo: <strong>5 - 3 - 2 - 1 - 2 - 3</strong> (em numeração de cordas)</p>

<h4>Para Outros Acordes</h4>
<ul>
<li><strong>G (Sol)</strong>: 6ª - 3ª - 2ª - 1ª - 2ª - 3ª (polegar usa a 6ª)</li>
<li><strong>Am (Lá menor)</strong>: 5ª - 3ª - 2ª - 1ª - 2ª - 3ª (igual a C)</li>
<li><strong>D (Ré)</strong>: 4ª - 3ª - 2ª - 1ª - 2ª - 3ª (polegar usa a 4ª)</li>
</ul>

<h4>Como Praticar</h4>
<ol>
<li>Comece com metrônomo em 50 BPM</li>
<li>Toque cada nota bem destacada, sem pressa</li>
<li>Mantenha o polegar numa posição fixa (não "ande" com ele)</li>
<li>Os dedos i, m, a devem ficar curvados, como se estivessem segurando uma bolinha</li>
<li>Aumente o BPM aos poucos: 60, 70, 80, 90...</li>
</ol>

<h4>Erros Comuns</h4>
<ul>
<li>Tocar com a mão toda rígida → mantenha relaxado</li>
<li>Usar dedo errado (i em vez de m) → pratique nomeando cada dedo em voz alta</li>
<li>Não ouvir as notas separadas → foque em cada som</li>
</ul>

<h4>💡 Dica</h4>
<p>Esse dedilhado é a base da Bossa Nova. Quando dominar, tente a versão completa (Padrão João Gilberto), que é mais complexa mas tem o suingue brasileiro inconfundível.</p>
    `
  },

  // ============ INTERMEDIÁRIO ============
  {
    id: 'l6', level: 'intermediate', order: 6,
    title: '6. Pestana (Barre) - Dominando F e Bm', duration: '40 min',
    summary: 'A técnica mais desafiadora para iniciantes: pestano',
    content: `
<h3>Pestano: O Salto do Intermediário</h3>
<p>O pestano é o que separa o iniciante do intermediário. É quando você usa o dedo indicador para pressionar TODAS as 6 cordas em um mesmo traste. O acorde de Fá (F) é o exemplo mais clássico.</p>

<h4>Por que é difícil?</h4>
<ul>
<li>Você precisa pressionar 6 cordas com 1 dedo</li>
<li>Requer mais força e posicionamento preciso</li>
<li>Algumas cordas podem "abafar" (não soar) se a pressão não for uniforme</li>
</ul>

<h4>Como Formar o F (Fá Maior)</h4>
<ol>
<li><strong>Dedo 1 (indicador)</strong>: faz o pestano no 1º traste (todas as 6 cordas)</li>
<li><strong>Dedo 2 (médio)</strong>: 3ª corda, 2º traste</li>
<li><strong>Dedo 3 (anelar)</strong>: 5ª corda, 3º traste</li>
<li><strong>Dedo 4 (mínimo)</strong>: 4ª corda, 3º traste</li>
</ol>

<h4>Posicionamento Correto</h4>
<ul>
<li>O dedo 1 deve ficar bem <strong>rente ao traste</strong> (não no meio dele, mais perto do traste 2)</li>
<li>O <strong>polegar</strong> atrás do braço, oposto ao indicador. Pressione para baixo com a mão esquerda, contra o polegar.</li>
<li>Posicione o indicador levemente inclinado, de modo que a parte mais carnuda fique sobre as cordas graves</li>
</ul>

<h4>Exercício Progressivo</h4>
<ol>
<li>Comece com pestano <strong>parcial</strong> (apenas 2-3 cordas) - Ex: 1ª, 2ª e 3ª cordas apenas</li>
<li>Forme o F, mas tire as cordas que não estão sendo pressionadas - 4ª, 5ª, 6ª</li>
<li>Toque cada corda individualmente para ver quais soam claras</li>
<li>Adicione uma corda por vez até completar as 6</li>
</ol>

<h4>Outros Acordes com Pestano Importantes</h4>
<ul>
<li><strong>Bm (Si menor)</strong>: pestano no 2º traste</li>
<li><strong>C#m (Dó# menor)</strong>: pestano no 4º traste</li>
<li><strong>F# (Fá#)</strong>: pestano no 2º traste</li>
</ul>
<p>A regra é: <strong>qualquer acorde "aberto" pode ser movido para um traste com pestano</strong>. Por exemplo, o "E" (Mi) virando "F" (Fá) com pestano no 1º traste. Esse é um truque poderoso!</p>

<h4>Truque do Capo</h4>
<p>Se tiver um <strong>capo</strong> (ou usar a pestano virtual do app), você pode simplificar: coloque o capo no 1º traste e toque os acordes de E como se fossem F. Capo no 2º = F#, no 3º = G, etc.</p>

<h4>💡 Dica</h4>
<p>Não desanime se demorar! Muitos levam 2-3 meses para dominar o pestano perfeitamente. O segredo é a persistência e a posição do polegar. Se sentir dor, pare e descanse.</p>
    `
  },
  {
    id: 'l7', level: 'intermediate', order: 7,
    title: '7. Escala Pentatônica e Improvisação', duration: '45 min',
    summary: 'Base para tirar solos de rock, blues e pop',
    content: `
<h3>A Escala Mágica: Pentatônica</h3>
<p>Se você quer tirar solos (melodias improvisadas), a escala pentatônica é o lugar para começar. É usada em 90% dos solos de rock, blues, pop e até MPB.</p>

<h4>O que é "Pentatônica"?</h4>
<p>Significa "5 notas" (penta = cinco). É uma escala simplificada que soa bem em quase qualquer acorde.</p>

<h4>Pentatônica de Sol Menor (1ª posição)</h4>
<p>Esta é a mais usada em rock e blues. Começa no traste 3 da 6ª corda (nota Sol).</p>

<p><strong>Padrão no braço:</strong></p>
<pre style="background:#0f1729;padding:12px;border-radius:8px;font-family:monospace;color:#f4a261">
6ª corda:  3 - 5
5ª corda:  3 - 5
4ª corda:  2 - 5
3ª corda:  2 - 4
2ª corda:  3 - 5
1ª corda:  3 - 5
</pre>
<p>Cada número é o traste. Toca em sequência: 3-5-3-5-2-5-2-4-3-5-3-5 (repetindo).</p>

<h4>As 5 Notas (em Sol)</h4>
<p>G (Sol) - Bb (Si bemol) - C (Dó) - D (Ré) - F (Fá)</p>

<h4>Como Improvisar</h4>
<ol>
<li>Coloque um <strong>backing track</strong> (faixa de apoio) em Sol menor. Tem vários gratuitos no YouTube.</li>
<li>Toque as notas da pentatônica em qualquer ordem, no ritmo que quiser</li>
<li>Comece devagar, ouça o que soa bem</li>
<li>Experimente voltar sempre à nota Sol (a "tônica") - isso dá sensação de "chegada"</li>
<li>Tente "responder" musicalmente ao que está ouvindo</li>
</ol>

<h4>Técnicas Para Dar Vida ao Solo</h4>
<ul>
<li><strong>Bend</strong>: puxe a corda para alterar a afinação. Ex: 3 → 5 com bend vira 3 → 6</li>
<li><strong>Hammer-on</strong>: toque uma nota e bata o dedo em um traste acima (h)</li>
<li><strong>Pull-off</strong>: puxe o dedo de um traste para o anterior (p)</li>
<li><strong>Vibrato</strong>: oscile o dedo levemente para dar "emoção" à nota</li>
<li><strong>Slide</strong>: deslize de um traste para outro (/ ou \\)</li>
</ul>

<h4>Backing Tracks Recomendados</h4>
<p>Procure no YouTube: "backing track G minor", "backing track blues in G", "backing track rock in A minor". Comece com os lentos (60-80 BPM).</p>

<h4>💡 Dica</h4>
<p>Improvisação não é talento nato - é vocabulário. Quanto mais você ouvir e copiar solos de outros guitarristas, mais frases você terá na "biblioteca" para usar.</p>
    `
  },
  {
    id: 'l8', level: 'intermediate', order: 8,
    title: '8. Tocar de Ouvido', duration: '60 min',
    summary: 'Tirar músicas sem cifras: técnica essencial para qualquer músico',
    content: `
<h3>A Habilidade Definitiva: Tocar de Ouvido</h3>
<p>Com o tempo, você vai querer tocar músicas que ainda não têm cifra disponível, ou criar suas próprias versões. Saber tirar de ouvido é fundamental.</p>

<h4>Passo 1: Identifique o Tom</h4>
<p>Use o afinador ou o app: descubra qual é a nota mais grave que aparece na música. Geralmente é a tônica (nota principal).</p>
<ul>
<li>Se a música "termina" em G, provavelmente é em G (Sol Maior ou Sol menor)</li>
<li>Toque notas no braço até achar a que "combina" com o final da música</li>
</ul>

<h4>Passo 2: Encontre os Acordes (Batida)</h4>
<ol>
<li>Escute a música e cante junto</li>
<li>Quando sentir uma "mudança" de acorde (geralmente a cada 1-4 batidas), pause</li>
<li>Tente descobrir qual acorde é. Comece testando: I, IV, V, vi (em relação ao tom que você descobriu)</li>
<li>Se a música está em C, teste: C, F, G, Am</li>
</ul>

<h4>Passo 3: Identifique o Ritmo</h4>
<p>É batida, valsinha, bossa, reggae? Bata a mão na perna acompanhando a música pra sentir o pulso.</p>

<h4>Passo 4: Monte a Forma dos Acordes</h4>
<ul>
<li><strong>Verso 1, 2, 3</strong>: geralmente têm a mesma sequência de acordes</li>
<li><strong>Refrão</strong>: tem uma sequência diferente (mais marcante)</li>
<li><strong>Bridge</strong>: pode ter uma sequência única</li>
</ul>

<h4>Passo 5: Adicione Detalhes</h4>
<ul>
<li>Variações de dedilhado</li>
<li>Acordes com pestano em vez de abertos</li>
<li>Notas de passagem entre os acordes</li>
<li>Introdução (geralmente os primeiros acordes do verso)</li>
</ul>

<h4>Truque: Apps e Ferramentas</h4>
<ul>
<li><strong>Moises</strong>: detecta acordes automaticamente de qualquer áudio (com IA)</li>
<li><strong>YouTube</strong>: diminua a velocidade (0.75x ou 0.5x) para entender partes difíceis</li>
<li><strong>Afinador do app</strong>: identifique tons e notas isoladas</li>
</ul>

<h4>Exercício Prático</h4>
<ol>
<li>Pegue uma música simples que você goste mas que não tem cifra</li>
<li>Escute 3-4 vezes prestando atenção na estrutura</li>
<li>Identifique o tom (último acorde da música)</li>
<li>Descubra a sequência do verso (geralmente 4 acordes)</li>
<li>Teste cada acorde no braço</li>
<li>Junte tudo e toque junto com a música</li>
</ol>

<h4>💡 Dica</h4>
<p>Comece com músicas simples. As primeiras serão lentas, mas com prática você vai tirar uma música de ouvido em 15-30 minutos. É como um quebra-cabeça - e é MUITO gratificante quando dá certo!</p>
    `
  },

  // ============ AVANÇADO ============
  {
    id: 'l9', level: 'advanced', order: 9,
    title: '9. Harmonia Avançada - Substituição de Acordes', duration: '60 min',
    summary: 'Como embelezar e sofisticar harmonias: tríades, extensões, tensões',
    content: `
<h3>Além do Básico: Harmonia Sofisticada</h3>
<p>Quando você já domina os acordes básicos e pestano, é hora de explorar harmonias mais ricas e interessantes. Esse é o território do jazz, MPB sofisticada e música instrumental.</p>

<h4>1. Tríades</h4>
<p>Tríade é a forma mais simples de acorde: 3 notas. No violão, podemos tocar tríades em diferentes posições para criar timbres variados.</p>

<h4>Tríades na Forma CAGED</h4>
<p>O sistema CAGED divide o braço em 5 regiões: C-A-G-E-D. Cada letra é a forma de um acorde aberto. Dominando essas formas, você pode tocar QUALQUER acorde em QUALQUER posição do braço.</p>

<h4>2. Inversões de Acordes</h4>
<p>Em vez de tocar a nota raiz no baixo, experimente começar com a terça ou quinta. Isso muda o som e a função do acorde.</p>
<ul>
<li><strong>C (Dó)</strong> = Dó-Mi-Sol (posição fundamental)</li>
<li><strong>C/E</strong> = Mi-Sol-Dó (1ª inversão)</li>
<li><strong>C/G</strong> = Sol-Dó-Mi (2ª inversão)</li>
</ul>

<h4>3. Acordes com Extensões</h4>
<p>Acordes podem ter notas adicionais além da tônica, terça e quinta:</p>
<ul>
<li><strong>9ª (add9)</strong>: som etéreo, moderno. Ex: Cadd9 = C-E-G-D</li>
<li><strong>7M (maj7)</strong>: som jazz, sofisticado. Ex: Cmaj7 = C-E-G-B</li>
<li><strong>6ª (6)</strong>: retrô. Ex: C6 = C-E-G-A</li>
<li><strong>11ª (11)</strong>: jazz fusion. Ex: Cm11</li>
<li><strong>13ª (13)</strong>: jazz. Ex: C13</li>
</ul>

<h4>4. Acordes Suspensos (Sus)</h4>
<ul>
<li><strong>Sus2</strong>: substitui a terça pela 2ª. Som ambíguo, "arejado"</li>
<li><strong>Sus4</strong>: substitui a terça pela 4ª. Som tenso, pede resolução</li>
</ul>
<p>Exemplo: Dsus4 → D (resolve a tensão)</p>

<h4>5. Substituição de Acordes</h4>
<p>Em harmonias avançadas, podemos substituir acordes por outros com função semelhante:</p>
<ul>
<li><strong>SubV (Sub-dominante)</strong>: trocar o V7 pelo bVII7. Ex: em C, G7 → F7</li>
<li><strong>Acorde relativo menor</strong>: vi pode substituir I em alguns contextos</li>
<li><strong>Diminuto passando</strong>: usar diminuto entre dois acordes para criar movimento</li>
</ul>

<h4>6. Acordes de Abertura (Slash Chords)</h4>
<p>Quando aparece "C/E", significa acorde de C com a nota E no baixo. Isso muda a função harmônica.</p>
<ul>
<li><strong>G/B</strong>: acorde de G com B no baixo (preparação para C)</li>
<li><strong>Am/G</strong>: Am com G no baixo (preparação para F)</li>
</ul>

<h4>7. Aplicação Prática: Como Tocar MPB/Bossa</h4>
<ol>
<li>Em vez de tocar acordes "cheios" (com pestano), use tríades</li>
<li>Experimente inverter as posições - toque o acorde em região mais aguda do braço</li>
<li>Adicione extensões em pontos estratégicos (geralmente em finais de frase)</li>
<li>Use sus4 antes de resolver no acorde principal</li>
</ol>

<h4>Exercício: Jazz-ificar Uma Música Simples</h4>
<p>Pegue "Asa Branca" e toque assim:</p>
<ul>
<li>Em vez de G → use Gmaj7 → G7</li>
<li>Em vez de C → use C7M</li>
<li>Em vez de D → use D7 → D7M9</li>
<li>Adicione Dsus4 antes do D</li>
</ul>
<p>O resultado é uma versão mais sofisticada da mesma música.</p>

<h4>💡 Dica</h4>
<p>Estude grandes harmonistas: Tom Jobim, João Gilberto, Djavan, Milton Nascimento, Baden Powell. Aprenda as músicas deles e veja como usam essas técnicas.</p>
    `
  },
  {
    id: 'l10', level: 'advanced', order: 10,
    title: '10. Composição - Criando Suas Próprias Músicas', duration: '90 min',
    summary: 'O passo final: compor suas próprias canções',
    content: `
<h3>Compondo Sua Primeira Música</h3>
<p>Compor não é um dom misterioso - é uma habilidade que se aprende. Toda grande música que você conhece foi feita por alguém que um dia começou com 4 acordes e uma ideia.</p>

<h4>Passo 1: Defina o Tom e a Emoção</h4>
<p>Toda música tem uma emoção central. Pergunte-se:</p>
<ul>
<li>É alegre ou melancólica?</li>
<li>É agitada ou calma?</li>
<li>Qual a história que quero contar?</li>
</ul>
<p>Isso vai definir o tom (maior/menor), o BPM e a escolha de acordes.</p>

<h4>Passo 2: Crie a Progressão de Acordes</h4>
<p>Comece com uma progressão simples que você goste:</p>
<ul>
<li><strong>I-V-vi-IV</strong> (pop moderno): C-G-Am-F</li>
<li><strong>vi-IV-I-V</strong> (pop melancólico): Am-F-C-G</li>
<li><strong>I-vi-IV-V</strong> (anos 50): C-Am-F-G</li>
<li><strong>ii-V-I-vi</strong> (jazz/MPB): Dm-G-C-Am</li>
</ul>

<h4>Passo 3: Crie a Melodia</h4>
<p>A melodia é a parte que "cantarolamos". Algumas dicas:</p>
<ul>
<li><strong>Comece na tônica</strong> (nota do acorde principal) e vá subindo</li>
<li><strong>Use a escala do tom</strong>: se está em C Maior, use notas de C D E F G A B</li>
<li><strong>Salto de quarta ou quinta</strong> nas frases mais marcantes</li>
<li><strong>Resolução na tônica</strong> no final das frases</li>
</ul>

<h4>Passo 4: Estruture a Música</h4>
<p>Toda música popular tem uma estrutura. A mais comum:</p>
<ul>
<li><strong>Intro</strong> (4-8 compassos): apresenta o clima</li>
<li><strong>Verso 1</strong> (8-16 compassos): apresenta a história</li>
<li><strong>Refrão</strong> (8-16 compassos): a parte marcante, com o título da música</li>
<li><strong>Verso 2</strong> (mesma melodia do verso 1, mas com letra diferente)</li>
<li><strong>Refrão</strong> (repete)</li>
<li><strong>Bridge</strong> (opcional, 4-8 compassos): parte diferente, geralmente contrasta com o resto</li>
<li><strong>Refrão final</strong> (pode ser com letra modificada ou mais intenso)</li>
<li><strong>Outro</strong> (instrumental de saída)</li>
</ul>

<h4>Passo 5: Escreva a Letra</h4>
<p>A letra deve caber na melodia. Algumas dicas:</p>
<ul>
<li><strong>Rima sem forçar</strong>: rimas naturais, sem precisar inverter palavras</li>
<li><strong>Mostre, não conte</strong>: "Seus olhos brilham como o sol" é melhor que "Você é bonita"</li>
<li><strong>História clara</strong>: tem começo, meio e fim</li>
<li><strong>Repita o refrão</strong> várias vezes - é a parte que as pessoas vão lembrar</li>
</ul>

<h4>Passo 6: Refine e Arranje</h4>
<ul>
<li>Toque para outras pessoas e peça feedback</li>
<li>Grave no celular pra ouvir com distância crítica</li>
<li>Experimente variar a dinâmica (intensidade) entre verso e refrão</li>
<li>Adicione uma introdução marcante - pode ser o riff do refrão</li>
</ul>

<h4>Ferramentas Úteis</h4>
<ul>
<li><strong>Gravador do celular</strong>: para capturar ideias rapidamente</li>
<li><strong>App de cifras</strong>: para anotar progressões</li>
<li><strong>YouTube</strong>: pesquise "como compor músicas" - há cursos excelentes</li>
</ul>

<h4>Exercício: Componha Uma Música Hoje</h4>
<ol>
<li>Escolha a emoção: "alegre"</li>
<li>Tom: G Maior</li>
<li>Progressão: G - D - Em - C (I-V-vi-IV)</li>
<li>Cante uma melodia sobre esses acordes (grava!)</li>
<li>Escreva 1 verso e 1 refrão</li>
<li>Toque para alguém</li>
</ol>

<h4>💡 Dica Final</h4>
<p>Suas primeiras composições serão desajeitadas - e está tudo bem! Cada música que você compõe, mesmo que nunca seja publicada, te ensina algo. Os grandes compositores têm centenas de músicas "ruins" no currículo antes de fazerem a grande.</p>
<p>O importante é COMEÇAR. Não espere a inspiração - ela vem enquanto você trabalha.</p>
    `
  }
];

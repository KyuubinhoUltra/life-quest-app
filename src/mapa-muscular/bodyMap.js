// LifeQuest – Mapa muscular
// Liga os grupos musculares do LifeQuest às regiões do corpo da biblioteca
// react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham).

// ---------------------------------------------------------------- grupos
export const GRUPOS = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  trapezio: 'Trapézio',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  abdomen: 'Abdômen',
  obliquos: 'Oblíquos',
  lombar: 'Lombar',
  gluteos: 'Glúteos',
  quadriceps: 'Quadríceps',
  adutores: 'Adutores',
  posterior: 'Posterior',
  panturrilha: 'Panturrilha',
};

// grupo do LifeQuest -> regiões (slugs) da biblioteca
export const SLUGS = {
  peito: ['chest'],
  costas: ['upper-back'],
  ombros: ['deltoids'],
  trapezio: ['trapezius'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  antebraco: ['forearm'],
  abdomen: ['abs'],
  obliquos: ['obliques'],
  lombar: ['lower-back'],
  gluteos: ['gluteal'],
  quadriceps: ['quadriceps'],
  adutores: ['adductors'],
  posterior: ['hamstring'],
  panturrilha: ['calves', 'tibialis'],
};

// região da biblioteca -> grupo do LifeQuest (para o toque no boneco)
export const SLUG_PARA_GRUPO = Object.fromEntries(
  Object.entries(SLUGS).flatMap(([grupo, slugs]) => slugs.map((s) => [s, grupo]))
);

export const SEXO_PARA_GENERO = { homem: 'male', mulher: 'female' };
export const LADO_PARA_SIDE = { frente: 'front', costas: 'back' };

// ---------------------------------------------------------------- cores
export const CORES = {
  ombros: '#e8953a',
  peito: '#d95f3d',
  biceps: '#e0568f',
  triceps: '#8b5fd6',
  antebraco: '#a97c5d',
  abdomen: '#d6aa2c',
  obliquos: '#e3c04e',
  trapezio: '#38b886',
  costas: '#3f8fd9',
  lombar: '#c8d34a',
  gluteos: '#d0507e',
  quadriceps: '#5b75dc',
  adutores: '#8aa0ee',
  posterior: '#e07a5f',
  panturrilha: '#7fcf9a',
};

export const TEMAS = {
  escuro: { palco: '#11131d', neutro: '#454a5c', parado: '#2a2e3e', cabelo: '#32364a' },
  claro: { palco: '#f7f7fa', neutro: '#c4c7d2', parado: '#d8dae3', cabelo: '#a7abb8' },
  // tema do app (preto + laranja): palco = cor do cartão onde o boneco fica
  lifequest: { palco: '#161616', neutro: '#3a3a3a', parado: '#2a2a2a', cabelo: '#333333' },
};

// mistura duas cores hex: t = quanto da cor A (0 a 1)
export function misturar(hexA, hexB, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hexA);
  const b = p(hexB);
  const c = a.map((v, i) => Math.round(v * t + b[i] * (1 - t)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- dados para o <Body />
// principais / secundarios: listas de chaves de GRUPOS (ex.: ['peito', 'ombros'])
export function montarDados({ principais = [], secundarios = [], tema = 'escuro' } = {}) {
  const t = TEMAS[tema] || TEMAS.escuro;
  const dados = [];
  Object.keys(GRUPOS).forEach((grupo) => {
    let cor = t.parado;
    if (principais.includes(grupo)) cor = CORES[grupo];
    else if (secundarios.includes(grupo)) cor = misturar(CORES[grupo], t.parado, 0.45);
    SLUGS[grupo].forEach((slug) => dados.push({ slug, color: cor }));
  });
  // partes sem músculo (cabeça, mãos, pés...) ficam cinza
  ['head', 'neck', 'hands', 'feet', 'ankles', 'knees'].forEach((slug) => dados.push({ slug, color: t.neutro }));
  dados.push({ slug: 'hair', color: t.cabelo });
  return dados;
}

// ---------------------------------------------------------------- ligação com o gerador de treino
export const PRESETS = {
  Empurrar: { principais: ['peito', 'ombros', 'triceps'], secundarios: ['abdomen'] },
  Puxar: { principais: ['costas', 'trapezio', 'biceps'], secundarios: ['antebraco', 'lombar'] },
  Pernas: { principais: ['quadriceps', 'posterior', 'gluteos', 'adutores'], secundarios: ['panturrilha', 'lombar'] },
  'Corpo todo': { principais: Object.keys(GRUPOS), secundarios: [] },
};

// nomes que o gerador pode usar -> grupos do LifeQuest (sem acento, minúsculo)
const ALIASES = {
  peito: ['peito'], peitoral: ['peito'], chest: ['peito'],
  costas: ['costas'], dorsal: ['costas'], dorsais: ['costas'], lats: ['costas'],
  ombro: ['ombros'], ombros: ['ombros'], deltoide: ['ombros'], deltoides: ['ombros'],
  trapezio: ['trapezio'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  antebraco: ['antebraco'], antebracos: ['antebraco'],
  braco: ['biceps', 'triceps', 'antebraco'], bracos: ['biceps', 'triceps', 'antebraco'],
  abdomen: ['abdomen'], abdominal: ['abdomen'], abdominais: ['abdomen'], abs: ['abdomen'],
  core: ['abdomen', 'obliquos', 'lombar'],
  obliquos: ['obliquos'],
  lombar: ['lombar'],
  gluteo: ['gluteos'], gluteos: ['gluteos'],
  quadriceps: ['quadriceps'], quads: ['quadriceps'], coxa: ['quadriceps'], coxas: ['quadriceps'],
  adutores: ['adutores'],
  posterior: ['posterior'], isquiotibiais: ['posterior'], hamstring: ['posterior'],
  panturrilha: ['panturrilha'], panturrilhas: ['panturrilha'], gemeos: ['panturrilha'], canela: ['panturrilha'], tibial: ['panturrilha'],
  perna: ['quadriceps', 'posterior', 'gluteos', 'adutores', 'panturrilha'],
  pernas: ['quadriceps', 'posterior', 'gluteos', 'adutores', 'panturrilha'],
  'corpo todo': Object.keys(GRUPOS), 'full body': Object.keys(GRUPOS),
};

const limpar = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// 'Peitoral' | ['Costas', 'Bíceps'] -> ['peito'] | ['costas', 'biceps']
export function normalizarGrupos(entrada) {
  const lista = Array.isArray(entrada) ? entrada : entrada == null ? [] : [entrada];
  const saida = [];
  lista.forEach((nome) => {
    const grupos = ALIASES[limpar(nome)] || (GRUPOS[limpar(nome)] ? [limpar(nome)] : []);
    grupos.forEach((g) => { if (!saida.includes(g)) saida.push(g); });
  });
  return saida;
}

// Recebe os exercícios do treino e devolve { principais, secundarios }.
// Cada exercício pode ter: principal / musculo / grupo  (o músculo trabalhado)
//                       e: secundarios / secundario      (músculos de apoio)
export function gruposDoTreino(exercicios = []) {
  const principais = [];
  const apoio = [];
  exercicios.forEach((ex) => {
    normalizarGrupos(ex.principal ?? ex.musculo ?? ex.grupo).forEach((g) => {
      if (!principais.includes(g)) principais.push(g);
    });
    normalizarGrupos(ex.secundarios ?? ex.secundario).forEach((g) => {
      if (!apoio.includes(g)) apoio.push(g);
    });
  });
  return { principais, secundarios: apoio.filter((g) => !principais.includes(g)) };
}

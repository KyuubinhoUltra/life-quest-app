// =============================================================================
// LIFEQUEST — MOTOR DE MISSÕES DE TREINO (100% SEM IA)
// =============================================================================
// Módulo 100% JS puro e 100% determinístico/scriptado — não faz nenhuma
// chamada de rede, não depende de nenhum modelo de IA. A escolha de
// exercícios usa amostragem aleatória balanceada por categoria; a narrativa
// e as dicas vêm de bancos de frases pré-escritas.
//
// Vantagem direta de não ter IA: não existe chave de API pra proteger, nem
// backend proxy pra montar antes de publicar — o resultado é instantâneo e
// funciona até offline.
//
// API pública:
//   Dados:   EXERCICIOS, CLASSES, EQUIPAMENTOS, NIVEIS, GRUPOS_MUSCULARES,
//            CATEGORIA_LABEL, PLANOS
//   Regras:  gerarSplit(classeKey, dias)
//            montarSemanaComExclusoes(splitOriginal, gruposExcluidos, focoKey)
//            obterPool(categorias, equipamento, nivel)
//   Missão:  gerarMissao({ dia, classeKey, config })
// =============================================================================

// -----------------------------------------------------------------------------
// BANCO DE EXERCÍCIOS
// -----------------------------------------------------------------------------
export const EXERCICIOS = [
  // Peito
  { id: "e1", nome: "Flexão de braço", categoria: "peito", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e2", nome: "Flexão com pés elevados", categoria: "peito", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "forca" },
  { id: "e3", nome: "Supino reto com halteres", categoria: "peito", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e4", nome: "Supino inclinado com halteres", categoria: "peito", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e5", nome: "Supino reto na barra", categoria: "peito", equipamento: ["academia"], nivel: "intermediario", tipo: "forca" },
  { id: "e6", nome: "Crucifixo com halteres", categoria: "peito", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e7", nome: "Peck deck (voador)", categoria: "peito", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  // Costas
  { id: "e8", nome: "Remada curvada com halteres", categoria: "costas", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e9", nome: "Remada unilateral com halter", categoria: "costas", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e10", nome: "Puxada frente (pulley)", categoria: "costas", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  { id: "e11", nome: "Remada baixa (pulley)", categoria: "costas", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  { id: "e12", nome: "Barra fixa assistida", categoria: "costas", equipamento: ["academia"], nivel: "intermediario", tipo: "forca" },
  { id: "e13", nome: "Barra fixa", categoria: "costas", equipamento: ["peso_corporal"], nivel: "avancado", tipo: "forca" },
  { id: "e14", nome: "Superman (extensão lombar)", categoria: "costas", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  // Pernas
  { id: "e15", nome: "Agachamento livre", categoria: "pernas", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e16", nome: "Agachamento goblet com halter", categoria: "pernas", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e17", nome: "Agachamento com barra", categoria: "pernas", equipamento: ["academia"], nivel: "intermediario", tipo: "forca" },
  { id: "e18", nome: "Leg press", categoria: "pernas", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  { id: "e19", nome: "Cadeira extensora", categoria: "pernas", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  { id: "e20", nome: "Mesa flexora", categoria: "pernas", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  { id: "e21", nome: "Afundo (avanço)", categoria: "pernas", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e22", nome: "Afundo com halteres", categoria: "pernas", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e23", nome: "Stiff com halteres", categoria: "pernas", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e24", nome: "Elevação pélvica (hip thrust)", categoria: "pernas", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e25", nome: "Elevação pélvica com barra", categoria: "pernas", equipamento: ["academia"], nivel: "intermediario", tipo: "forca" },
  // Panturrilha
  { id: "e26", nome: "Panturrilha em pé", categoria: "panturrilha", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e27", nome: "Panturrilha em pé com halteres", categoria: "panturrilha", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  // Ombros
  { id: "e28", nome: "Desenvolvimento com halteres", categoria: "ombros", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e29", nome: "Desenvolvimento na barra", categoria: "ombros", equipamento: ["academia"], nivel: "intermediario", tipo: "forca" },
  { id: "e30", nome: "Elevação lateral com halteres", categoria: "ombros", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e31", nome: "Elevação frontal com halteres", categoria: "ombros", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e32", nome: "Flexão pike (ombros)", categoria: "ombros", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "forca" },
  { id: "e32b", nome: "Flexão pike apoiada (joelhos no chão)", categoria: "ombros", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  // Bíceps
  { id: "e33", nome: "Rosca direta com halteres", categoria: "biceps", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e34", nome: "Rosca alternada com halteres", categoria: "biceps", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e35", nome: "Rosca martelo", categoria: "biceps", equipamento: ["halteres"], nivel: "iniciante", tipo: "forca" },
  { id: "e35b", nome: "Rosca isométrica com toalha", categoria: "biceps", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  // Tríceps
  { id: "e36", nome: "Tríceps corda (pulley)", categoria: "triceps", equipamento: ["academia"], nivel: "iniciante", tipo: "forca" },
  { id: "e37", nome: "Tríceps testa com halteres", categoria: "triceps", equipamento: ["halteres"], nivel: "intermediario", tipo: "forca" },
  { id: "e38", nome: "Mergulho no banco", categoria: "triceps", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "forca" },
  { id: "e39", nome: "Flexão diamante", categoria: "triceps", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "forca" },
  { id: "e39b", nome: "Flexão diamante apoiada (joelhos no chão)", categoria: "triceps", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  // Core
  { id: "e40", nome: "Prancha", categoria: "core", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e41", nome: "Prancha lateral", categoria: "core", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e42", nome: "Abdominal remador", categoria: "core", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  { id: "e43", nome: "Elevação de pernas", categoria: "core", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "forca" },
  { id: "e44", nome: "Russian twist", categoria: "core", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "forca" },
  // Cardio
  { id: "e45", nome: "Corrida contínua", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "cardio" },
  { id: "e46", nome: "Bike ergométrica", categoria: "cardio", equipamento: ["academia"], nivel: "iniciante", tipo: "cardio" },
  { id: "e47", nome: "Pular corda", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "cardio" },
  { id: "e48", nome: "Burpees", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "cardio" },
  { id: "e49", nome: "Mountain climbers", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "cardio" },
  { id: "e50", nome: "Remo (ergômetro)", categoria: "cardio", equipamento: ["academia"], nivel: "intermediario", tipo: "cardio" },
  { id: "e51", nome: "Sprints intervalados", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "cardio" },
  { id: "e52", nome: "Polichinelo", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "cardio" },
  { id: "e53", nome: "Step-up (subida no banco)", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "cardio" },
  { id: "e54", nome: "Circuito HIIT corpo inteiro", categoria: "cardio", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "cardio" },
  // Mobilidade
  { id: "e55", nome: "Gato-camelo", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e56", nome: "Cachorro olhando para baixo", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e57", nome: "Mobilidade de quadril 90/90", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e58", nome: "Rotação torácica (thread the needle)", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e59", nome: "Alongamento de isquiotibiais", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e60", nome: "Alongamento peitoral na porta", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e61", nome: "Ponte glútea com hold", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e62", nome: "Postura da criança", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e63", nome: "Respiração diafragmática", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e64", nome: "Círculos de ombro com escápula", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "iniciante", tipo: "mobilidade" },
  { id: "e65", nome: "Agachamento profundo com hold", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "mobilidade" },
  { id: "e66", nome: "Prancha lateral com rotação", categoria: "mobilidade", equipamento: ["peso_corporal"], nivel: "intermediario", tipo: "mobilidade" },
];

// -----------------------------------------------------------------------------
// CLASSES — define faixas de volume/descanso. Os campos *Opcoes/*Min/*Max são
// o que o motor usa de verdade pra sortear números concretos (as strings
// setsRepsRange/restRange ficam só pra exibição textual, se for útil na UI).
// -----------------------------------------------------------------------------
export const CLASSES = {
  guerreiro: {
    nome: "Guerreiro",
    foco: "força e hipertrofia",
    setsRepsRange: "3–4 séries de 8–12 repetições",
    restRange: "60–90s de descanso",
    seriesOpcoes: [3, 4],
    repsMin: 8,
    repsMax: 12,
    descansoSeg: [60, 90],
  },
  ranger: {
    nome: "Ranger",
    foco: "cardio e resistência",
    setsRepsRange: "circuitos ou intervalos, 15–20 reps ou por tempo",
    restRange: "20–45s de descanso",
    seriesOpcoes: [3, 4],
    repsMin: 15,
    repsMax: 20,
    descansoSeg: [20, 45],
  },
  monge: {
    nome: "Monge",
    foco: "mobilidade e equilíbrio",
    setsRepsRange: "2–3 séries de 10–15 reps ou holds de 30–45s",
    restRange: "20–30s de descanso",
    seriesOpcoes: [2, 3],
    repsMin: 10,
    repsMax: 15,
    descansoSeg: [20, 30],
  },
};

export const EQUIPAMENTOS = [
  { key: "peso_corporal", label: "Peso do corpo" },
  { key: "halteres", label: "Halteres em casa" },
  { key: "academia", label: "Academia completa" },
];

export const NIVEIS = [
  { key: "iniciante", label: "Iniciante" },
  { key: "intermediario", label: "Intermediário" },
  { key: "avancado", label: "Avançado" },
];

export const GRUPOS_MUSCULARES = [
  { key: "peito", label: "Peito", cats: ["peito"] },
  { key: "costas", label: "Costas", cats: ["costas"] },
  { key: "pernas", label: "Pernas", cats: ["pernas", "panturrilha"] },
  { key: "ombros", label: "Ombros", cats: ["ombros"] },
  { key: "bracos", label: "Braços", cats: ["biceps", "triceps"] },
  { key: "core", label: "Core / abdômen", cats: ["core"] },
];

export const CATEGORIA_LABEL = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  panturrilha: "Panturrilha",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  core: "Core",
  cardio: "Cardio",
  mobilidade: "Mobilidade",
};

// -----------------------------------------------------------------------------
// MOTOR DE REGRAS — decide o split da semana. Inalterado desde a versão com
// IA: essa camada nunca dependeu de IA, só a escolha de exercícios dependia.
// -----------------------------------------------------------------------------
export const PLANOS = {
  guerreiro: {
    2: [
      { label: "Corpo Inteiro A", cat: ["peito", "costas", "pernas"], tipo: "forca" },
      { label: "Corpo Inteiro B", cat: ["ombros", "pernas", "core", "biceps", "triceps"], tipo: "forca" },
    ],
    3: [
      { label: "Corpo Inteiro A", cat: ["peito", "triceps", "pernas"], tipo: "forca" },
      { label: "Corpo Inteiro B", cat: ["costas", "biceps", "core"], tipo: "forca" },
      { label: "Corpo Inteiro C", cat: ["ombros", "pernas", "panturrilha"], tipo: "forca" },
    ],
    4: [
      { label: "Superiores A", cat: ["peito", "ombros", "triceps"], tipo: "forca" },
      { label: "Inferiores A", cat: ["pernas", "core"], tipo: "forca" },
      { label: "Superiores B", cat: ["costas", "biceps", "ombros"], tipo: "forca" },
      { label: "Inferiores B", cat: ["pernas", "panturrilha", "core"], tipo: "forca" },
    ],
    5: [
      { label: "Peito e Tríceps", cat: ["peito", "triceps"], tipo: "forca" },
      { label: "Costas e Bíceps", cat: ["costas", "biceps"], tipo: "forca" },
      { label: "Pernas", cat: ["pernas", "panturrilha"], tipo: "forca" },
      { label: "Ombros e Core", cat: ["ombros", "core"], tipo: "forca" },
      { label: "Corpo Inteiro (Leve)", cat: ["pernas", "core", "mobilidade"], tipo: "forca" },
    ],
    6: [
      { label: "Peito", cat: ["peito"], tipo: "forca" },
      { label: "Costas", cat: ["costas"], tipo: "forca" },
      { label: "Pernas", cat: ["pernas", "panturrilha"], tipo: "forca" },
      { label: "Ombros", cat: ["ombros"], tipo: "forca" },
      { label: "Braços e Core", cat: ["biceps", "triceps", "core"], tipo: "forca" },
      { label: "Corpo Inteiro (Leve)", cat: ["pernas", "core", "mobilidade"], tipo: "forca" },
    ],
  },
  ranger: {
    2: [
      { label: "Intervalos (HIIT)", cat: ["cardio"], tipo: "cardio" },
      { label: "Corrida Contínua", cat: ["cardio"], tipo: "cardio" },
    ],
    3: [
      { label: "Intervalos (HIIT)", cat: ["cardio"], tipo: "cardio" },
      { label: "Circuito de Resistência", cat: ["cardio", "core"], tipo: "cardio" },
      { label: "Corrida Contínua", cat: ["cardio"], tipo: "cardio" },
    ],
    4: [
      { label: "Intervalos (HIIT)", cat: ["cardio"], tipo: "cardio" },
      { label: "Corrida Contínua", cat: ["cardio"], tipo: "cardio" },
      { label: "Circuito de Resistência", cat: ["cardio", "core"], tipo: "cardio" },
      { label: "Mobilidade Ativa", cat: ["mobilidade"], tipo: "mobilidade" },
    ],
    5: [
      { label: "Intervalos (HIIT)", cat: ["cardio"], tipo: "cardio" },
      { label: "Corrida Contínua", cat: ["cardio"], tipo: "cardio" },
      { label: "Circuito de Resistência", cat: ["cardio", "core"], tipo: "cardio" },
      { label: "Corrida Longa", cat: ["cardio"], tipo: "cardio" },
      { label: "Mobilidade Ativa", cat: ["mobilidade"], tipo: "mobilidade" },
    ],
    6: [
      { label: "Intervalos (HIIT)", cat: ["cardio"], tipo: "cardio" },
      { label: "Corrida Contínua", cat: ["cardio"], tipo: "cardio" },
      { label: "Circuito de Resistência", cat: ["cardio", "core"], tipo: "cardio" },
      { label: "Corrida Longa", cat: ["cardio"], tipo: "cardio" },
      { label: "Circuito de Resistência", cat: ["cardio", "core"], tipo: "cardio" },
      { label: "Mobilidade Ativa", cat: ["mobilidade"], tipo: "mobilidade" },
    ],
  },
  monge: {
    base: [
      { label: "Quadril e Coluna", cat: ["mobilidade"], tipo: "mobilidade" },
      { label: "Ombros e Peitoral", cat: ["mobilidade"], tipo: "mobilidade" },
      { label: "Cadeia Posterior", cat: ["mobilidade"], tipo: "mobilidade" },
      { label: "Equilíbrio e Core", cat: ["mobilidade", "core"], tipo: "mobilidade" },
      { label: "Respiração e Recuperação", cat: ["mobilidade"], tipo: "mobilidade" },
      { label: "Corpo Inteiro (Fluxo)", cat: ["mobilidade", "core"], tipo: "mobilidade" },
    ],
  },
};

export function gerarSplit(classeKey, dias) {
  const d = Math.max(2, Math.min(6, dias));
  if (classeKey === "monge") return PLANOS.monge.base.slice(0, d);
  return PLANOS[classeKey][d];
}

export function relabelarDia(diaAjustado, catOriginal) {
  const mudou = catOriginal.length !== diaAjustado.cat.length;
  const generico = /inteiro|superiores/i.test(diaAjustado.label);
  if (!mudou || generico) return diaAjustado.label;
  const nomes = [...new Set(diaAjustado.cat.map((c) => CATEGORIA_LABEL[c] || c))];
  return nomes.join(" e ");
}

export const CATEGORIAS_TREINAVEIS = ["peito", "costas", "pernas", "ombros", "biceps", "triceps", "core"];

export function expandirCategoria(c) {
  return c === "pernas" ? ["pernas", "panturrilha"] : [c];
}

export function contarFrequencia(dias) {
  const freq = {};
  CATEGORIAS_TREINAVEIS.forEach((c) => (freq[c] = 0));
  dias.forEach((d) => d.cat.forEach((c) => { if (freq[c] !== undefined) freq[c] += 1; }));
  return freq;
}

export function proximaCategoria(freq, excluidas, evitar) {
  const elegiveis = CATEGORIAS_TREINAVEIS.filter((c) => !excluidas.includes(c) && !evitar.includes(c));
  if (elegiveis.length === 0) return null;
  return elegiveis.reduce((menor, c) => (freq[c] < freq[menor] ? c : menor), elegiveis[0]);
}

export function gerarDiaSubstituto(freq, excluidas, focoKey, jaUsouFoco) {
  let primaria = null;
  const focoComoCategoria = focoKey === "bracos" ? "biceps" : focoKey;
  if (focoKey && !jaUsouFoco.has(focoKey) && focoComoCategoria && !excluidas.includes(focoComoCategoria)) {
    primaria = focoComoCategoria;
    jaUsouFoco.add(focoKey);
  } else {
    primaria = proximaCategoria(freq, excluidas, []);
  }
  if (!primaria) return null;

  const secundaria = focoKey === "bracos" && primaria === "biceps" ? "triceps" : proximaCategoria(freq, excluidas, [primaria]);
  const cats = [...new Set([...expandirCategoria(primaria), ...(secundaria ? expandirCategoria(secundaria) : [])])];
  cats.forEach((c) => { if (freq[c] !== undefined) freq[c] += 1; });

  const label = `${[...new Set(cats.map((c) => CATEGORIA_LABEL[c] || c))].join(" e ")} (extra)`;
  return { label, cat: cats, tipo: "forca" };
}

export function montarSemanaComExclusoes(splitOriginal, gruposExcluidos, focoKey) {
  const processados = splitOriginal.map((d) => {
    const catFiltrado = d.cat.filter((c) => !gruposExcluidos.includes(c));
    if (catFiltrado.length === 0) return { substituir: true };
    const diaAjustado = { ...d, cat: catFiltrado };
    diaAjustado.label = relabelarDia(diaAjustado, d.cat);
    return { substituir: false, dia: diaAjustado };
  });

  const sobreviventes = processados.filter((p) => !p.substituir).map((p) => p.dia);
  const freq = contarFrequencia(sobreviventes);
  const jaUsouFoco = new Set();

  return processados
    .map((p) => (p.substituir ? gerarDiaSubstituto(freq, gruposExcluidos, focoKey, jaUsouFoco) : p.dia))
    .filter(Boolean);
}

export const ORDEM_NIVEL = { iniciante: 1, intermediario: 2, avancado: 3 };

export function obterPool(categorias, equipamento, nivel) {
  const maxNivel = ORDEM_NIVEL[nivel] || 2;
  const equipPermitido =
    equipamento === "academia"
      ? ["peso_corporal", "halteres", "academia"]
      : equipamento === "halteres"
      ? ["peso_corporal", "halteres"]
      : ["peso_corporal"];
  return EXERCICIOS.filter(
    (ex) =>
      categorias.includes(ex.categoria) &&
      ex.equipamento.some((e) => equipPermitido.includes(e)) &&
      ORDEM_NIVEL[ex.nivel] <= maxNivel
  );
}

// -----------------------------------------------------------------------------
// SELEÇÃO DE EXERCÍCIOS — substitui a IA. Amostragem aleatória com round-robin
// por categoria, pra garantir que um dia misto (ex.: "Ombros e Core") não saia
// todo de uma categoria só por sorte.
// -----------------------------------------------------------------------------
function escolherAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function embaralhar(arr) {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function escolherExercicios(pool, qtd, categorias) {
  const porCategoria = {};
  categorias.forEach((c) => {
    const doTipo = pool.filter((e) => e.categoria === c);
    if (doTipo.length) porCategoria[c] = embaralhar(doTipo);
  });

  const chaves = Object.keys(porCategoria);
  const escolhidos = [];
  let rodada = 0;
  while (escolhidos.length < qtd && chaves.some((c) => porCategoria[c][rodada])) {
    for (const c of chaves) {
      if (escolhidos.length >= qtd) break;
      if (porCategoria[c][rodada]) escolhidos.push(porCategoria[c][rodada]);
    }
    rodada++;
  }
  return escolhidos;
}

function gerarSeriesRepsDescanso(exercicio, classeInfo) {
  const series = escolherAleatorio(classeInfo.seriesOpcoes);
  const descanso = `${escolherAleatorio(classeInfo.descansoSeg)}s`;

  if (exercicio.tipo === "cardio") {
    const duracao = escolherAleatorio([20, 30, 40, 45, 60]);
    return { series, repeticoes: `${duracao}s`, descanso };
  }
  if (exercicio.tipo === "mobilidade") {
    const duracao = escolherAleatorio([20, 30, 40]);
    return { series, repeticoes: `${duracao}s (hold)`, descanso };
  }
  const reps = Math.floor(Math.random() * (classeInfo.repsMax - classeInfo.repsMin + 1)) + classeInfo.repsMin;
  return { series, repeticoes: `${reps}`, descanso };
}

// -----------------------------------------------------------------------------
// BANCOS DE FRASES — narrativa e dicas, sem IA nenhuma.
// -----------------------------------------------------------------------------
const FLAVOR_GUERREIRO = [
  { missao: "Forja do Guerreiro", narrativa: "Cada repetição forja um pouco mais de força." },
  { missao: "Provação de Ferro", narrativa: "O corpo responde ao desafio com determinação." },
  { missao: "Marcha da Força", narrativa: "Um passo de cada vez rumo ao próximo nível." },
  { missao: "Ritual do Aço", narrativa: "Disciplina e esforço moldam o guerreiro." },
  { missao: "Desafio da Disciplina", narrativa: "Consistência vale mais que intensidade de um único dia." },
  { missao: "Trilha do Combate", narrativa: "Cada série é um passo a mais na sua evolução." },
  { missao: "Prova de Resistência", narrativa: "O músculo cresce onde a vontade não recua." },
  { missao: "Chamado da Batalha", narrativa: "Hoje o campo de treino é seu território." },
  { missao: "Têmpera do Corpo", narrativa: "O esforço de hoje é a força de amanhã." },
  { missao: "Missão do Ferro", narrativa: "Cada carga levantada conta uma história de progresso." },
];

const FLAVOR_RANGER = [
  { missao: "Trilha da Resistência", narrativa: "Cada passo constrói fôlego pra próxima jornada." },
  { missao: "Corrida do Vento", narrativa: "Velocidade e resistência andam juntas hoje." },
  { missao: "Caçada de Ritmo", narrativa: "Manter o ritmo é tão importante quanto a intensidade." },
  { missao: "Rota da Resistência", narrativa: "O corpo se adapta a cada quilômetro percorrido." },
  { missao: "Desafio do Fôlego", narrativa: "Respiração controlada, passos constantes." },
  { missao: "Percurso do Explorador", narrativa: "Cada intervalo te deixa mais rápido e mais forte." },
  { missao: "Marcha Acelerada", narrativa: "Hoje o objetivo é durar mais um pouco." },
  { missao: "Trote do Guardião", narrativa: "Constância vence velocidade isolada." },
  { missao: "Circuito da Persistência", narrativa: "Cada round te aproxima do seu limite real." },
  { missao: "Jornada sem Pressa", narrativa: "Resistência se constrói com repetição, não com pressa." },
];

const FLAVOR_MONGE = [
  { missao: "Fluxo do Equilíbrio", narrativa: "Movimento consciente traz clareza ao corpo." },
  { missao: "Caminho da Serenidade", narrativa: "Mobilidade é a base de tudo o mais." },
  { missao: "Respiração do Monge", narrativa: "Cada alongamento é um momento de presença." },
  { missao: "Prática da Quietude", narrativa: "O corpo agradece o cuidado de hoje." },
  { missao: "Ritual da Amplitude", narrativa: "Mais mobilidade, menos limitação." },
  { missao: "Meditação em Movimento", narrativa: "Cada postura fortalece corpo e mente." },
  { missao: "Equilíbrio Interior", narrativa: "A calma de hoje sustenta a força de amanhã." },
  { missao: "Fluxo da Recuperação", narrativa: "Recuperar bem é treinar melhor amanhã." },
  { missao: "Caminho Suave", narrativa: "Progresso não precisa ser intenso pra ser real." },
  { missao: "Prática do Presente", narrativa: "Um minuto de atenção plena vale por muitos de pressa." },
];

function escolherFlavor(classeKey) {
  const banco = { guerreiro: FLAVOR_GUERREIRO, ranger: FLAVOR_RANGER, monge: FLAVOR_MONGE }[classeKey] || FLAVOR_GUERREIRO;
  return escolherAleatorio(banco);
}

const DICAS_FORCA = [
  "Se completou todas as séries com folga, aumente a carga na próxima sessão.",
  "Foque na execução controlada antes de aumentar o peso.",
  "Tente adicionar 1 repetição a mais em cada série na próxima semana.",
  "Descanse o suficiente entre séries pra manter a qualidade do movimento.",
  "Anote a carga usada hoje pra comparar na próxima semana.",
];
const DICAS_CARDIO = [
  "Tente reduzir o tempo de descanso entre os rounds na próxima sessão.",
  "Aumente a duração total em alguns minutos na próxima semana.",
  "Mantenha um ritmo constante em vez de acelerar só no início.",
  "Hidrate-se bem antes e depois do treino.",
  "Se sentiu fácil hoje, aumente a intensidade dos intervalos.",
];
const DICAS_MOBILIDADE = [
  "Respire fundo durante cada alongamento pra aumentar a amplitude.",
  "Tente segurar cada posição por mais alguns segundos na próxima vez.",
  "Movimentos lentos trazem mais benefício que movimentos rápidos aqui.",
  "Pratique isso em dias de descanso também, não só nos dias marcados.",
  "Consistência importa mais que intensidade nesse tipo de treino.",
];

function escolherDica(tipoDia) {
  const banco = { forca: DICAS_FORCA, cardio: DICAS_CARDIO, mobilidade: DICAS_MOBILIDADE }[tipoDia] || DICAS_FORCA;
  return escolherAleatorio(banco);
}

// -----------------------------------------------------------------------------
// ORQUESTRAÇÃO DA MISSÃO — substitui gerarMissaoAPI. Síncrono, sem rede.
// Sempre retorna { ok: true, dados } ou { ok: false, erro }.
// -----------------------------------------------------------------------------
export function gerarMissao({ dia, classeKey, config }) {
  const classeInfo = CLASSES[classeKey];
  const focoGrupo = config.foco ? GRUPOS_MUSCULARES.find((g) => g.key === config.foco) : null;
  const temEnfase = focoGrupo ? dia.cat.some((c) => focoGrupo.cats.includes(c)) : false;
  const numExercicios = (dia.tipo === "cardio" ? 4 : 5) + (temEnfase ? 1 : 0);

  const poolCompleto = obterPool(dia.cat, config.equipamento, config.nivel);
  if (poolCompleto.length === 0) {
    return { ok: false, erro: "Nenhum exercício disponível para essa combinação. Ajuste equipamento ou nível." };
  }

  const qtd = Math.min(numExercicios, poolCompleto.length);
  const escolhidos = escolherExercicios(poolCompleto, qtd, dia.cat);
  const exercicios = escolhidos.map((ex) => ({ nome: ex.nome, ...gerarSeriesRepsDescanso(ex, classeInfo) }));

  const flavor = escolherFlavor(classeKey);
  const xp = 50 + qtd * 4 + Math.floor(Math.random() * 10);

  return {
    ok: true,
    dados: {
      missao: flavor.missao,
      narrativa: flavor.narrativa,
      exercicios,
      xp,
      dica_progressao: escolherDica(dia.tipo),
    },
  };
}

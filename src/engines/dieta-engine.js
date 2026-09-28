// =============================================================================
// LIFEQUEST — MOTOR DE CARDÁPIOS (100% SEM IA)
// =============================================================================
// Mesmo padrão do lifequest_treino_engine.js: 100% determinístico, sem
// nenhuma chamada de rede. A escolha de receitas usa "vizinho mais próximo"
// da meta calórica de cada refeição, evitando repetir uma receita tanto no
// mesmo dia quanto nos outros dias já gerados da semana; narrativa e dica
// vêm de bancos de frases.
//
// Os valores nutricionais SEMPRE vêm do banco local; a porção é escalada (0,5×–2×)
// pra aproximar a meta calórica de cada refeição.
//
// API pública:
//   Dados:   RECEITAS, ATIVIDADES, OBJETIVOS, RESTRICOES_ALIMENTARES,
//            SEXO_BIOLOGICO, OPCOES_REFEICOES_DIA, LABEL_SLOT
//   Regras:  calcularTDEE(perfil), calcularMetaCalorica(tdee, objetivo),
//            calcularMacros(metaCalorica, objetivo),
//            gerarSemanaDieta(refeicoesPorDia), obterPoolReceitas(tipoPool, restricoes)
//   Cardápio: gerarCardapio({ dia, config, usadasNaSemana? })
// =============================================================================

// -----------------------------------------------------------------------------
// BANCO DE RECEITAS
// -----------------------------------------------------------------------------
// Nomes escolhidos pra serem reconhecíveis em qualquer região do Brasil,
// evitando pratos amarrados a uma cultura regional específica (ex.: "cuscuz
// de milho" em vez de "cuscuz nordestino", "tapioca com queijo" em vez de
// "queijo coalho").
export const RECEITAS = [
  // Café da manhã
  { id: "r1", nome: "Ovos mexidos com torrada integral", porcao: "2 ovos + 2 fatias de pão (≈150g)", tipos: ["cafe"], calorias: 320, proteina: 18, carboidrato: 28, gordura: 14, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: false },
  { id: "r2", nome: "Vitamina de banana com aveia", porcao: "1 copo (≈300ml)", tipos: ["cafe"], calorias: 280, proteina: 9, carboidrato: 50, gordura: 6, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r3", nome: "Panqueca de aveia e banana", porcao: "2 panquecas médias (≈180g)", tipos: ["cafe"], calorias: 300, proteina: 10, carboidrato: 45, gordura: 8, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r4", nome: "Tapioca com queijo", porcao: "1 unidade (≈120g)", tipos: ["cafe"], calorias: 260, proteina: 12, carboidrato: 35, gordura: 9, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r5", nome: "Iogurte natural com granola e frutas", porcao: "1 tigela (≈250g)", tipos: ["cafe"], calorias: 290, proteina: 12, carboidrato: 40, gordura: 8, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: false },
  { id: "r6", nome: "Mingau de aveia com frutas", porcao: "1 tigela (≈250g)", tipos: ["cafe"], calorias: 270, proteina: 8, carboidrato: 48, gordura: 5, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r7", nome: "Omelete de claras com espinafre", porcao: "3 claras (≈150g)", tipos: ["cafe"], calorias: 220, proteina: 24, carboidrato: 6, gordura: 10, vegetariano: true, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r8", nome: "Pão integral com pasta de amendoim e banana", porcao: "2 fatias (≈120g)", tipos: ["cafe"], calorias: 340, proteina: 12, carboidrato: 42, gordura: 14, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: false },
  { id: "r9", nome: "Smoothie verde de couve, abacaxi e gengibre", porcao: "1 copo (≈300ml)", tipos: ["cafe"], calorias: 190, proteina: 4, carboidrato: 42, gordura: 1, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r10", nome: "Cuscuz de milho com ovo", porcao: "1 fatia + 1 ovo (≈200g)", tipos: ["cafe"], calorias: 310, proteina: 14, carboidrato: 44, gordura: 8, vegetariano: true, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r11b", nome: "Panqueca americana com mel", porcao: "3 panquecas pequenas (≈150g)", tipos: ["cafe"], calorias: 280, proteina: 8, carboidrato: 45, gordura: 7, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: false },
  { id: "r12b", nome: "Mamão com aveia e canela", porcao: "1 prato médio (≈250g)", tipos: ["cafe"], calorias: 220, proteina: 5, carboidrato: 45, gordura: 2, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r13b", nome: "Sanduíche natural de frango", porcao: "1 sanduíche (≈180g)", tipos: ["cafe"], calorias: 310, proteina: 20, carboidrato: 35, gordura: 10, vegetariano: false, vegano: false, sem_lactose: false, sem_gluten: false },
  { id: "r14b", nome: "Iogurte vegano com frutas e chia", porcao: "1 copo (≈220g)", tipos: ["cafe"], calorias: 210, proteina: 7, carboidrato: 32, gordura: 6, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r15b", nome: "Ovos cozidos com abacate amassado", porcao: "2 ovos + meio abacate (≈180g)", tipos: ["cafe"], calorias: 260, proteina: 14, carboidrato: 10, gordura: 18, vegetariano: true, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r16b", nome: "Bowl de frutas com granola", porcao: "1 tigela (≈300g)", tipos: ["cafe"], calorias: 240, proteina: 5, carboidrato: 48, gordura: 4, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: false },
  // Almoço / Jantar
  { id: "r17", nome: "Frango grelhado com arroz integral e brócolis", porcao: "1 filé + acompanhamentos (≈380g)", tipos: ["almoco", "janta"], calorias: 480, proteina: 42, carboidrato: 48, gordura: 12, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r18", nome: "Filé de peixe com batata doce e salada", porcao: "1 filé + acompanhamentos (≈350g)", tipos: ["almoco", "janta"], calorias: 420, proteina: 38, carboidrato: 40, gordura: 10, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r19", nome: "Carne moída com abóbora e feijão", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 500, proteina: 35, carboidrato: 45, gordura: 18, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r20", nome: "Omelete de legumes com salada", porcao: "2 ovos + salada (≈280g)", tipos: ["almoco", "janta"], calorias: 380, proteina: 24, carboidrato: 18, gordura: 22, vegetariano: true, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r21", nome: "Grão-de-bico ao curry com arroz", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 460, proteina: 16, carboidrato: 70, gordura: 12, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r22", nome: "Tofu grelhado com legumes salteados", porcao: "1 prato (≈320g)", tipos: ["almoco", "janta"], calorias: 400, proteina: 22, carboidrato: 30, gordura: 20, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r23", nome: "Lentilha com arroz e couve refogada", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 440, proteina: 18, carboidrato: 75, gordura: 6, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r24", nome: "Salmão grelhado com aspargos", porcao: "1 filé + acompanhamento (≈300g)", tipos: ["almoco", "janta"], calorias: 460, proteina: 38, carboidrato: 12, gordura: 28, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r25", nome: "Macarrão integral ao molho de tomate com frango desfiado", porcao: "1 prato (≈400g)", tipos: ["almoco", "janta"], calorias: 520, proteina: 36, carboidrato: 65, gordura: 10, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: false },
  { id: "r26", nome: "Quinoa com legumes e grão-de-bico", porcao: "1 prato (≈350g)", tipos: ["almoco", "janta"], calorias: 430, proteina: 15, carboidrato: 68, gordura: 10, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r27", nome: "Escondidinho de frango com mandioca", porcao: "1 porção (≈350g)", tipos: ["almoco", "janta"], calorias: 470, proteina: 30, carboidrato: 55, gordura: 14, vegetariano: false, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r28", nome: "Berinjela recheada com quinoa e legumes", porcao: "2 metades (≈320g)", tipos: ["almoco", "janta"], calorias: 380, proteina: 12, carboidrato: 55, gordura: 12, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r29", nome: "Peito de peru grelhado com purê de batata", porcao: "1 filé + purê (≈330g)", tipos: ["almoco", "janta"], calorias: 400, proteina: 34, carboidrato: 42, gordura: 8, vegetariano: false, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r30", nome: "Wrap integral de frango com salada", porcao: "1 wrap grande (≈250g)", tipos: ["almoco", "janta"], calorias: 410, proteina: 32, carboidrato: 42, gordura: 12, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: false },
  { id: "r31", nome: "Feijoada leve de feijão preto com legumes", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 450, proteina: 20, carboidrato: 65, gordura: 10, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r32", nome: "Bife acebolado com arroz e salada", porcao: "1 bife + acompanhamentos (≈380g)", tipos: ["almoco", "janta"], calorias: 490, proteina: 38, carboidrato: 48, gordura: 15, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r33", nome: "Risoto de cogumelos", porcao: "1 prato (≈320g)", tipos: ["almoco", "janta"], calorias: 420, proteina: 12, carboidrato: 55, gordura: 15, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r34", nome: "Camarão salteado com legumes e arroz", porcao: "1 prato (≈350g)", tipos: ["almoco", "janta"], calorias: 440, proteina: 32, carboidrato: 50, gordura: 12, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r35", nome: "Curry de grão-de-bico e espinafre", porcao: "1 prato (≈350g)", tipos: ["almoco", "janta"], calorias: 400, proteina: 14, carboidrato: 58, gordura: 12, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r36", nome: "Almôndegas de carne com molho e purê", porcao: "5-6 unidades + purê (≈350g)", tipos: ["almoco", "janta"], calorias: 480, proteina: 32, carboidrato: 45, gordura: 18, vegetariano: false, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r37", nome: "Frango xadrez com arroz", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 470, proteina: 34, carboidrato: 55, gordura: 12, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: false },
  { id: "r38", nome: "Peixe assado com legumes no forno", porcao: "1 filé + legumes (≈350g)", tipos: ["almoco", "janta"], calorias: 400, proteina: 36, carboidrato: 25, gordura: 15, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r39", nome: "Panqueca de grão-de-bico recheada com legumes", porcao: "2 panquecas (≈300g)", tipos: ["almoco", "janta"], calorias: 380, proteina: 16, carboidrato: 50, gordura: 12, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r40", nome: "Strogonoff de frango light com arroz", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 490, proteina: 34, carboidrato: 52, gordura: 14, vegetariano: false, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r41", nome: "Abobrinha recheada com carne moída", porcao: "2 unidades (≈300g)", tipos: ["almoco", "janta"], calorias: 420, proteina: 28, carboidrato: 30, gordura: 18, vegetariano: false, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r42", nome: "Salada completa com grão-de-bico e atum", porcao: "1 tigela grande (≈350g)", tipos: ["almoco", "janta"], calorias: 380, proteina: 30, carboidrato: 35, gordura: 12, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r43", nome: "Espaguete de abobrinha ao molho de tomate", porcao: "1 prato (≈350g)", tipos: ["almoco", "janta"], calorias: 280, proteina: 8, carboidrato: 35, gordura: 10, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r44", nome: "Frango ao curry com legumes", porcao: "1 prato (≈380g)", tipos: ["almoco", "janta"], calorias: 440, proteina: 36, carboidrato: 30, gordura: 18, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r45", nome: "Hambúrguer caseiro de grão-de-bico", porcao: "2 unidades + pão (≈280g)", tipos: ["almoco", "janta"], calorias: 400, proteina: 15, carboidrato: 55, gordura: 12, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: false },
  { id: "r46", nome: "Sopa de legumes com frango desfiado", porcao: "1 tigela grande (≈400ml)", tipos: ["almoco", "janta"], calorias: 320, proteina: 26, carboidrato: 30, gordura: 8, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: true },
  // Lanches
  { id: "r47", nome: "Mix de castanhas", porcao: "1 punhado (≈30g)", tipos: ["lanche"], calorias: 180, proteina: 5, carboidrato: 8, gordura: 15, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r48", nome: "Iogurte com mel", porcao: "1 pote (≈170g)", tipos: ["lanche"], calorias: 150, proteina: 8, carboidrato: 22, gordura: 3, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r49", nome: "Banana com pasta de amendoim", porcao: "1 banana + 1 colher (≈150g)", tipos: ["lanche"], calorias: 220, proteina: 6, carboidrato: 28, gordura: 10, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r50", nome: "Barrinha de proteína caseira de aveia e whey", porcao: "1 unidade (≈40g)", tipos: ["lanche"], calorias: 200, proteina: 15, carboidrato: 20, gordura: 6, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: false },
  { id: "r51", nome: "Maçã com canela", porcao: "1 unidade média (≈150g)", tipos: ["lanche"], calorias: 90, proteina: 0, carboidrato: 24, gordura: 0, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r52", nome: "Torrada integral com abacate", porcao: "2 torradas (≈100g)", tipos: ["lanche"], calorias: 210, proteina: 5, carboidrato: 22, gordura: 12, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: false },
  { id: "r53", nome: "Queijo cottage com frutas vermelhas", porcao: "1 pote (≈150g)", tipos: ["lanche"], calorias: 160, proteina: 16, carboidrato: 14, gordura: 4, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r54", nome: "Palitos de cenoura com homus", porcao: "1 porção (≈120g)", tipos: ["lanche"], calorias: 140, proteina: 5, carboidrato: 16, gordura: 6, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r55", nome: "Ovo cozido", porcao: "1 unidade (≈50g)", tipos: ["lanche"], calorias: 78, proteina: 6, carboidrato: 1, gordura: 5, vegetariano: true, vegano: false, sem_lactose: true, sem_gluten: true },
  { id: "r56", nome: "Smoothie de whey com frutas", porcao: "1 copo (≈300ml)", tipos: ["lanche"], calorias: 210, proteina: 20, carboidrato: 25, gordura: 3, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r57", nome: "Vitamina de frutas com leite", porcao: "1 copo (≈300ml)", tipos: ["lanche"], calorias: 200, proteina: 8, carboidrato: 32, gordura: 5, vegetariano: true, vegano: false, sem_lactose: false, sem_gluten: true },
  { id: "r58", nome: "Pipoca sem manteiga", porcao: "2 xícaras (≈25g)", tipos: ["lanche"], calorias: 110, proteina: 3, carboidrato: 20, gordura: 2, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r59", nome: "Mix de frutas secas", porcao: "1 punhado (≈40g)", tipos: ["lanche"], calorias: 170, proteina: 3, carboidrato: 30, gordura: 5, vegetariano: true, vegano: true, sem_lactose: true, sem_gluten: true },
  { id: "r60", nome: "Wrap pequeno de frango", porcao: "1 unidade pequena (≈120g)", tipos: ["lanche"], calorias: 230, proteina: 18, carboidrato: 24, gordura: 8, vegetariano: false, vegano: false, sem_lactose: true, sem_gluten: false },
];

// -----------------------------------------------------------------------------
// DADOS DE APOIO PARA A UI
// -----------------------------------------------------------------------------
export const SEXO_BIOLOGICO = [
  { key: "masculino", label: "Masculino" },
  { key: "feminino", label: "Feminino" },
  { key: "neutro", label: "Prefiro não dizer" },
];

export const ATIVIDADES = [
  { key: "sedentario", label: "Sedentário", descricao: "Pouco ou nenhum exercício" },
  { key: "leve", label: "Leve", descricao: "Exercício leve, 1–3x/semana" },
  { key: "moderado", label: "Moderado", descricao: "Exercício moderado, 3–5x/semana" },
  { key: "ativo", label: "Muito ativo", descricao: "Exercício intenso, 6–7x/semana" },
];

export const OBJETIVOS = [
  { key: "perder", label: "Perder peso" },
  { key: "manter", label: "Manter peso" },
  { key: "ganhar", label: "Ganhar massa" },
];

export const RESTRICOES_ALIMENTARES = [
  { key: "vegetariano", label: "Vegetariano" },
  { key: "vegano", label: "Vegano" },
  { key: "sem_lactose", label: "Sem lactose" },
  { key: "sem_gluten", label: "Sem glúten" },
];

export const OPCOES_REFEICOES_DIA = [3, 4, 5];

export const LABEL_SLOT = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  janta: "Jantar",
  lanche: "Lanche",
  lanche_manha: "Lanche da manhã",
  lanche_tarde: "Lanche da tarde",
};

// -----------------------------------------------------------------------------
// MOTOR DE METAS — TDEE e macros. 100% scriptado.
// -----------------------------------------------------------------------------
const FATOR_ATIVIDADE = { sedentario: 1.2, leve: 1.375, moderado: 1.55, ativo: 1.725 };

export function calcularTDEE({ peso, altura, idade, sexo, atividade }) {
  let base;
  if (sexo === "masculino") base = 10 * peso + 6.25 * altura - 5 * idade + 5;
  else if (sexo === "feminino") base = 10 * peso + 6.25 * altura - 5 * idade - 161;
  else base = 10 * peso + 6.25 * altura - 5 * idade - 78;
  return Math.round(base * (FATOR_ATIVIDADE[atividade] || 1.375));
}

export const PISO_CALORICO_SEGURANCA = 1200;

export function calcularMetaCalorica(tdee, objetivo) {
  let meta;
  if (objetivo === "perder") meta = tdee - 500;
  else if (objetivo === "ganhar") meta = tdee + 350;
  else meta = tdee;
  return Math.max(PISO_CALORICO_SEGURANCA, meta);
}

export function calcularMacros(metaCalorica, objetivo) {
  const percentuais =
    objetivo === "ganhar"
      ? { proteina: 0.3, carboidrato: 0.45, gordura: 0.25 }
      : objetivo === "perder"
      ? { proteina: 0.35, carboidrato: 0.35, gordura: 0.3 }
      : { proteina: 0.3, carboidrato: 0.4, gordura: 0.3 };
  return {
    proteina: Math.round((metaCalorica * percentuais.proteina) / 4),
    carboidrato: Math.round((metaCalorica * percentuais.carboidrato) / 4),
    gordura: Math.round((metaCalorica * percentuais.gordura) / 9),
  };
}

// -----------------------------------------------------------------------------
// ESTRUTURA DA SEMANA — dias reais (segunda a domingo) com a mesma
// distribuição de calorias por refeição em todos eles.
// -----------------------------------------------------------------------------
const DIAS_SEMANA = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

const DISTRIBUICAO_REFEICOES = {
  3: [
    { slot: "cafe", tipoPool: "cafe", pct: 0.25 },
    { slot: "almoco", tipoPool: "almoco", pct: 0.4 },
    { slot: "janta", tipoPool: "janta", pct: 0.35 },
  ],
  4: [
    { slot: "cafe", tipoPool: "cafe", pct: 0.2 },
    { slot: "almoco", tipoPool: "almoco", pct: 0.35 },
    { slot: "lanche", tipoPool: "lanche", pct: 0.15 },
    { slot: "janta", tipoPool: "janta", pct: 0.3 },
  ],
  5: [
    { slot: "cafe", tipoPool: "cafe", pct: 0.2 },
    { slot: "lanche_manha", tipoPool: "lanche", pct: 0.1 },
    { slot: "almoco", tipoPool: "almoco", pct: 0.3 },
    { slot: "lanche_tarde", tipoPool: "lanche", pct: 0.1 },
    { slot: "janta", tipoPool: "janta", pct: 0.3 },
  ],
};

export function gerarSemanaDieta(refeicoesPorDia) {
  const estrutura = DISTRIBUICAO_REFEICOES[refeicoesPorDia] || DISTRIBUICAO_REFEICOES[3];
  return DIAS_SEMANA.map((diaLabel) => ({ diaLabel, slots: estrutura }));
}

export function obterPoolReceitas(tipoPool, restricoes) {
  return RECEITAS.filter(
    (r) => r.tipos.includes(tipoPool) && restricoes.every((flag) => r[flag] === true)
  );
}

// -----------------------------------------------------------------------------
// SELEÇÃO DE RECEITAS — vizinho mais próximo da meta calórica do slot, evitando
// repetir uma receita tanto no mesmo dia quanto em outros dias já gerados da
// semana (recebido de fora via `usadasNaSemana`, controlado pela UI).
// -----------------------------------------------------------------------------
function escolherReceitaMaisProxima(pool, metaCalorica, usadasNoDia, usadasNaSemana) {
  const evitarTudo = new Set([...usadasNoDia, ...usadasNaSemana]);
  let candidatos = pool.filter((r) => !evitarTudo.has(r.nome));
  if (candidatos.length === 0) candidatos = pool.filter((r) => !usadasNoDia.has(r.nome));
  if (candidatos.length === 0) candidatos = pool;

  const ordenadas = [...candidatos].sort(
    (a, b) => Math.abs(a.calorias - metaCalorica) - Math.abs(b.calorias - metaCalorica)
  );
  const topN = ordenadas.slice(0, Math.min(3, ordenadas.length));
  return topN[Math.floor(Math.random() * topN.length)];
}

// -----------------------------------------------------------------------------
// BANCOS DE FRASES
// -----------------------------------------------------------------------------
const FLAVOR_ALQUIMISTA = [
  { titulo: "Elixir do Equilíbrio", narrativa: "Cada ingrediente foi pesado com precisão alquímica para hoje." },
  { titulo: "Receita da Sabedoria", narrativa: "Os sabores se combinam para fortalecer corpo e mente." },
  { titulo: "Poção Nutritiva", narrativa: "Uma mistura cuidadosa de energia e nutrientes essenciais." },
  { titulo: "Fórmula do Dia", narrativa: "O Alquimista selecionou os melhores elementos para sua jornada." },
  { titulo: "Banquete Alquímico", narrativa: "Nutrientes transformados em energia pura para suas missões." },
  { titulo: "Combinação Perfeita", narrativa: "Macros equilibrados, como uma fórmula bem calculada." },
  { titulo: "Prato da Transmutação", narrativa: "Ingredientes simples, resultado poderoso." },
  { titulo: "Cardápio dos Elementos", narrativa: "Cada refeição traz seu próprio equilíbrio ao dia." },
  { titulo: "Sustento do Aventureiro", narrativa: "Energia suficiente para encarar qualquer desafio do dia." },
  { titulo: "Receita Refinada", narrativa: "Cada detalhe pensado para maximizar seu desempenho." },
  { titulo: "Mistura Vital", narrativa: "O combustível certo para manter sua Vitalidade em alta." },
  { titulo: "Segredo do Laboratório", narrativa: "Uma combinação testada para resultados consistentes." },
  { titulo: "Fórmula da Constância", narrativa: "Pequenos ajustes diários constroem grandes resultados." },
  { titulo: "Prato Encantado", narrativa: "Simples na aparência, poderoso no efeito." },
  { titulo: "Alquimia do Dia", narrativa: "Cada refeição é um passo a mais na sua evolução." },
];

function escolherAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function gerarDicaAutomatica(caloriasTotais, metaCalorica, proteinaTotal, proteinaAlvo) {
  const desvio = (caloriasTotais - metaCalorica) / metaCalorica;
  if (desvio < -0.15) {
    return "O total ficou abaixo da meta — aumente o número de refeições por dia pra chegar mais perto.";
  }
  if (desvio > 0.15) {
    return "O total ficou acima da meta hoje — ajuste as porções se notar diferença ao longo da semana.";
  }
  if (proteinaTotal < proteinaAlvo * 0.8) {
    return "A proteína ficou um pouco abaixo da meta — considere incluir uma fonte extra amanhã.";
  }
  return "Cardápio bem alinhado com sua meta de hoje.";
}

function calcularXP(caloriasTotais, metaCalorica, proteinaTotal, proteinaAlvo) {
  const desvio = Math.abs(caloriasTotais - metaCalorica) / metaCalorica;
  let xp = 50;
  if (desvio <= 0.1) xp += 20;
  else if (desvio <= 0.2) xp += 10;
  if (proteinaTotal >= proteinaAlvo * 0.9) xp += 15;
  return xp;
}

// -----------------------------------------------------------------------------
// ESCALA DE PORÇÃO — as receitas têm porção-base fixa; pra bater a meta do slot
// (que depende do TDEE de cada pessoa) a porção é multiplicada por um fator em
// passos de 0,25, limitado a 0,5×–2×. Calorias/macros escalam junto e o texto da
// porção mostra o multiplicador e os gramas/ml já ajustados.
// -----------------------------------------------------------------------------
const FATOR_MIN = 0.5;
const FATOR_MAX = 2;

function fatorDePorcao(metaSlot, caloriasReceita) {
  const arredondado = Math.round((metaSlot / caloriasReceita) * 4) / 4;
  return Math.min(FATOR_MAX, Math.max(FATOR_MIN, arredondado));
}

function escalarReceita(receita, fator) {
  if (fator === 1) return { ...receita, fatorPorcao: 1 };
  const gramasEscaladas = receita.porcao.replace(/≈(\d+)(g|ml)/, (_, n, un) => `≈${Math.round(Number(n) * fator)}${un}`);
  return {
    ...receita,
    calorias: Math.round(receita.calorias * fator),
    proteina: Math.round(receita.proteina * fator),
    carboidrato: Math.round(receita.carboidrato * fator),
    gordura: Math.round(receita.gordura * fator),
    porcao: `${String(fator).replace(".", ",")}× ${gramasEscaladas}`,
    fatorPorcao: fator,
  };
}

// -----------------------------------------------------------------------------
// ORQUESTRAÇÃO DO CARDÁPIO — síncrono, sem rede. `usadasNaSemana` é um
// Set opcional (ou array) de nomes de receitas já usadas em outros dias da
// semana atual; a UI é responsável por acumular isso entre as chamadas.
// Sempre retorna { ok: true, dados } ou { ok: false, erro }.
// -----------------------------------------------------------------------------
export function gerarCardapio({ dia, config, usadasNaSemana = new Set() }) {
  const tdee = calcularTDEE(config.perfil);
  const metaCalorica = calcularMetaCalorica(tdee, config.objetivo);
  const macrosAlvo = calcularMacros(metaCalorica, config.objetivo);

  const usadasNoDia = new Set();
  const refeicoesFinal = [];

  for (const s of dia.slots) {
    const pool = obterPoolReceitas(s.tipoPool, config.restricoesAlimentares);
    if (pool.length === 0) {
      return { ok: false, erro: `Nenhuma receita disponível para ${LABEL_SLOT[s.slot]} com essas restrições.` };
    }
    const metaSlot = metaCalorica * s.pct;
    const escolha = escolherReceitaMaisProxima(pool, metaSlot, usadasNoDia, usadasNaSemana);
    usadasNoDia.add(escolha.nome);
    refeicoesFinal.push({ slot: s.slot, ...escalarReceita(escolha, fatorDePorcao(metaSlot, escolha.calorias)) });
  }

  const caloriasTotais = refeicoesFinal.reduce((s, r) => s + r.calorias, 0);
  const proteinaTotal = refeicoesFinal.reduce((s, r) => s + r.proteina, 0);
  const carboTotal = refeicoesFinal.reduce((s, r) => s + r.carboidrato, 0);
  const gorduraTotal = refeicoesFinal.reduce((s, r) => s + r.gordura, 0);
  const xp = calcularXP(caloriasTotais, metaCalorica, proteinaTotal, macrosAlvo.proteina);
  const flavor = escolherAleatorio(FLAVOR_ALQUIMISTA);

  return {
    ok: true,
    dados: {
      titulo: flavor.titulo,
      narrativa: flavor.narrativa,
      dica: gerarDicaAutomatica(caloriasTotais, metaCalorica, proteinaTotal, macrosAlvo.proteina),
      refeicoes: refeicoesFinal,
      caloriasTotais,
      proteinaTotal,
      carboTotal,
      gorduraTotal,
      metaCalorica,
      xp,
    },
  };
}

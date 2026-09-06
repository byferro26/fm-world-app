export const CATEGORIAS_PRODUTO = ["Perfumaria", "Cosmética", "Nutricode", "Casa e Corpo"];

// Níveis de Eficácia reais do Plano de Marketing FM GROUP/FM World, agrupados
// pelos 3 clubes (Magnólia, Orquídea, Estrela). Os pontos referem-se ao volume
// de pontos do mês (pessoais + estrutura). O Clube Estrela depende também de
// ramificação (nº mínimo de "ramas" qualificadas em Orquídea), não só pontos —
// isso é avaliado à parte, na vista de Rede.
// Fonte: FM GROUP, Plano de Marketing "Bem-vindo aos nossos Clubes — Magnólia, Orquídea, Estrela".
// Vale a pena confirmar os limiares de pontos exatos com o material oficial mais recente.
export const NIVEIS_CARREIRA = [
  { nome: "Magnólia", clube: "Magnólia", eficacia: "3%", pontosMin: 300, cor: "sage" },
  { nome: "Magnólia de Prata", clube: "Magnólia", eficacia: "6%", pontosMin: 1200, cor: "sage" },
  { nome: "Magnólia de Ouro", clube: "Magnólia", eficacia: "9%", pontosMin: 3600, cor: "gold" },
  { nome: "Orquídea de Pérola", clube: "Orquídea", eficacia: "12%", pontosMin: 7200, cor: "gold" },
  { nome: "Orquídea de Amaranto", clube: "Orquídea", eficacia: "15%", pontosMin: 14400, cor: "rust" },
  { nome: "Orquídea de Diamante", clube: "Orquídea", eficacia: "18%", pontosMin: 28800, cor: "rust" },
  { nome: "Estrela", clube: "Estrela", eficacia: "21%", pontosMin: 57600, cor: "wine" },
];

export function nivelPorPontos(pontos = 0) {
  let atual = NIVEIS_CARREIRA[0];
  for (const n of NIVEIS_CARREIRA) {
    if (pontos >= n.pontosMin) atual = n;
  }
  return atual;
}

export const TIPOS_DOCUMENTO = ["Documento", "Vídeo", "Formação", "GPT", "Apresentação", "Rede Social", "Estudo Informal"];
export const VISIBILIDADE_DOCUMENTO = ["Público", "Interno", "Privado"];

export const CATEGORIAS_FINANCEIRAS = {
  Receita: ["Venda de produtos", "Comissão", "Bónus", "Outro"],
  Despesa: ["Stock/Encomenda", "Deslocações", "Marketing", "Formação", "Outro"],
};

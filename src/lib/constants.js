export const CATEGORIAS_PRODUTO = ["Perfumaria", "Cosmética", "Nutricode", "Casa e Corpo"];

export const NIVEIS_CARREIRA = [
  { nome: "Magnólia", pontosMin: 0, cor: "sage" },
  { nome: "Orquídea", pontosMin: 1000, cor: "gold" },
  { nome: "Estrela", pontosMin: 3000, cor: "wine" },
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

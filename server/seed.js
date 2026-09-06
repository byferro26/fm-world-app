import crypto from "crypto";
import { pool } from "./db.js";

function uid() {
  return crypto.randomUUID();
}

function diaOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function jaTemDados() {
  const r = await pool.query("SELECT COUNT(*)::int AS n FROM documents WHERE collection='pessoas'");
  return r.rows[0].n > 0;
}

export async function seedDados() {
  const vanessaId = uid();
  const joaoId = uid();
  const carlaId = uid();
  const brunoId = uid();
  const ruiId = uid();

  const pessoas = [
    { id: vanessaId, nome: "Vanessa Correia", email: "vanessa@exemplo.com", telefone: "912 345 678", tipo: "Parceiro", estado: "Convertido", pontos: 15000, patrocinadorId: "", notas: "Muito ativa nas redes sociais." },
    { id: joaoId, nome: "João Ferreira", email: "joao@exemplo.com", telefone: "913 111 222", tipo: "Parceiro", estado: "Convertido", pontos: 3600, patrocinadorId: vanessaId, notas: "" },
    { id: carlaId, nome: "Carla Nunes", email: "carla@exemplo.com", tipo: "Parceiro", estado: "Convertido", pontos: 800, patrocinadorId: vanessaId, notas: "" },
    { id: brunoId, nome: "Bruno Costa", email: "bruno@exemplo.com", tipo: "Parceiro", estado: "Convertido", pontos: 250, patrocinadorId: carlaId, notas: "Juntou-se há pouco tempo." },
    { id: ruiId, nome: "Rui Almeida", email: "rui@exemplo.com", telefone: "914 555 222", tipo: "Cliente", estado: "Em conversa", patrocinadorId: "", notas: "Interessado em Nutricode." },
    { id: uid(), nome: "Marta Silva", email: "marta@exemplo.com", tipo: "Contacto", estado: "Por contactar", patrocinadorId: "", notas: "" },
    { id: uid(), nome: "Sofia Martins", email: "sofia@exemplo.com", tipo: "Cliente", estado: "Convertido", patrocinadorId: "", notas: "Compra perfumes regularmente." },
    { id: uid(), nome: "Tiago Rocha", email: "tiago@exemplo.com", tipo: "Contacto", estado: "Contactado", patrocinadorId: "", notas: "" },
  ];

  const produtos = [
    { id: uid(), nome: "Federico Mahora FM 361", categoria: "Perfumaria", preco: 24.9, stock: 15, stockMinimo: 5 },
    { id: uid(), nome: "Colónia Elegance", categoria: "Perfumaria", preco: 29.9, stock: 2, stockMinimo: 5 },
    { id: uid(), nome: "Creme Hidratante Facial", categoria: "Cosmética", preco: 18.5, stock: 3, stockMinimo: 5 },
    { id: uid(), nome: "Batom Mate Longa Duração", categoria: "Cosmética", preco: 12.9, stock: 25, stockMinimo: 6 },
    { id: uid(), nome: "NutriMax Complexo Vitamínico", categoria: "Nutricode", preco: 32, stock: 20, stockMinimo: 8 },
    { id: uid(), nome: "Difusor de Aromas Casa", categoria: "Casa e Corpo", preco: 15, stock: 7, stockMinimo: 4 },
  ];

  const agenda = [
    { id: uid(), titulo: "Reunião mensal de equipa", tipo: "Reunião", data: diaOffset(0), hora: "18:00", local: "Zoom", estado: "Confirmado", notas: "" },
    { id: uid(), titulo: "Formação Nutricode", tipo: "Formação", data: diaOffset(2), hora: "19:30", local: "Sede", estado: "Agendado", notas: "" },
    { id: uid(), titulo: "Chamada com a Sofia", tipo: "Chamada", data: diaOffset(-1), hora: "10:00", local: "", estado: "Concluído", notas: "" },
    { id: uid(), titulo: "Entrega de encomenda — Rui", tipo: "Entrega", data: diaOffset(4), hora: "", local: "Casa do cliente", estado: "Agendado", notas: "" },
    { id: uid(), titulo: "Sessão com Cliente — Marta", tipo: "Sessão com Cliente", data: diaOffset(7), hora: "17:00", local: "Café Central", estado: "Agendado", notas: "" },
  ];

  const tarefas = [
    { id: uid(), titulo: "Ligar à Marta", estado: "Por fazer", prioridade: "Alta", notas: "Apresentar catálogo de outono" },
    { id: uid(), titulo: "Repor stock de Colónia Elegance", estado: "Por fazer", prioridade: "Alta", notas: "Stock crítico" },
    { id: uid(), titulo: "Enviar catálogo à Vanessa", estado: "Em curso", prioridade: "Normal", notas: "" },
    { id: uid(), titulo: "Preparar formação Nutricode", estado: "Em curso", prioridade: "Normal", notas: "" },
    { id: uid(), titulo: "Follow-up encomenda Rui", estado: "Concluída", prioridade: "Baixa", notas: "" },
  ];

  const documentos = [
    { id: uid(), titulo: "Guia de Formação — Técnicas de Venda", tipoConteudo: "Formação", produtos: [], categoria: "Interno", link: "", notas: "" },
    { id: uid(), titulo: "Estudo — Suplemento NutriMax", tipoConteudo: "Estudo Informal", produtos: ["Nutricode"], categoria: "Interno", link: "", notas: "Bom argumento: energia e imunidade." },
    { id: uid(), titulo: "Vídeo — Kit de Boas-Vindas", tipoConteudo: "Vídeo", produtos: ["Perfumaria", "Cosmética"], categoria: "Público", link: "", notas: "" },
    { id: uid(), titulo: "Apresentação institucional FM World", tipoConteudo: "Apresentação", produtos: [], categoria: "Público", link: "", notas: "" },
    { id: uid(), titulo: "Ideias de conteúdo para redes sociais", tipoConteudo: "Rede Social", produtos: [], categoria: "Privado", link: "", notas: "" },
  ];

  const financeiro = [
    { id: uid(), tipo: "Receita", categoria: "Venda de produtos", valor: 74.7, data: diaOffset(-2), descricao: "Encomenda Rui Almeida" },
    { id: uid(), tipo: "Receita", categoria: "Comissão", valor: 210, data: diaOffset(-5), descricao: "Comissão de equipa — Vanessa" },
    { id: uid(), tipo: "Despesa", categoria: "Stock/Encomenda", valor: 320, data: diaOffset(-6), descricao: "Reposição de catálogo" },
    { id: uid(), tipo: "Despesa", categoria: "Deslocações", valor: 25, data: diaOffset(-1), descricao: "Visita a cliente" },
  ];

  const chat = [
    { id: uid(), texto: "Bom dia equipa! Alguém já viu as novidades do catálogo de outono?", autorNome: "Vanessa Correia", autorId: "seed" },
    { id: uid(), texto: "Já sim, o kit está lindo. Vou apresentar à Sofia esta semana.", autorNome: "João Ferreira", autorId: "seed" },
  ];

  const inserir = async (colecao, registos) => {
    for (const r of registos) {
      const { id, ...data } = r;
      await pool.query("INSERT INTO documents (collection, id, data) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [colecao, id, data]);
    }
  };

  await inserir("pessoas", pessoas);
  await inserir("produtos", produtos);
  await inserir("agenda", agenda);
  await inserir("tarefas", tarefas);
  await inserir("documentos", documentos);
  await inserir("financeiro", financeiro);
  await inserir("chat", chat);

  // vendas — referenciam pessoas e produtos reais criados acima
  const vendas = [
    {
      id: uid(),
      pessoaId: ruiId,
      data: diaOffset(-2),
      itens: [{ produtoId: produtos[0].id, nome: produtos[0].nome, quantidade: 3, preco: produtos[0].preco }],
      total: produtos[0].preco * 3,
      estado: "Pago",
    },
    {
      id: uid(),
      pessoaId: vanessaId,
      data: diaOffset(-4),
      itens: [{ produtoId: produtos[4].id, nome: produtos[4].nome, quantidade: 2, preco: produtos[4].preco }],
      total: produtos[4].preco * 2,
      estado: "Entregue",
    },
  ];
  await inserir("vendas", vendas);

  return {
    pessoas: pessoas.length,
    produtos: produtos.length,
    agenda: agenda.length,
    tarefas: tarefas.length,
    documentos: documentos.length,
    financeiro: financeiro.length,
    chat: chat.length,
    vendas: vendas.length,
  };
}

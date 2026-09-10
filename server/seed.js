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

  const pessoas = [
    { id: vanessaId, nome: "Vanessa Correia", email: "vanessa@exemplo.com", telefone: "912 345 678", tipo: "Parceiro", estado: "Convertido", pontos: 15000, patrocinadorId: "", notas: "Muito ativa nas redes sociais." },
    { id: joaoId, nome: "João Ferreira", email: "joao@exemplo.com", telefone: "913 111 222", tipo: "Parceiro", estado: "Convertido", pontos: 3600, patrocinadorId: vanessaId, notas: "" },
    { id: carlaId, nome: "Carla Nunes", email: "carla@exemplo.com", telefone: "915 222 333", tipo: "Parceiro", estado: "Convertido", pontos: 800, patrocinadorId: vanessaId, notas: "" },
    { id: brunoId, nome: "Bruno Costa", email: "bruno@exemplo.com", telefone: "916 333 444", tipo: "Parceiro", estado: "Convertido", pontos: 250, patrocinadorId: carlaId, notas: "Juntou-se há pouco tempo." },
    { id: uid(), nome: "Rui Almeida", email: "rui@exemplo.com", telefone: "914 555 222", tipo: "Cliente", estado: "Em conversa", patrocinadorId: "", notas: "Interessado em Nutricode." },
    { id: uid(), nome: "Marta Silva", email: "marta@exemplo.com", telefone: "917 666 777", tipo: "Contacto", estado: "Por contactar", patrocinadorId: "", notas: "" },
    { id: uid(), nome: "Sofia Martins", email: "sofia@exemplo.com", telefone: "918 777 888", tipo: "Cliente", estado: "Convertido", patrocinadorId: "", notas: "Compra perfumes regularmente." },
    { id: uid(), nome: "Tiago Rocha", email: "tiago@exemplo.com", tipo: "Contacto", estado: "Contactado", patrocinadorId: "", notas: "" },
  ];

  const agenda = [
    { id: uid(), titulo: "Reunião mensal de equipa", tipo: "Reunião", data: diaOffset(0), hora: "18:00", local: "Zoom", estado: "Confirmado", notas: "" },
    { id: uid(), titulo: "Formação — Como liderar a tua rede", tipo: "Formação", data: diaOffset(2), hora: "19:30", local: "Sede", estado: "Agendado", notas: "" },
    { id: uid(), titulo: "Chamada de acompanhamento — Vanessa", tipo: "Chamada", data: diaOffset(-1), hora: "10:00", local: "", estado: "Concluído", pessoaId: vanessaId, notas: "" },
    { id: uid(), titulo: "Apresentação de oportunidade — Marta", tipo: "Sessão com Cliente", data: diaOffset(4), hora: "17:00", local: "Café Central", estado: "Agendado", notas: "" },
    { id: uid(), titulo: "1-a-1 com o João", tipo: "Reunião", data: diaOffset(7), hora: "16:00", local: "Chamada", estado: "Agendado", pessoaId: joaoId, notas: "" },
  ];

  const tarefas = [
    { id: uid(), titulo: "Ligar à Marta", estado: "Por fazer", prioridade: "Alta", notas: "Apresentar a oportunidade de negócio" },
    { id: uid(), titulo: "Acompanhar a Carla esta semana", estado: "Por fazer", prioridade: "Alta", notas: "Está parada há duas semanas" },
    { id: uid(), titulo: "Preparar formação de liderança", estado: "Em curso", prioridade: "Normal", notas: "" },
    { id: uid(), titulo: "Rever plano de carreira com o Bruno", estado: "Em curso", prioridade: "Normal", notas: "" },
    { id: uid(), titulo: "Follow-up pós-reunião mensal", estado: "Concluída", prioridade: "Baixa", notas: "" },
  ];

  const documentos = [
    { id: uid(), titulo: "Guia — Como liderar a tua equipa", tipoConteudo: "Formação", produtos: [], categoria: "Interno", link: "", notas: "" },
    { id: uid(), titulo: "Guião de apresentação da oportunidade", tipoConteudo: "Documento", produtos: [], categoria: "Interno", link: "", notas: "Usar nas primeiras conversas com prospects." },
    { id: uid(), titulo: "Vídeo — Kit de Boas-Vindas a novos parceiros", tipoConteudo: "Vídeo", produtos: [], categoria: "Público", link: "", notas: "" },
    { id: uid(), titulo: "Apresentação institucional FM World", tipoConteudo: "Apresentação", produtos: [], categoria: "Público", link: "", notas: "" },
    { id: uid(), titulo: "Ideias de conteúdo para redes sociais", tipoConteudo: "Rede Social", produtos: [], categoria: "Privado", link: "", notas: "" },
  ];

  const financeiro = [
    { id: uid(), tipo: "Receita", categoria: "Comissão", valor: 210, data: diaOffset(-5), descricao: "Comissão de equipa — Vanessa" },
    { id: uid(), tipo: "Receita", categoria: "Bónus", valor: 80, data: diaOffset(-10), descricao: "Bónus de arranque rápido" },
    { id: uid(), tipo: "Despesa", categoria: "Formação", valor: 45, data: diaOffset(-6), descricao: "Material para formação da equipa" },
    { id: uid(), tipo: "Despesa", categoria: "Deslocações", valor: 25, data: diaOffset(-1), descricao: "Visita a prospect" },
  ];

  const chat = [
    { id: uid(), texto: "Bom dia equipa! Quem consegue vir à formação de quinta-feira?", autorNome: "Vanessa Correia", autorId: "seed" },
    { id: uid(), texto: "Eu consigo! Já convidei a Marta também.", autorNome: "João Ferreira", autorId: "seed" },
  ];

  const inserir = async (colecao, registos) => {
    for (const r of registos) {
      const { id, ...data } = r;
      await pool.query("INSERT INTO documents (collection, id, data) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [colecao, id, data]);
    }
  };

  await inserir("pessoas", pessoas);
  await inserir("agenda", agenda);
  await inserir("tarefas", tarefas);
  await inserir("documentos", documentos);
  await inserir("financeiro", financeiro);
  await inserir("chat", chat);

  return {
    pessoas: pessoas.length,
    agenda: agenda.length,
    tarefas: tarefas.length,
    documentos: documentos.length,
    financeiro: financeiro.length,
    chat: chat.length,
  };
}

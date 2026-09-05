# FM World — Gestão de Negócio

App de gestão de negócio para uma equipa FM World: base de dados de clientes e parceiros, vendas e stock, financeiro, agenda, documentos e plano de carreira — com dados partilhados entre toda a equipa.

**Stack:** React + Vite + Tailwind CSS (frontend) e Express + Postgres (backend), tudo hospedado no [Railway](https://railway.com).

## Módulos

- **Painel** — resumo do negócio (KPIs, próximos compromissos, tarefas)
- **Pessoas** — CRM de contactos, clientes e parceiros
- **Vendas** — encomendas com artigos, total automático e baixa de stock (transação atómica no servidor)
- **Produtos** — catálogo (Perfumaria, Cosmética, Nutricode, Casa e Corpo) com aviso de stock baixo
- **Financeiro** — receitas e despesas, saldo mensal
- **Agenda** — reuniões, formações, entregas
- **Tarefas** — quadro kanban da equipa
- **Documentos** — biblioteca de materiais, com tags de tipo e produto
- **Equipa & Rede** — parceiros por clube de carreira (Magnólia / Orquídea / Estrela)
- **Chat** — mensagens da equipa

Os dados são partilhados por toda a equipa: cada pessoa cria a sua própria conta (email + palavra-passe), sem depender de contas Claude, Google ou Notion. As atualizações de outras pessoas aparecem automaticamente a cada poucos segundos.

---

## Arquitetura

```
Browser (React/Vite)  →  Express (Node.js)  →  Postgres
        \____________________ 1 único serviço no Railway ____________________/
```

O Express serve tanto o `build` do frontend (ficheiros estáticos) como a API (`/api/...`), por isso é **um único serviço** a correr no Railway — mais simples e mais barato do que ter frontend e backend separados.

- `src/` — código React (interface)
- `server/` — código Express (API + ligação à base de dados)
- `documents` (tabela Postgres) — cada "coleção" (pessoas, produtos, vendas, ...) fica guardada aqui como JSON, identificada pela coluna `collection`
- `users` (tabela Postgres) — contas e palavras-passe (encriptadas com bcrypt)

## Já está feito

- [x] Projeto Railway criado, com Postgres já a correr (password gerada e volume persistente anexado)
- [x] Serviço da app (`app`) criado no mesmo projeto, já com as variáveis `DATABASE_URL` e `JWT_SECRET` configuradas
- [x] Testado de ponta a ponta neste ambiente: registo, login, criação em todas as coleções, venda com baixa de stock, e dois utilizadores diferentes a partilharem dados em tempo real

## O que falta: publicar o código

Isto precisa de uma conta GitHub tua — é o único passo que não consigo fazer sozinho.

### Opção A — envias-me um token e eu trato do resto

1. Vai a **GitHub → Settings (da tua conta) → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Nome: `fm-world-deploy` (ou o que preferires)
3. **Repository access** → "Only select repositories" → escolhe `fm-world-app`
4. Em **Permissions → Repository permissions**, muda **Contents** para **Read and write**
5. Cria o token e copia-o (só é mostrado uma vez)
6. Envia-mo aqui — assim que o tiver, publico o código e ligo o Railway ao repositório

### Opção B — fazes tu o push

A partir da pasta deste projeto (depois de descomprimires o zip):

```bash
git init
git add .
git commit -m "FM World - primeira versão"
git branch -M main
git remote add origin https://github.com/byferro26/fm-world-app.git
git push -u origin main
```

Depois de veres o código no GitHub, diz-me e eu ligo o Railway ao repositório e trato do resto (deploy, domínio público, variáveis de ambiente) — isso sim, consigo fazer sozinho.

---

## Desenvolvimento local

Precisas de Node.js e de um Postgres local (ou usa a `DATABASE_URL` de um Postgres na cloud).

```bash
npm install

# Numa janela: o backend (usa a tua própria base de dados local para testar)
DATABASE_URL="postgresql://utilizador:password@localhost:5432/fmworld" JWT_SECRET="qualquercoisa" npm start

# Noutra janela: o frontend com hot-reload (já tem proxy para /api → localhost:8080)
npm run dev
```

Para produção, o Railway corre automaticamente `npm run build` seguido de `npm start` — não precisas de fazer nada manualmente além de ligar o repositório.

## Convidar a equipa

Depois de a app estar online, basta partilhares o link do Railway. Cada parceiro cria a sua própria conta diretamente no ecrã de login. O primeiro a criar conta (tu) fica automaticamente `admin`; os seguintes ficam `parceiro`.

## Comandos

```bash
npm run dev       # frontend em desenvolvimento (Vite)
npm start         # backend + frontend juntos, como em produção
npm run build     # gera a pasta dist/ com o frontend otimizado
```

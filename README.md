# InvestControl

Aplicação web para controle de investimentos de renda fixa: **CDB, LCI, LCA, LC, Tesouro Direto (Selic, Prefixado, IPCA+) e Poupança**.

📘 [Manual do usuário](./docs/MANUAL-DO-USUARIO.md) — como usar o painel, cadastrar investimentos e entender os cálculos de rendimento, IR e IOF.

## Funcionalidades

- **Painel** com total investido, valor líquido estimado, rentabilidade e distribuição da carteira por tipo de investimento (gráfico de pizza).
- **Cadastro de investimentos** (CRUD completo): instituição, indexador, taxa, valor aplicado, datas de aplicação/vencimento, liquidez e cobertura do FGC.
- **Cálculo automático** do valor líquido estimado de cada investimento, considerando:
  - Indexadores CDI, Selic, IPCA+ e prefixado, com capitalização em dias úteis (base 252).
  - Tabela regressiva de **Imposto de Renda** (22,5% a 15%, conforme prazo).
  - **IOF regressivo** para resgates com menos de 30 dias.
  - **Isenção de IR** para LCI, LCA e Poupança.
- **Vencimentos próximos** (90 dias) em destaque no painel.
- **Configurações** para atualizar as taxas atuais de CDI, Selic e IPCA usadas nas projeções.
- **Criptografia em repouso** dos dados sensíveis de cada investimento (nome, instituição, taxa, valor investido e observações) com AES-256-GCM antes de gravar no banco.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Prisma ORM 7](https://www.prisma.io/) + SQLite (via `@prisma/adapter-better-sqlite3`)
- [Recharts](https://recharts.org/) para os gráficos
- [Zod](https://zod.dev/) para validação

## Como rodar localmente

```bash
cp .env.example .env
# gere uma chave e cole em ENCRYPTION_KEY dentro do .env:
openssl rand -base64 32

npm install          # instala dependências e gera o Prisma Client
npm run db:migrate    # cria o banco SQLite local (dev.db) e aplica as migrations
npm run dev            # inicia o servidor de desenvolvimento em http://localhost:3000
```

`ENCRYPTION_KEY` é obrigatória — sem ela, qualquer leitura ou escrita de investimento falha. Trate-a como um segredo: se for perdida, os dados já criptografados no banco ficam irrecuperáveis; se vazar, alguém com acesso ao arquivo `dev.db` consegue decifrar os dados. Nunca a commite (o `.env` já está no `.gitignore`).

Outros comandos úteis:

```bash
npm run build      # build de produção
npm run start      # roda o build de produção
npm run lint       # lint
npm run db:studio  # abre o Prisma Studio para inspecionar o banco
```

## Estrutura

```
prisma/schema.prisma         modelos: Investment, Settings
src/lib/crypto.ts            criptografia AES-256-GCM (ENCRYPTION_KEY)
src/lib/investments-repo.ts  único ponto de acesso a Investment; cifra/decifra na borda
src/lib/investment-calc.ts   motor de cálculo (rendimento, IR, IOF)
src/app/                     páginas: painel (/), investimentos, configurações
src/app/api/                 rotas REST: /api/investments, /api/settings
src/components/              componentes de UI
```

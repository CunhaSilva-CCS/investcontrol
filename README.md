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

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Prisma ORM 7](https://www.prisma.io/) + SQLite (via `@prisma/adapter-better-sqlite3`)
- [Recharts](https://recharts.org/) para os gráficos
- [Zod](https://zod.dev/) para validação

## Como rodar localmente

```bash
npm install          # instala dependências e gera o Prisma Client
npm run db:migrate    # cria o banco SQLite local (dev.db) e aplica as migrations
npm run dev            # inicia o servidor de desenvolvimento em http://localhost:3000
```

Outros comandos úteis:

```bash
npm run build      # build de produção
npm run start      # roda o build de produção
npm run lint       # lint
npm run db:studio  # abre o Prisma Studio para inspecionar o banco
```

## Estrutura

```
prisma/schema.prisma        modelos: Investment, Settings
src/lib/investment-calc.ts  motor de cálculo (rendimento, IR, IOF)
src/app/                    páginas: painel (/), investimentos, configurações
src/app/api/                rotas REST: /api/investments, /api/settings
src/components/             componentes de UI
```

# Investe Valor

![Investe Valor](./public/brand/investe-valor-logo.png)

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
- **Licenciamento por chave** — o app só libera o uso depois de ativado com uma chave de licença assinada digitalmente (Ed25519), validada localmente sem precisar de internet.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Prisma ORM 7](https://www.prisma.io/) + SQLite (via `@prisma/adapter-better-sqlite3`)
- [Recharts](https://recharts.org/) para os gráficos
- [Zod](https://zod.dev/) para validação

## Instaladores para Windows e Mac (para quem vende)

A forma mais simples de entregar o Investe Valor a um cliente é gerar um instalador de verdade — um `.exe` (Windows) ou `.dmg` (Mac) que ele baixa, instala e abre como qualquer programa, sem terminal e sem saber que existe Node.js por trás. O app roda dentro de um shell [Electron](https://www.electronjs.org/), que sobe o mesmo servidor Next.js localmente e abre uma janela apontando para ele.

**Os instaladores são construídos no GitHub Actions**, não localmente — build de Mac (`.dmg`) só funciona de verdade numa máquina Mac real, e o workflow já cuida disso com runners `windows-latest` e `macos-latest` de verdade. Para gerar uma nova versão:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Isso dispara `.github/workflows/build-desktop.yml`, que builda os dois instaladores em paralelo e os deixa disponíveis como artefatos da execução (aba **Actions** do repositório → a execução do workflow → **Artifacts**, no fim da página). Também dá para disparar manualmente pela aba Actions (**Run workflow**), sem precisar criar uma tag, útil pra testar antes de lançar uma versão de verdade.

Cada instalador já embarca o app inteiro (servidor Next.js, Prisma/SQLite, criptografia, tela de ativação) — o cliente só precisa da chave de licença de sempre (veja [Licenciamento](#licenciamento-para-quem-vende) abaixo).

**Sobre os avisos de segurança:** os instaladores não são assinados digitalmente por enquanto (assinatura exige certificado pago — no Windows, um certificado de code-signing; no Mac, uma conta Apple Developer paga + notarização). Sem isso, o sistema operacional avisa:
- **Windows**: SmartScreen mostra "Windows protegeu seu PC" — o cliente clica em **Mais informações** e depois **Executar assim mesmo**.
- **Mac**: Gatekeeper recusa abrir de primeira ("desenvolvedor não identificado") — o cliente vai em **Ajustes do Sistema → Privacidade e Segurança**, encontra o aviso sobre o Investe Valor e clica em **Abrir Assim Mesmo**.

Isso é normal para software não assinado e não afeta o funcionamento do app — só exige esse passo extra na primeira abertura.

## Instalação via terminal (alternativa)

Requer [Node.js](https://nodejs.org/) 20 ou mais recente instalado. Depois de obter o código:

```bash
npm run setup    # cria o .env com uma chave de criptografia nova, instala tudo,
                  # aplica as migrations do banco e gera o build de produção
npm run start     # inicia o app em http://localhost:3000
```

Na primeira vez que abrir o app, ele vai pedir a **chave de licença** recebida na compra — cole-a na tela de ativação para liberar o uso. Veja o [manual do usuário](./docs/MANUAL-DO-USUARIO.md) para o passo a passo completo.

`npm run setup` nunca sobrescreve um `.env` já existente — pode rodar de novo com segurança depois de atualizar o código, sem perder a chave de criptografia nem os dados.

### Desenvolvimento

Para trabalhar no código-fonte (não para uso normal do app):

```bash
cp .env.example .env
# gere uma chave e cole em ENCRYPTION_KEY dentro do .env:
openssl rand -base64 32

npm install           # instala dependências e gera o Prisma Client
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

## Licenciamento (para quem vende)

O app só funciona depois de ativado com uma chave de licença. As chaves são assinadas com uma chave privada Ed25519 que **só quem vende** deve ter — o app embarca apenas a chave pública, usada para validar (não para criar) licenças, então essa verificação funciona sem internet.

Gerar o par de chaves e emitir licenças é feito por uma ferramenta separada deste repositório —
**[`license-generator`](../license-generator)** — com interface gráfica própria (Electron), pensada
para nunca conviver com o código que vai para o cliente. Veja o README dela para o passo a passo.

Resumo do fluxo:

1. Na ferramenta, gere um novo par de chaves (ou selecione um `.pem` já existente) — a chave
   privada é salva onde você escolher, fora deste repositório, e nunca fica dentro dele. Guarde-a
   em um cofre de senhas: se ela vazar, qualquer pessoa pode gerar licenças válidas; se for
   perdida, você não consegue mais emitir licenças novas (as já emitidas continuam válidas).
2. Cole em `src/lib/license-public-key.ts` o trecho de chave pública que a ferramenta gera —
   é seguro versionar, só permite *verificar* licenças, não criar novas.
3. Para cada venda, preencha nome/e-mail/validade na ferramenta e copie a chave de licença gerada
   (uma string longa começando com `IV1.`) — envie essa string ao cliente. Ela já contém os dados
   codificados e assinados; não é preciso guardar nada além da própria chave privada.

## Estrutura

```
prisma/schema.prisma         modelos: Investment, Settings
src/lib/crypto.ts            criptografia AES-256-GCM (ENCRYPTION_KEY)
src/lib/investments-repo.ts  único ponto de acesso a Investment; cifra/decifra na borda
src/lib/investment-calc.ts   motor de cálculo (rendimento, IR, IOF)
src/lib/license.ts           validação de chave de licença (Ed25519)
src/app/                     páginas: painel (/), investimentos, configurações, ativação
src/app/api/                 rotas REST: /api/investments, /api/settings, /api/license/activate
src/components/              componentes de UI
scripts/setup.mjs             instalação em um comando (npm run setup)
electron/main.js               processo principal do app desktop (Electron)
electron/migrate.js            cria o banco na primeira execução do app desktop
.github/workflows/build-desktop.yml  builda os instaladores .exe/.dmg no CI
```

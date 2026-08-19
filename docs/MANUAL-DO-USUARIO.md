![Investe Valor](../public/brand/investe-valor-logo.png)

# Manual do Usuário — Investe Valor

Guia de uso do Investe Valor: o painel onde você registra seus investimentos e faz seu controle financeiro — CDB, LCI, LCA, LC, Tesouro Direto e Poupança — acompanhando, em um só lugar, quanto cada um vale hoje.

> Este manual também está disponível em versão navegável, com capturas de tela maiores: veja o link publicado na conversa que gerou este documento, ou consulte as imagens em [`docs/screenshots/`](./screenshots).

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Ativação](#2-ativação)
3. [Mantendo o app rodando](#3-mantendo-o-app-rodando)
4. [Segurança dos dados](#4-segurança-dos-dados)
5. [Painel](#5-painel)
6. [Investimentos](#6-investimentos)
7. [Patrimônio](#7-patrimônio)
8. [Dashboard do Patrimônio](#8-dashboard-do-patrimônio)
9. [Tipos e indexadores](#9-tipos-e-indexadores)
10. [Como o cálculo funciona](#10-como-o-cálculo-funciona)
11. [Configurações](#11-configurações)
12. [Perguntas frequentes](#12-perguntas-frequentes)

## 1. Visão geral

O sistema possui quatro áreas principais: **Painel**, que resume os investimentos cadastrados; **Investimentos**, para cadastrar aplicações individuais; **Patrimônio**, para lançar valores mensais, aportes e retiradas; e **Dashboard do Patrimônio**, para analisar a evolução consolidada. Em **Configurações**, ficam as taxas de referência e os fatores de conversão de moedas.

Todo o cadastro fica salvo, de forma cifrada, no banco de dados local da aplicação — nada é enviado ao seu banco ou corretora. Os valores mostrados são **estimativas** calculadas a partir da taxa contratada e das taxas de referência que você informa; eles servem para acompanhamento e planejamento, não substituem o extrato oficial da instituição financeira.

## 2. Ativação

Na primeira vez que você abrir o Investe Valor, ele pede uma chave de licença antes de liberar qualquer tela.

![Tela de ativação](./screenshots/ativacao.png)

Cole no campo a chave que você recebeu na compra — uma string longa começando com `IV1.` — e clique em **Ativar**. A validação acontece localmente, sem precisar de internet, e a chave fica guardada na sua instalação: você só precisa ativar uma vez.

Se a chave for inválida, estiver expirada, ou não tiver sido informada ainda, o app volta para essa tela e bloqueia o acesso ao Painel, Investimentos, Patrimônio e Configurações. Depois de ativado, os dados da licença (nome, e-mail e validade) ficam visíveis na aba [Configurações](#11-configurações).

## 3. Mantendo o app rodando

O comando `npm run start` mantém o Investe Valor no ar enquanto a janela do terminal ficar aberta. Fechar essa janela, ou desligar o computador, derruba o servidor — nada é perdido (a ativação e os dados continuam salvos), mas é preciso rodar `npm run start` de novo antes de usar o app.

### Uso ocasional

Se você usa o app só de vez em quando, isso já é suficiente: abra o terminal, rode `npm run start`, acesse `http://localhost:3000` no navegador, e feche a janela do terminal quando terminar.

### Uso contínuo (recomendado para uso diário)

Para deixar o Investe Valor sempre disponível em segundo plano, sem precisar manter uma janela de terminal aberta, use o [pm2](https://pm2.keymetrics.io/), um gerenciador de processos gratuito:

```bash
npx pm2 start npm --name investe-valor -- start
```

Isso inicia o app em segundo plano. Comandos úteis:

| Comando | O que faz |
|---|---|
| `npx pm2 status` | Mostra se o app está rodando |
| `npx pm2 logs investe-valor` | Mostra o que está acontecendo (útil para diagnosticar problemas) |
| `npx pm2 restart investe-valor` | Reinicia o app |
| `npx pm2 stop investe-valor` | Para o app |

Para o app voltar a rodar sozinho depois que o computador reiniciar:

```bash
npx pm2 startup
npx pm2 save
```

O primeiro comando imprime uma instrução que varia conforme o sistema operacional — copie e rode exatamente o que ele mostrar na tela. O segundo comando salva a configuração atual para ser restaurada no próximo boot.

> Isso é opcional. Sem o pm2, o app funciona normalmente — só exige manter o terminal aberto enquanto estiver em uso.

## 4. Segurança dos dados

O Investe Valor grava os campos sensíveis de cada investimento — **nome, instituição, taxa, valor investido e observações** — cifrados com **AES-256-GCM** antes de tocar o banco de dados. Quem tiver acesso direto ao arquivo do banco, sem a chave de criptografia, não consegue ler esses valores.

Ficam em texto plano apenas o tipo, o indexador, as datas de aplicação/vencimento, a liquidez e a cobertura do FGC — usados para filtrar, ordenar e destacar vencimentos na tela, e de baixa sensibilidade isoladamente (sem o valor, saber que existe "um CDB com vencimento em outubro" não expõe muita coisa).

> A chave de criptografia (`ENCRYPTION_KEY`) é configurada por quem instala e roda a aplicação — veja as instruções no README do projeto. Guarde-a com cuidado: **sem ela, os dados já salvos ficam irrecuperáveis**; se ela vazar, quem a tiver consegue decifrar os dados.

## 5. Painel

É a tela inicial. Ela resume a carteira inteira em quatro números e dois painéis de apoio.

![Painel do Investe Valor](./screenshots/painel.png)

- **Total investido** — soma do valor aplicado (principal) em todos os investimentos ativos.
- **Valor líquido estimado** — quanto a carteira valeria hoje se todos os investimentos fossem resgatados agora, já descontando IR e IOF quando aplicáveis.
- **Rentabilidade líquida** — a diferença entre os dois números acima, em reais e em percentual sobre o total investido.
- **Investimentos ativos** — quantidade de aplicações cadastradas.

O gráfico de **distribuição por tipo** agrupa o valor líquido estimado por categoria (CDB, LCI, LCA…), para você ver rapidamente onde a carteira está concentrada. A lista de **próximos vencimentos** mostra o que vence nos próximos 90 dias, ordenado por data.

## 6. Investimentos

Aqui você cadastra, edita e remove cada aplicação. A tabela já mostra o valor estimado de cada linha, atualizado a cada visita.

![Tabela de investimentos](./screenshots/investimentos.png)

### Adicionar um investimento

Clique em **+ Novo investimento** e preencha o formulário. Ao escolher o **Tipo**, o campo Indexador já vem pré-selecionado com o mais comum para aquele tipo — mas pode ser trocado livremente.

![Formulário de novo investimento](./screenshots/form-novo.png)

| Campo | Descrição |
|---|---|
| Nome / apelido | Identificador livre para reconhecer a aplicação na lista. |
| Instituição | Banco, corretora ou cooperativa onde o investimento foi feito. |
| Tipo | CDB, LCI, LCA, LC, Tesouro Selic, Tesouro Prefixado, Tesouro IPCA+, Poupança ou Outro. Define se há isenção de IR. |
| Indexador | % do CDI, % da Selic, IPCA + spread fixo, ou taxa Prefixada. |
| Taxa | O número contratado, no formato do indexador — ex: `105` para 105% do CDI, `6,2` para IPCA + 6,2% a.a. |
| Valor investido | O principal aplicado na moeda escolhida: BRL, USD ou EUR. |
| Moeda | Moeda do valor informado: Real (BRL), Dólar (USD) ou Euro (EUR). O valor digitado pertence à moeda escolhida. |
| Data de aplicação | Quando o dinheiro foi investido; ponto de partida do rendimento. |
| Data de vencimento | Opcional — deixe em branco para liquidez diária sem vencimento fixo. |
| Liquidez | Diária ou no vencimento (informativo). |
| Coberto pelo FGC | Marque se o investimento tem garantia do Fundo Garantidor de Créditos. |
| Observações | Campo livre para anotações. |

### Editar ou excluir

Na tabela, use **Editar** para abrir o mesmo formulário já preenchido, ou **Excluir** para remover a aplicação — a exclusão pede confirmação, pois não pode ser desfeita.

| Editar | Confirmar exclusão |
|---|---|
| ![Editar investimento](./screenshots/form-editar.png) | ![Confirmar exclusão](./screenshots/confirmar-exclusao.png) |

## 7. Patrimônio

Patrimônio é a área operacional para acompanhar a planilha mensal. Ela trabalha com uma linha para cada combinação de **instituição + aplicação**, com valores de janeiro a dezembro e o saldo do ano anterior como base de janeiro.

### Adicionar uma aplicação

Em **Adicionar lançamento**, informe a instituição, a aplicação ou conta, a moeda e o mês inicial. A moeda pode ser BRL, USD ou EUR. Os valores mensais dessa linha são registrados na moeda escolhida.

### Aportes e retiradas

Use **Movimentar patrimônio** e escolha **Aporte em aplicação existente** ou **Retirada de aplicação existente**. Selecione a aplicação, o mês e o valor. O sistema usa automaticamente a moeda da linha.

O aporte ou a retirada altera o saldo do mês, mas não é tratado como rentabilidade. A fórmula mensal é:

```text
Rentabilidade = (Saldo atual - Saldo anterior - Aportes + Retiradas) / Saldo anterior
```

### Alterar ou excluir lançamentos

Use as caixas **Alterar lançamento** ou **Excluir lançamento**. Alterar permite mudar instituição, nome e moeda da linha. Excluir remove todos os meses daquele lançamento após confirmação.

### Importar a planilha

Clique em **Selecionar .xlsx** e escolha a planilha com abas anuais, como `2024`, `2025` e `2026`. Os valores são importados como BRL por padrão; depois você pode alterar a moeda da linha.

## 8. Dashboard do Patrimônio

O Dashboard é a área de leitura consolidada dos dados lançados em Patrimônio. Ele possui filtros por ano, instituição e moeda e mostra evolução mensal, composição por moeda, concentração por instituição e posições detalhadas.

Os totais consolidados são sempre exibidos em BRL. Os valores originais continuam visíveis na moeda da aplicação.

Para USD e EUR, a conversão usada é:

```text
Valor em BRL = Valor na moeda original x Fator de conversão
```

Exemplo:

```text
USD 10.000 x 5,50 = BRL 55.000
```

O Dashboard mostra o fator usado em cada cartão da composição por moeda. Os fatores são alterados em **Configurações**.

## 9. Tipos e indexadores

O tipo escolhido determina, sobretudo, se o investimento paga Imposto de Renda.

| Tipo | IR | Observação |
|---|---|---|
| CDB | Tributado | Geralmente % do CDI, mas pode ser prefixado ou IPCA+. |
| LCI | **Isento** | Letra de Crédito Imobiliário. |
| LCA | **Isento** | Letra de Crédito do Agronegócio. |
| LC | Tributado | Letra de Câmbio, emitida por financeiras; segue a tabela do CDB. |
| Tesouro Selic | Tributado | Pós-fixado, alta liquidez — indicado para reserva de emergência. |
| Tesouro Prefixado | Tributado | Taxa de juros fixa conhecida desde a compra. |
| Tesouro IPCA+ | Tributado | Paga inflação + taxa fixa; protege o poder de compra. |
| Poupança | **Isento** | Regra própria (TR + 0,5% a.m.); aproximada aqui pelo indexador Prefixado — ajuste a taxa manualmente para refletir o rendimento real. |

| Indexador | Como a taxa é lida | Exemplo |
|---|---|---|
| % do CDI | Percentual do CDI vigente informado em Configurações | `105` → 105% do CDI |
| % da Selic | Percentual da taxa Selic vigente | `100` → 100% da Selic |
| IPCA + | Spread fixo somado à inflação projetada | `6,2` → IPCA + 6,2% a.a. |
| Prefixado | Taxa anual fixa | `12,5` → 12,5% a.a. |

## 10. Como o cálculo funciona

O valor estimado de cada investimento é recalculado toda vez que você abre a tela, com base na data de hoje (ou na data de vencimento, se ela já tiver passado).

1. **Rendimento bruto** — o período entre a aplicação e hoje é convertido em dias úteis (aproximando pela proporção de 252 dias úteis por ano) e a taxa anual equivalente do indexador é capitalizada sobre esse período.
2. **Imposto de Renda** (tabela regressiva, para CDB, LC e Tesouro Direto):

   | Prazo | Alíquota |
   |---|---|
   | Até 180 dias | 22,5% |
   | 181 a 360 dias | 20,0% |
   | 361 a 720 dias | 17,5% |
   | Acima de 720 dias | 15,0% |

   **LCI, LCA e Poupança são isentos** — o rendimento é somado ao principal sem desconto de IR.
3. **IOF regressivo** — resgates com menos de 30 dias corridos pagam IOF sobre o rendimento (96% no dia 1, caindo até 0% no dia 30), aplicado antes do IR.

### Fórmulas usadas nos campos

As fórmulas abaixo mostram a lógica usada pelo sistema. Os valores são estimativas e não substituem o extrato da instituição.

**Taxa anual equivalente**

```text
CDI       = (CDI informado / 100) x (taxa do investimento / 100)
Selic     = (Selic informada / 100) x (taxa do investimento / 100)
IPCA      = (1 + IPCA informado / 100) x (1 + spread / 100) - 1
Prefixado = taxa do investimento / 100
```

Para `105` no indexador CDI e CDI de `10,65%`, por exemplo:

```text
Taxa anual = 10,65% x 105% = 11,1825% a.a.
```

**Capitalização no período**

```text
Dias úteis aproximados = dias corridos x (252 / 365)
Fator bruto = (1 + taxa anual) ^ (dias úteis aproximados / 252)
Valor bruto = principal x fator bruto
Ganho bruto = valor bruto - principal
```

**Impostos**

```text
IOF = máximo(0, ganho bruto) x alíquota IOF do dia
Ganho após IOF = ganho bruto - IOF
IR = máximo(0, ganho após IOF) x alíquota IR
Valor líquido = máximo(0, principal + ganho após IOF - IR)
```

LCI, LCA e Poupança não aplicam IR. Perdas não geram IR nem IOF.

**Rentabilidade mensal do Patrimônio**

```text
Fluxo líquido = aportes - retiradas
Rentabilidade = (saldo atual - saldo anterior - fluxo líquido) / saldo anterior
```

Assim, um aporte aumenta o patrimônio, mas não aparece como rendimento. Uma retirada reduz o patrimônio, mas não aparece automaticamente como perda de mercado.

> **Isto é uma estimativa.** O cálculo usa uma aproximação de dias úteis e as taxas de referência informadas em Configurações — confira sempre o extrato oficial da instituição antes de decidir um resgate.

## 11. Configurações

As taxas de referência e os fatores de conversão usados nos cálculos ficam centralizados aqui. Atualize CDI, Selic e IPCA quando necessário. Atualize também:

- **1 USD vale (BRL)**: fator usado para converter dólares para reais;
- **1 EUR vale (BRL)**: fator usado para converter euros para reais.

O Dashboard usa os valores salvos imediatamente após a atualização para recalcular os totais consolidados.

![Tela de configurações](./screenshots/configuracoes.png)

Como o CDI normalmente fica pouco abaixo da Selic, uma atualização vale para toda a carteira de uma vez — não é preciso editar investimento por investimento.

## 12. Perguntas frequentes

**Perdi minha chave de licença. E agora?**
Fale com quem vendeu o Investe Valor para você — a chave pode ser reenviada a qualquer momento, já que ela não expira sozinha (a menos que tenha sido emitida com validade definida).

**Preciso ativar de novo se eu reinstalar ou trocar de computador?**
Sim. A ativação fica registrada apenas na instalação atual (arquivo `license.key`); reinstalar ou migrar para outra máquina exige colar a chave de novo na tela de ativação.

**Os meus dados ficam salvos onde?**
No banco de dados da própria aplicação, local ao ambiente onde ela está rodando. Nenhuma informação é enviada a bancos, corretoras ou terceiros, e os campos sensíveis ficam cifrados (veja [Segurança dos dados](#4-segurança-dos-dados)).

**O que acontece se eu perder a chave de criptografia?**
Os investimentos já cadastrados ficam irrecuperáveis — a chave não fica salva em nenhum lugar recuperável por design. Guarde-a em um cofre de senhas ou local seguro, separado do banco de dados.

**Por que o valor estimado muda de um dia para o outro sem eu fazer nada?**
Porque o cálculo usa a data de hoje como referência — a cada dia que passa, mais rendimento é acumulado sobre o principal.

**Posso cadastrar um investimento sem data de vencimento?**
Sim. É o caso comum de Tesouro Selic e CDBs com liquidez diária — deixe o campo em branco.

**O que acontece com o cálculo depois que o investimento vence?**
O Investe Valor trava o rendimento na data de vencimento — ele não continua rendendo indefinidamente depois de vencido.

**Como sei se um investimento é isento de IR?**
A tabela de investimentos mostra a etiqueta "Isento de IR" abaixo do tipo, sempre que o tipo cadastrado for LCI, LCA ou Poupança.

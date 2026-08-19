import { expect, test } from "@playwright/test";

test.describe("fluxos licenciados do Investe Valor", () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.post("/api/auth/register", {
      data: { email: "e2e@local.test", password: "senha-e2e-segura" },
    });
    expect(response.ok()).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("e2e@local.test");
    await page.getByLabel("Senha").fill("senha-e2e-segura");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("cria, edita e exclui um investimento", async ({ page }) => {
    await page.goto("/investimentos");
    await expect(page.getByRole("heading", { name: "Investimentos" })).toBeVisible();

    await page.getByRole("button", { name: "+ Novo investimento" }).click();
    await page.getByLabel("Nome / apelido").fill("CDB E2E");
    await page.getByLabel("Instituição").fill("Banco E2E");
    await page.getByLabel("Valor investido em BRL").fill("1000");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();

    await expect(page.getByText("CDB E2E")).toBeVisible();
    const investmentRow = page.locator("tr").filter({ hasText: "CDB E2E" });
    await investmentRow.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Valor investido em BRL").fill("1250");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(investmentRow).toContainText("R$ 1.250,00");

    await investmentRow.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("button", { name: "Excluir" }).last().click();
    await expect(page.locator("table tr").filter({ hasText: "CDB E2E" })).toHaveCount(0);
  });

  test("salva taxas e fatores de conversão", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.getByLabel("Taxa CDI atual (% a.a.)").fill("11");
    await page.getByLabel("Taxa Selic atual (% a.a.)").fill("11.25");
    await page.getByLabel("IPCA projetado (% a.a.)").fill("4");
    await page.getByLabel("1 USD vale (BRL)").fill("5.25");
    await page.getByLabel("1 EUR vale (BRL)").fill("6.10");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();

    await expect(page.getByText("Configurações salvas com sucesso.")).toBeVisible();
  });

  test("cria uma posição e registra o valor mensal do patrimônio", async ({ page }) => {
    await page.goto("/patrimonio");
    await page.getByRole("button", { name: "Abrir opções" }).click();
    await page.getByRole("button", { name: "Adicionar lançamento" }).click();
    const addForm = page.locator("form").last();
    await addForm.getByLabel("Instituição").fill("Banco Patrimônio E2E");
    await addForm.getByLabel("Aplicação ou conta").fill("Reserva E2E");
    await addForm.getByRole("button", { name: "Adicionar", exact: true }).click();

    await expect(page.getByRole("cell", { name: "Banco Patrimônio E2E" })).toBeVisible();
    const monthlyValue = page.getByLabel("Reserva E2E Jan (R$ (BRL))");
    await monthlyValue.fill("2500");
    await monthlyValue.blur();
    await expect(monthlyValue).toHaveValue("2500");

    await page.getByRole("link", { name: /Abrir Dashboard do Patrimônio/ }).click();
    await expect(page.getByRole("heading", { name: "Dashboard do Patrimônio" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Banco Patrimônio E2E" }).first()).toBeVisible();
  });
});

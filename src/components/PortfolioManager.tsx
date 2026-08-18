"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import type { Currency } from "@/generated/prisma/client";

type Entry = { id: string; year: number; month: number; institution: string; category: string; currency: Currency; value: number; contributions: number; withdrawals: number };
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function PortfolioManager({ initialEntries, initialYear }: { initialEntries: Entry[]; initialYear: number }) {
  const [year, setYear] = useState(initialYear);
  const [entries, setEntries] = useState(initialEntries);
  const [institution, setInstitution] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [applicationMonth, setApplicationMonth] = useState("1");
  const [institutionFilter, setInstitutionFilter] = useState("Todas");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [movementChoiceOpen, setMovementChoiceOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<"APORTE" | "RETIRADA">("APORTE");
  const [movementInstitution, setMovementInstitution] = useState("");
  const [movementCategory, setMovementCategory] = useState("");
  const [movementMonth, setMovementMonth] = useState("1");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementError, setMovementError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<{ institution: string; category: string; currency: Currency } | null>(null);
  const [editInstitution, setEditInstitution] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("BRL");
  const [editError, setEditError] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<"edit" | "delete" | null>(null);
  const [actionKey, setActionKey] = useState("");

  async function deleteRow(row: { institution: string; category: string }) {
    if (!window.confirm(`Excluir ${row.category} da instituição ${row.institution}?`)) return;
    const response = await fetch("/api/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, institution: row.institution, category: row.category }) });
    if (response.ok) setEntries((current) => current.filter((entry) => !(entry.year === year && entry.institution === row.institution && entry.category === row.category)));
  }

  function openEditRow(row: { institution: string; category: string; currency: Currency }) {
    setEditingRow(row);
    setEditInstitution(row.institution);
    setEditCategory(row.category);
    setEditCurrency(row.currency);
    setEditError(null);
  }

  function selectedActionRow() {
    return allRows.find((row) => `${row.institution}|${row.category}` === actionKey);
  }

  function continueAction() {
    const row = selectedActionRow();
    if (!row) return;
    setActionMode(null);
    if (actionMode === "edit") openEditRow(row);
    else deleteRow(row);
  }

  async function saveRowEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingRow) return;
    try {
      const response = await fetch("/api/portfolio", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, oldInstitution: editingRow.institution, oldCategory: editingRow.category, institution: editInstitution.trim(), category: editCategory.trim(), currency: editCurrency }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Não foi possível salvar a alteração.");
      setEntries((current) => current.map((entry) => entry.institution === editingRow.institution && entry.category === editingRow.category ? { ...entry, institution: editInstitution.trim(), category: editCategory.trim(), currency: editCurrency } : entry));
      setEditingRow(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    }
  }

  async function loadYear(nextYear: number) {
    setYear(nextYear);
    const response = await fetch(`/api/portfolio?year=${nextYear}`);
    if (response.ok) setEntries(await response.json());
  }

  async function addRow(event: React.FormEvent) {
    event.preventDefault();
    if (!institution.trim() || !category.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/portfolio", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, month: Number(applicationMonth), institution, category, currency, value: 0 }) });
      if (!response.ok) throw new Error("Não foi possível criar a aplicação.");
      const entry = await response.json();
      setEntries((current) => [...current, entry]);
      setInstitution("");
      setCategory("");
      setCurrency("BRL");
      setApplicationMonth("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function saveValue(row: { institution: string; category: string; currency?: Currency; [key: string]: unknown }, month: number, value: number, movementType?: "APORTE" | "RETIRADA", movementAmount = 0) {
    const response = await fetch("/api/portfolio", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...row, year, month, currency: row.currency, value, movementType, movementAmount }) });
    if (!response.ok) return;
    const saved = await response.json();
    setEntries((current) => {
      const without = current.filter((entry) => !(entry.institution === row.institution && entry.category === row.category && entry.month === month));
      return [...without, saved];
    });
  }

  async function importWorkbook(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/portfolio/import", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Não foi possível importar a planilha.");
    else {
      setMessage(`${result.imported} valores importados das abas ${result.years.join(", ")}.`);
      const refreshed = await fetch(`/api/portfolio?year=${year}`);
      if (refreshed.ok) setEntries(await refreshed.json());
    }
    setImporting(false);
    event.target.value = "";
  }

  function openMovement(type: "APORTE" | "RETIRADA") {
    const first = allRows[0];
    setMovementChoiceOpen(false);
    setMovementType(type);
    setMovementInstitution(first?.institution ?? "");
    setMovementCategory(first?.category ?? "");
    setMovementMonth("1");
    setMovementAmount("");
    setMovementError(null);
    setMovementOpen(true);
  }

  async function saveMovement(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(movementAmount);
    const month = Number(movementMonth);
    const selectedRow = allRows.find((item) => item.institution === movementInstitution && item.category === movementCategory);
    const row = { institution: movementInstitution, category: movementCategory, currency: selectedRow?.currency ?? "BRL" as Currency };
    const current = valueFor(row, month);
    if (!Number.isFinite(amount) || amount <= 0 || (movementType === "RETIRADA" && amount > current)) {
      setMovementError(movementType === "RETIRADA" ? "A retirada não pode ser maior que o valor do mês." : "Informe um valor válido.");
      return;
    }
    await saveValue(row, month, current + (movementType === "APORTE" ? amount : -amount), movementType, amount);
    setMovementOpen(false);
  }

  const allRows = Array.from(new Map(entries.map((entry) => [`${entry.institution}|${entry.category}`, { institution: entry.institution, category: entry.category, currency: entry.currency ?? "BRL" as Currency }])).values());
  const institutions = Array.from(new Set(allRows.map((row) => row.institution))).sort();
  const categories = Array.from(new Set(allRows.map((row) => row.category))).sort();
  const rows = allRows.filter((row) => {
    const matchesInstitution = institutionFilter === "Todas" || row.institution === institutionFilter;
    const matchesCategory = categoryFilter === "Todas" || row.category === categoryFilter;
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return matchesInstitution && matchesCategory && (!query || `${row.institution} ${row.category}`.toLocaleLowerCase("pt-BR").includes(query));
  });
  const valueFor = (row: { institution: string; category: string }, month: number) => entries.find((entry) => entry.institution === row.institution && entry.category === row.category && entry.month === month)?.value ?? 0;
  const rentFor = (row: { institution: string; category: string }, month: number) => {
    const previousEntry = entries.find((entry) => entry.institution === row.institution && entry.category === row.category && entry.month === month - 1);
    const currentEntry = entries.find((entry) => entry.institution === row.institution && entry.category === row.category && entry.month === month);
    const previous = previousEntry?.value ?? 0;
    const current = currentEntry?.value ?? 0;
    const netFlow = (currentEntry?.contributions ?? 0) - (currentEntry?.withdrawals ?? 0);
    return previous > 0 ? (current - previous - netFlow) / previous : null;
  };
  const totalFor = (month: number) => rows.reduce((sum, row) => sum + valueFor(row, month), 0);
  const totalRentFor = (month: number) => {
    const previous = totalFor(month - 1);
    const current = totalFor(month);
    const flow = rows.reduce((sum, row) => {
      const entry = entries.find((item) => item.institution === row.institution && item.category === row.category && item.month === month);
      return sum + (entry?.contributions ?? 0) - (entry?.withdrawals ?? 0);
    }, 0);
    return previous > 0 ? (current - previous - flow) / previous : null;
  };
  const populatedMonths = Array.from(new Set(entries.filter((entry) => entry.value > 0).map((entry) => entry.month))).sort((a, b) => a - b);
  const latestMonth = populatedMonths.at(-1) ?? 0;
  const latestTotal = totalFor(latestMonth);
  const latestRent = latestMonth > 0 ? totalRentFor(latestMonth) : null;
  const institutionTotals = institutions.map((name) => ({ name, value: allRows.filter((row) => row.institution === name).reduce((sum, row) => sum + valueFor(row, latestMonth), 0) })).sort((a, b) => b.value - a.value);
  const maxInstitutionValue = institutionTotals[0]?.value ?? 1;
  const money = (value: number, rowCurrency: Currency = "BRL") => value.toLocaleString("pt-BR", { style: "currency", currency: rowCurrency });
  const currencyLabel = (rowCurrency: Currency) => rowCurrency === "USD" ? "US$ (USD)" : rowCurrency === "EUR" ? "€ (EUR)" : "R$ (BRL)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Controle financeiro</p><h1 className="text-3xl font-semibold mt-1">Controle do Patrimônio</h1><p className="text-sm text-muted mt-1">Lançamentos mensais da carteira, aportes e retiradas.</p></div>
        <div className="flex items-center gap-2"><Label htmlFor="year">Ano</Label><Input id="year" aria-label="Ano" type="number" min="2000" max="2200" value={year} onChange={(event) => loadYear(Number(event.target.value))} className="w-28" /></div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"><div><p className="text-sm font-medium">Edição do patrimônio de {year}</p><p className="text-xs text-muted mt-0.5">Os valores são registrados mês a mês na moeda de cada aplicação.</p></div><Link href="/dashboard" className="shrink-0 text-sm font-medium text-primary hover:underline">Abrir Dashboard do Patrimônio →</Link></div>
      <div className="hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5"><p className="text-xs uppercase tracking-wide text-muted">Patrimônio em {MONTHS[latestMonth - 1] ?? "dez. ant."}</p><p className="text-2xl font-semibold mt-2">{money(latestTotal)}</p><p className="text-xs text-muted mt-1">{allRows.length} linhas acompanhadas</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs uppercase tracking-wide text-muted">Variação mensal</p><p className={`text-2xl font-semibold mt-2 ${latestRent === null || latestRent >= 0 ? "text-success" : "text-danger"}`}>{latestRent === null ? "-" : `${(latestRent * 100).toFixed(2)}%`}</p><p className="text-xs text-muted mt-1">comparado ao mês anterior</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs uppercase tracking-wide text-muted">Maior concentração</p><p className="text-2xl font-semibold mt-2 truncate">{institutionTotals[0]?.name ?? "-"}</p><p className="text-xs text-muted mt-1">{institutionTotals[0] ? money(institutionTotals[0].value) : "Sem dados"}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs uppercase tracking-wide text-muted">Saldo do ano anterior</p><p className="text-2xl font-semibold mt-2">{money(totalFor(0))}</p><p className="text-xs text-muted mt-1">base para calcular janeiro</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Card><CardHeader><CardTitle>Evolução mensal</CardTitle></CardHeader><CardContent><div className="h-44 flex items-end gap-2 border-b border-border">{MONTHS.map((month, index) => { const value = totalFor(index + 1); const height = latestTotal > 0 ? Math.max(4, (value / latestTotal) * 100) : 4; return <div key={month} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><span className="text-[10px] text-muted truncate max-w-full">{value > 0 ? money(value) : "-"}</span><div className="w-full max-w-10 rounded-t-md bg-primary/80 hover:bg-primary transition-colors" style={{ height: `${Math.min(100, height)}%` }} /><span className="text-[10px] text-muted">{month}</span></div>; })}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Distribuição por instituição</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">{institutionTotals.slice(0, 5).map((item) => <div key={item.name}><div className="flex justify-between gap-3 text-xs mb-1"><span className="truncate">{item.name}</span><span className="font-medium">{money(item.value)}</span></div><div className="h-2 bg-surface-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(2, (item.value / maxInstitutionValue) * 100)}%` }} /></div></div>)}{!institutionTotals.length && <p className="text-sm text-muted">Importe a planilha para visualizar a distribuição.</p>}</CardContent></Card>
      </div>
      <Card><CardContent className="pt-5"><div className="flex flex-col lg:flex-row lg:items-end gap-3"><div className="flex-1"><Label htmlFor="search">Pesquisar</Label><Input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Instituição ou aplicação" /></div><div className="w-full lg:w-56"><Label htmlFor="institutionFilter">Instituição</Label><select id="institutionFilter" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={institutionFilter} onChange={(event) => setInstitutionFilter(event.target.value)}><option>Todas</option>{institutions.map((item) => <option key={item}>{item}</option>)}</select></div><div className="w-full lg:w-56"><Label htmlFor="categoryFilter">Aplicação</Label><select id="categoryFilter" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><Button variant="ghost" onClick={() => { setSearch(""); setInstitutionFilter("Todas"); setCategoryFilter("Todas"); }}>Limpar filtros</Button></div><p className="text-xs text-muted mt-3">Exibindo {rows.length} de {allRows.length} linhas.</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Adicionar lançamento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addRow} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px_180px_auto] gap-3 items-end">
            <div><Label htmlFor="institution">Instituição</Label><Input id="institution" value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Ex.: Safra" /></div>
            <div><Label htmlFor="category">Aplicação ou conta</Label><Input id="category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex.: Reserva financeira" /></div>
            <div><Label htmlFor="portfolioCurrency">Moeda</Label><Select id="portfolioCurrency" value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option><option value="EUR">Euro (EUR)</option></Select></div>
            <div><Label htmlFor="applicationMonth">Mês inicial</Label><Select id="applicationMonth" value={applicationMonth} onChange={(event) => setApplicationMonth(event.target.value)}>{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</Select></div>
            <Button type="submit" disabled={busy}>Adicionar</Button>
          </form>
          {message && <p className="text-sm text-success mt-3">{message}</p>}
          {error && <p className="text-sm text-danger mt-3">{error}</p>}
        </CardContent>
      </Card>
      <Card className="portfolio-action-card"><CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="font-medium">Aportes e retiradas</p><p className="text-xs text-muted mt-1">Registre alterações em uma aplicação já acompanhada.</p></div><Button variant="secondary" size="md" className="shrink-0 min-h-10 whitespace-nowrap" onClick={() => setMovementChoiceOpen(true)} disabled={!allRows.length}>Movimentar patrimônio</Button></CardContent></Card>
      <Card>
        <CardContent className="pt-5 flex items-center justify-between gap-4">
          <div><p className="font-medium">Importar planilha</p><p className="text-xs text-muted mt-1">Importa as abas anuais e mantém os dados já cadastrados.</p></div>
          <label className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium cursor-pointer">
            {importing ? "Importando..." : "Selecionar .xlsx"}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importWorkbook} disabled={importing} />
          </label>
        </CardContent>
      </Card>
      <Card><CardContent className="pt-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><button type="button" className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-left hover:bg-primary/10" onClick={() => { setActionMode("edit"); setActionKey(""); }}><span className="block font-medium text-primary">Alterar lançamento</span><span className="block text-xs text-muted mt-1">Escolha a aplicação, instituição ou moeda que deseja atualizar.</span></button><button type="button" className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-left hover:bg-danger/10" onClick={() => { setActionMode("delete"); setActionKey(""); }}><span className="block font-medium text-danger">Excluir lançamento</span><span className="block text-xs text-muted mt-1">Escolha uma linha para remover todos os seus meses.</span></button></div></CardContent></Card>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[1900px]"><thead><tr className="border-b border-border text-left"><th className="px-4 py-3 sticky left-0 bg-surface">Instituição</th><th className="px-4 py-3 sticky left-[120px] bg-surface">Aplicação</th><th className="px-2 py-3 text-right">Dez ant. (moeda)</th>{MONTHS.map((month) => <th key={month} colSpan={2} className="px-2 py-3 text-center">{month}</th>)}</tr><tr className="border-b border-border text-xs text-muted"><th /><th /><th />{MONTHS.map((month) => <Fragment key={month}><th className="px-2 py-2 text-right">Valor (moeda)</th><th className="px-2 py-2 text-right">Rent. (%)</th></Fragment>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={`${row.institution}|${row.category}`} className="border-b border-border"><td className="px-4 py-2 font-medium whitespace-nowrap sticky left-0 bg-surface">{row.institution}</td><td className="px-4 py-2 whitespace-nowrap sticky left-[120px] bg-surface">{row.category} <span className="text-xs text-primary">{currencyLabel(row.currency)}</span></td><td className="px-1 py-1"><input aria-label={`${row.category} Dezembro anterior (${currencyLabel(row.currency)})`} placeholder={currencyLabel(row.currency)} className="w-28 rounded border border-border bg-background px-2 py-1.5 text-right" type="number" min="0" step="0.01" defaultValue={valueFor(row, 0) || ""} onBlur={(event) => saveValue({ ...row, id: "", year, month: 0, value: 0 }, 0, Number(event.target.value) || 0)} /></td>{MONTHS.map((_, index) => <Fragment key={index}><td className="px-1 py-1"><input aria-label={`${row.category} ${MONTHS[index]} (${currencyLabel(row.currency)})`} placeholder={currencyLabel(row.currency)} className="w-28 rounded border border-border bg-background px-2 py-1.5 text-right" type="number" min="0" step="0.01" defaultValue={valueFor(row, index + 1) || ""} onBlur={(event) => saveValue({ ...row, id: "", year, month: index + 1, value: 0 }, index + 1, Number(event.target.value) || 0)} /></td><td className={`px-2 py-1 text-right whitespace-nowrap ${((rentFor(row, index + 1) ?? 0) >= 0 ? "text-success" : "text-danger")}`}>{rentFor(row, index + 1) === null ? "-" : `${(rentFor(row, index + 1)! * 100).toFixed(2)}%`}</td></Fragment>)}</tr>)}
              <tr className="font-semibold bg-surface-muted"><td className="px-4 py-3" colSpan={2}>Total</td><td className="px-2 py-3 text-right">{money(totalFor(0))}</td>{MONTHS.map((_, index) => <Fragment key={index}><td className="px-2 py-3 text-right">{money(totalFor(index + 1))}</td><td className="px-2 py-3 text-right">{totalRentFor(index + 1) === null ? "-" : `${(totalRentFor(index + 1)! * 100).toFixed(2)}%`}</td></Fragment>)}</tr>
            </tbody>
          </table>
          {!rows.length && <p className="p-6 text-sm text-muted">Adicione a primeira instituição para começar.</p>}
        </CardContent>
      </Card>
      <Modal open={actionMode !== null} onClose={() => setActionMode(null)} title={actionMode === "edit" ? "Alterar lançamento" : "Excluir lançamento"}><div className="flex flex-col gap-4"><div><Label htmlFor="actionRow">Lançamento</Label><Select id="actionRow" value={actionKey} onChange={(event) => setActionKey(event.target.value)} required><option value="">Selecione uma aplicação</option>{allRows.map((row) => <option key={`${row.institution}|${row.category}`} value={`${row.institution}|${row.category}`}>{row.institution} · {row.category} · {currencyLabel(row.currency)}</option>)}</Select></div><p className="text-xs text-muted">{actionMode === "edit" ? "Na próxima etapa você poderá alterar os dados da linha." : "A exclusão removerá os valores de todos os meses desta linha."}</p><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setActionMode(null)}>Cancelar</Button><Button type="button" variant={actionMode === "delete" ? "danger" : "primary"} disabled={!actionKey} onClick={continueAction}>{actionMode === "edit" ? "Continuar" : "Excluir"}</Button></div></div></Modal>
      <Modal open={!!editingRow} onClose={() => setEditingRow(null)} title="Alterar lançamento"><form onSubmit={saveRowEdit} className="flex flex-col gap-4"><div><Label htmlFor="editInstitution">Instituição</Label><Input id="editInstitution" value={editInstitution} onChange={(event) => setEditInstitution(event.target.value)} required /></div><div><Label htmlFor="editCategory">Aplicação ou conta</Label><Input id="editCategory" value={editCategory} onChange={(event) => setEditCategory(event.target.value)} required /></div><div><Label htmlFor="editCurrency">Moeda</Label><Select id="editCurrency" value={editCurrency} onChange={(event) => setEditCurrency(event.target.value as Currency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option><option value="EUR">Euro (EUR)</option></Select></div>{editError && <p className="text-sm text-danger">{editError}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditingRow(null)}>Cancelar</Button><Button type="submit">Salvar alteração</Button></div></form></Modal>
      <Modal open={movementChoiceOpen} onClose={() => setMovementChoiceOpen(false)} title="O que você deseja registrar?"><div className="flex flex-col gap-3"><p className="text-sm text-muted">A nova aplicação é criada na seção acima. Para uma linha existente, escolha o tipo de movimentação.</p><Button onClick={() => openMovement("APORTE")}>Aporte em aplicação existente</Button><Button variant="secondary" onClick={() => openMovement("RETIRADA")}>Retirada de aplicação existente</Button></div></Modal>
      <Modal open={movementOpen} onClose={() => setMovementOpen(false)} title={movementType === "APORTE" ? "Registrar aporte" : "Registrar retirada"}><form onSubmit={saveMovement} className="flex flex-col gap-4"><div><Label htmlFor="movementInstitution">Instituição</Label><Select id="movementInstitution" value={movementInstitution} onChange={(event) => { setMovementInstitution(event.target.value); setMovementCategory(allRows.find((row) => row.institution === event.target.value)?.category ?? ""); }}>{institutions.map((item) => <option key={item}>{item}</option>)}</Select></div><div><Label htmlFor="movementCategory">Aplicação</Label><Select id="movementCategory" value={movementCategory} onChange={(event) => setMovementCategory(event.target.value)}>{allRows.filter((row) => row.institution === movementInstitution).map((row) => <option key={row.category}>{row.category}</option>)}</Select><p className="text-[11px] text-muted mt-1">Moeda: {allRows.find((row) => row.institution === movementInstitution && row.category === movementCategory)?.currency ?? "BRL"}</p></div><div><Label htmlFor="movementMonth">Mês</Label><Select id="movementMonth" value={movementMonth} onChange={(event) => setMovementMonth(event.target.value)}>{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</Select></div><div><Label htmlFor="movementAmount">Valor na moeda da aplicação</Label><Input id="movementAmount" type="number" min="0.01" step="0.01" value={movementAmount} onChange={(event) => setMovementAmount(event.target.value)} required /></div>{movementError && <p className="text-sm text-danger">{movementError}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setMovementOpen(false)}>Cancelar</Button><Button type="submit">Registrar</Button></div></form></Modal>
    </div>
  );
}
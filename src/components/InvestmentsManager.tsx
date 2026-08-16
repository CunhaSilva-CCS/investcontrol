"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentsTable } from "@/components/InvestmentsTable";
import type { InvestmentDTO } from "@/lib/types";
import type { RatesSettings } from "@/lib/investment-calc";

export function InvestmentsManager({
  initialInvestments,
  rates,
}: {
  initialInvestments: InvestmentDTO[];
  rates: RatesSettings;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentDTO | null>(null);
  const [deleting, setDeleting] = useState<InvestmentDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(inv: InvestmentDTO) {
    setEditing(inv);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    setEditing(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      const res = await fetch(`/api/investments/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Não foi possível excluir o investimento.");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>+ Novo investimento</Button>
      </div>

      <InvestmentsTable investments={initialInvestments} rates={rates} onEdit={openEdit} onDelete={setDeleting} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar investimento" : "Novo investimento"}>
        <InvestmentForm investment={editing} onSaved={handleSaved} onCancel={() => setFormOpen(false)} />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Excluir investimento">
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Tem certeza que deseja excluir <strong>{deleting?.name}</strong>? Essa ação não pode ser desfeita.
          </p>
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

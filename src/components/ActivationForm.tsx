"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ActivationForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "Não foi possível ativar a licença.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-lg w-full">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="license-key">Chave de licença</Label>
            <textarea
              id="license-key"
              required
              rows={4}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="IV1...."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Ativando..." : "Ativar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

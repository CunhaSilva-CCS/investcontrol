"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountMenu({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return <div className="flex items-center gap-2 border-l border-border pl-3" title={email}><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{email.slice(0, 1).toUpperCase()}</span><div className="hidden sm:block max-w-40"><p className="text-xs font-semibold truncate">{email}</p><div className="flex items-center gap-2 text-[10px]"><Link href="/seguranca" className="text-primary hover:underline">Segurança</Link><button type="button" onClick={logout} className="text-muted hover:text-foreground">Sair</button></div></div></div>;
}

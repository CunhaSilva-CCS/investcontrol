"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BrandMark } from "@/components/BrandMark";
import type { LicensePayload } from "@/lib/license";

const LINKS = [
  { href: "/", label: "Painel" },
  { href: "/investimentos", label: "Investimentos" },
  { href: "/patrimonio", label: "Patrimônio" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/configuracoes", label: "Configurações" },
];

export function NavBar({ license }: { license: LicensePayload | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <BrandMark className="h-8 w-8 rounded-lg" />
          Investe Valor
        </Link>
        {license && (
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1 max-w-[calc(100vw-9rem)] overflow-x-auto pb-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:text-foreground hover:bg-surface-muted"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            </nav>
            <div className="flex items-center gap-2 border-l border-border pl-3" title={license.email ?? license.customer}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {license.customer.slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden sm:block max-w-32">
                <p className="text-xs font-semibold truncate">{license.customer}</p>
                <p className="text-[10px] text-muted">Perfil ativo</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

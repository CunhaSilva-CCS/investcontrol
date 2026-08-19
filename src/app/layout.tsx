import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { getLicenseOrNull } from "@/lib/license";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Investe Valor",
  description: "Controle financeiro e acompanhamento de investimentos: CDB, CDI, LCA, LCI e mais.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const license = getLicenseOrNull();
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar license={license} userEmail={user?.email ?? null} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted bg-surface/40">
          Investe Valor — controle financeiro e acompanhamento de investimentos
        </footer>
      </body>
    </html>
  );
}

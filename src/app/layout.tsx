import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "InvestControl",
  description: "Controle seus investimentos de renda fixa: CDB, CDI, LCA, LCI e mais.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavBar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          InvestControl — controle de investimentos de renda fixa
        </footer>
      </body>
    </html>
  );
}

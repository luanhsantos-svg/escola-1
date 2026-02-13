import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tabulação Escolar", description: "Correção automatizada de provas" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

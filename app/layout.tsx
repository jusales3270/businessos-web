import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BusinessOS — Sara",
  description: "Supervisora Autônoma de Resultados e Alertas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

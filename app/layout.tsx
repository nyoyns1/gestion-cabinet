import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhysioManager Pro",
  description: "Application complète de gestion de cabinet (SaaS)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
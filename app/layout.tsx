import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";

export const metadata: Metadata = {
  title: "Manicure Expert",
  description: "Sua manicure onde você estiver.",
  manifest: "/manifest.webmanifest",
  themeColor: "#e93f86"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

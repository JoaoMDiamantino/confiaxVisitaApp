import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#00AEEF",
};

export const metadata: Metadata = {
  title: "Confiax Visita",
  description: "Gestão de visitas comerciais às imobiliárias parceiras",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Confiax Visita",
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/logo-icon-192.png", sizes: "192x192", type: "image/png" }],
    other: [{ rel: "icon", url: "/logo-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

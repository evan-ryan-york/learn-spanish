import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rato — Habla español",
  description: "Conversaciones cotidianas en español de México.",
  applicationName: "Rato",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rato",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f0e6",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-MX" translate="no" className="notranslate">
      <body translate="no">{children}</body>
    </html>
  );
}

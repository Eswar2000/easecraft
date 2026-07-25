import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Easecraft | Component Explorer",
  description: "Accessible motion primitives and animated React components.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5f5f0",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

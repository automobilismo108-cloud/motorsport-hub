import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motorsport Hub",
  description: "Gerenciador e simulador de automobilismo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

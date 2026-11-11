import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";

export const metadata: Metadata = {
  title: "Motorsport Hub",
  description: "Gerenciador e simulador de automobilismo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><AuthProvider>{children}</AuthProvider></body></html>;
}

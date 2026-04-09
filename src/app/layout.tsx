import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nicomax | Monitoreo de Obras",
  description: "Sistema inteligente de seguimiento de proyectos de construcción",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-background text-foreground font-inter">
        <Sidebar />
        <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </body>
    </html>
  );
}

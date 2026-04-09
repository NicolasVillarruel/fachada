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
      <body className="h-[100dvh] flex flex-col lg:flex-row bg-background text-foreground font-inter overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </main>
      </body>
    </html>
  );
}

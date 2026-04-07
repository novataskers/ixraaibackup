import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-context";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IxraAI - All-in-One AI Creative Suite",
  description: "Generate video, music, and split clips with the power of AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
        <body className={inter.className} suppressHydrationWarning>
          <ThemeProvider>
            <div className="flex min-h-screen md:h-screen md:overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto relative pt-14 md:pt-0" id="main-content" style={{background:"var(--page-bg)"}}>

                {children}
              </main>
            </div>
          </ThemeProvider>
        </body>
    </html>
  );
}

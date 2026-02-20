import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import { SessionProvider } from "@/components/SessionProvider";
import { UIProvider } from "@/components/UIProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const solaimanLipi = localFont({
  src: "./fonts/solaimanlipi.ttf",
  variable: "--font-solaiman",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edusy - Smart Management",
  description: "Modern management for Madrasas and Kindergartens",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${solaimanLipi.variable} font-sans antialiased`}>
        <SessionProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </SessionProvider>
      </body>
    </html>

  );
}

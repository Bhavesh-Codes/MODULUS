import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"], weight: ["700", "800"], variable: "--font-heading" 
});

const beVietnamPro = Be_Vietnam_Pro({ 
  subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans" 
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" 
});

export const metadata: Metadata = {
  title: "MODULUS",
  description: "Collaborative learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${beVietnamPro.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#F5F5F0] text-[#0A0A0A]`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

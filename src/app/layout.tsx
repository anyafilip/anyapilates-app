import type { Metadata } from "next";
import { Sarabun, Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Anya Pilates",
  description: "Book your Pilates classes online",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Anya Pilates",
    description: "Book your Pilates classes online",
    images: [{ url: "/logo.jpg" }],
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`${sarabun.variable} ${lora.variable}`}
    >
      <body
        className="antialiased min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-sarabun), sans-serif" }}
      >
        <Toaster position="top-center" toastOptions={{
          style: {
            background: 'var(--foreground)',
            color: 'var(--background)',
            fontSize: '14px',
            borderRadius: '100px',
            padding: '12px 24px',
          }
        }} />
        {children}
      </body>
    </html>
  );
}

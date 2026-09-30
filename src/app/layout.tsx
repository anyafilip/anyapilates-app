import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://anyapilatesstudio.com"),
  title: {
    default: "Anya Pilates Studio | Premium Pilates in Bangkok",
    template: "%s | Anya Pilates Studio",
  },
  description: "Experience premium Pilates classes in Bangkok at Anya Pilates Studio. We offer private, duo, and group reformer classes designed to build strength, flexibility, and lean muscle.",
  keywords: ["Pilates", "Reformer Pilates", "Bangkok Pilates", "Pilates Studio Bangkok", "Private Pilates", "Group Pilates", "Fitness", "Anya Pilates"],
  authors: [{ name: "Anya Pilates Studio" }],
  creator: "Anya Pilates Studio",
  publisher: "Anya Pilates Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Anya Pilates Studio | Premium Pilates in Bangkok",
    description: "Experience premium Pilates classes in Bangkok at Anya Pilates Studio. We offer private, duo, and group reformer classes.",
    url: "https://anyapilatesstudio.com",
    siteName: "Anya Pilates Studio",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Anya Pilates Studio Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anya Pilates Studio | Premium Pilates in Bangkok",
    description: "Experience premium Pilates classes in Bangkok at Anya Pilates Studio.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        className="antialiased min-h-screen flex flex-col overscroll-none"
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

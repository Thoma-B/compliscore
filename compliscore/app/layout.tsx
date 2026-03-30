import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CompliScore — Audit RGPD & Cybersécurité Gratuit",
  description:
    "Scannez votre site et découvrez votre score de conformité RGPD et cybersécurité en 30 secondes. Gratuit.",
  openGraph: {
    title: "CompliScore — Audit RGPD & Cybersécurité Gratuit",
    description:
      "Scannez votre site et découvrez votre score de conformité RGPD et cybersécurité en 30 secondes.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "CompliScore",
              description:
                "Audit RGPD & Cybersécurité gratuit. Scannez votre site et découvrez votre score de conformité.",
              applicationCategory: "SecurityApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              inLanguage: "fr",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}

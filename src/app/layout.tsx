import type { Metadata } from "next"
import { DM_Sans, Playfair_Display, Caveat, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-switcher"
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration"
import "./globals.css"

// Critical body font — preload + swap
const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
})

// Display font — swap (not preloaded to save initial load)
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
})

// Script font — minimal
const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
})

// Mono font — minimal
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "Noon & Noir — Wine Alley POS",
  description: "drink slowly · laugh quietly · stay longer",
  icons: { icon: "/favicon.ico", apple: "/icons/icon-192.png" },
  manifest: "/manifest.json",
  themeColor: "#14532d",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noon & Noir",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} ${caveat.variable} ${jetbrainsMono.variable} font-sans antialiased bg-cream-50 text-green-900`}
      >
        <TooltipProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </TooltipProvider>
        <ServiceWorkerRegistration />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-cream-100)",
              border: "1px solid var(--color-cream-300)",
              color: "var(--color-green-900)",
            },
          }}
        />
      </body>
    </html>
  )
}

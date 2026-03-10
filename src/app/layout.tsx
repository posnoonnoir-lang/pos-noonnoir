import type { Metadata } from "next"
import { DM_Sans, Playfair_Display, Caveat, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "600"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Noon & Noir — Wine Alley POS",
  description: "drink slowly · laugh quietly · stay longer",
  icons: { icon: "/favicon.ico" },
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
          {children}
        </TooltipProvider>
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

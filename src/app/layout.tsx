import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/hooks/use-auth"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Synnical — Cloud Gaming, Chat & Browser",
  description: "Minimal cloud gaming platform with real-time chat, browser, and profile.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#f0f0f0]`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  )
}



import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { UserProvider } from "@/hooks/usercontext"
import { ToastProvider } from "@/components/custom-ui/toast-provider"
import "./globals.css"
import { CollectionsProvider } from "@/hooks/collections"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dot",
  description: "Advart task manager",
  authors: { name: "Advart Team" },
  keywords: "task manager, project management, productivity, advart",
  themeColor: "#000000",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    site: "@your_twitter_handle",
    title: "Dot - Advart Task Manager",
    description: "Manage your tasks effectively with Dot",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.yourwebsite.com",
    title: "Dot - Advart Task Manager",
    description: "Manage your tasks effectively with Dot",
    siteName: "Dot",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dot App OpenGraph Image",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Advart task manager" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <CollectionsProvider>npm r
            <ToastProvider>
              {children}
            </ToastProvider>
          </CollectionsProvider>
        </UserProvider>
      </body>
    </html>
  )
}
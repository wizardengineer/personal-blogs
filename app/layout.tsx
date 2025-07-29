// app/layout.tsx
import "./globals.css"
import Navbar from "@/components/Navbar"

export const metadata = {
  title: "Wizard Engineer",
  description: "Julius’s blog about compilers, security, engineering & more",
  icons: {
    icon: [
      { url: "/wizard.svg", type: "image/svg+xml" },    // ← root‐relative
    ],
    shortcut: "/wizard.svg",                            // ← root‐relative
    // apple: "/apple-touch-icon.png",                  // if you have one
  },
} as const

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}

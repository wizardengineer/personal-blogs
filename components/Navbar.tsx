// components/Navbar.tsx

// components/Navbar.tsx
"use client"
import Link from "next/link"

const links = [
  { href: "/",        label: "Blog" },
  { href: "/about",   label: "About" },
  { href: "/projects",label: "Projects" },
  // { href: "/pubs",    label: "Academics & Publications" },
]

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-4xl mx-auto flex items-center justify-between py-4 px-6">
        <Link href="/" className="text-xl font-semibold">Julius Alexandre</Link>
        <ul className="flex space-x-6">
          <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          <li><Link href="/about" className="hover:underline">About</Link></li>
        </ul>
      </div>
    </nav>
  )
}

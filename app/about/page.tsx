// app/about/page.tsx
import Link from "next/link"
import Image from "next/image"

export default function AboutPage() {
  return (
    <article className="prose lg:prose-xl mx-auto py-12">
      {/* ——— Header with photo & CV link ——— */}
      <div className="flex flex-col items-center space-y-4 mb-12">
        <Image
          src="/me.png"           // ← put your headshot in public/me.jpg
          alt="Julius Alexandre"
          width={160}
          height={160}
          className="rounded-full"
        />

        <Link
          href="../../public/cv.pdf"          // ← put your CV in public/cv.pdf
          target="_blank"
          className="text-blue-600 hover:underline"
        >
        CV
        </Link>
      </div>

      {/* ——— Intro paragraph(s) ——— */}
      <p>
        Hi! I’m <strong>Julius Alexandre</strong>, a software engineer
        with a compiler security background. Currently working at <a 
        href="https://www.trailofbits.com/"
        className="text-blue-600 hover:underline"
        >Trail of bits</a>!
      </p>
      {/* ——— More detail ——— */}
      <h2>Experience & Interests</h2>
      <ul>
        <li>Compiler optimizations & Static analysis</li>
        <li>Formal Verification</li>
        <li>Type Theory</li>
        <li>System Programming</li>
      </ul>

      <h2>Get in Touch</h2>
      <p>
        Connect with me on{" "}
        <a
          href="https://www.linkedin.com/in/julius-alexandre/"
          className="text-blue-600 hover:underline"
        >
         LinkedIn 
        </a>{" "}
        or {" "}
        <a
          href="https://github.com/wizardengineer"
          className="text-blue-600 hover:underline"
        >
          GitHub
        </a>
        .
      </p>
    </article>
  )
}

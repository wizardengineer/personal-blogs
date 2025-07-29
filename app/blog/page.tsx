// app/blog/page.tsx
import Link from "next/link"
import { getSortedArticles } from "@/lib/articles"
import type { ArticleItem } from "@/types"

export default function BlogPage() {
  const posts = getSortedArticles()

  return (
    <section className="flex flex-col items-center  justify-items-start mx-auto">
      {/* Page title */}

      {/* Posts list */}
      <ul className="space-y-10">
        {posts.map((post) => (
          <li key={post.id} className="group">
            {/* Title */}
            <Link
              href={`/blog/${post.id}`}
              className="block text-3xl font-semibold text-blue-600 hover:underline"
            >
              {post.title}
            </Link>

            {/* Date under the title */}
            <p className="mt-2 text-gray-500 text-sm">{post.date}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

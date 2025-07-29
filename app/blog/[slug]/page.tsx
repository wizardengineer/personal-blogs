// app/blog/[slug]/page.tsx
import { getArticleData } from "@/lib/articles"
import type { ArticleData } from "@/types"
import { getSortedArticles } from "@/lib/articles"   // ← add this

export async function generateStaticParams() {
  return getSortedArticles().map((post) => ({ slug: post.id }))
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { title, date, contentHtml }: ArticleData = await getArticleData(params.slug)

  return (
    <article className="prose lg:prose-lg mx-auto py-12">
      {/* Title & date */}
      <h1>{title}</h1>
      <p className="text-gray-500">{date}</p>

      {/* Rendered HTML from Markdown */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </article>
  )
}

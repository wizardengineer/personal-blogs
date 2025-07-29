// app/[slug]/page.tsx
import { getArticleData, getAllArticleIds } from "@/lib/articles"

export async function generateStaticParams() {
  return getAllArticleIds()
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { title, date, contentHtml } = await getArticleData(params.slug)

  return (
    <article className="py-12">
      <h1 className="text-5xl font-semibold mb-2">{title}</h1>
      <div className="text-gray-500 mb-8">{date}</div>
      <div
        className="prose prose-lg"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  )
}

// app/page.tsx
import { getSortedArticles } from "@/lib/articles"
import ArticleListItem from "@/components/ArticleListItem"

export default function HomePage() {
  const posts = getSortedArticles()

  return (
    <section className="py-12">
      <h3 className="text-4xl font-light mb-8">Welcome! Hopefully you gain something from this...</h3>
      <h1 className="text-4xl font-light mb-8">Latest Posts</h1>
      <ul>
        {posts.map((p) => (
          <ArticleListItem key={p.id} article={p} />
        ))}
      </ul>
    </section>
  )
}

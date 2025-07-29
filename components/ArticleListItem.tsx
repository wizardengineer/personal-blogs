// components/ArticleListItem.tsx
import Link from "next/link"
import type { ArticleItem } from "@/types"

interface Props {
  article: ArticleItem
}

export default function ArticleListItem({ article }: Props) {
  return (
    <li className="mb-4">
      <span className="text-gray-500 mr-2">{article.date}</span>
      <Link href={`/${article.id}`} className="text-blue-600 hover:underline">
        {article.title}
      </Link>
    </li>
  )
}

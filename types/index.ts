// types/index.ts
export interface ArticleItem {
  id: string       // filename without “.md”
  title: string
  date: string     // e.g. “Aug 28, 2024”
}

export interface ArticleData extends ArticleItem {
  contentHtml: string
}

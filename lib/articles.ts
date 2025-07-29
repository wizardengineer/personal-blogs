// lib/articles.ts
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import rehypeStringify from "rehype-stringify"
import moment from "moment"
import type { ArticleItem, ArticleData } from "@/types"

const articlesDirectory = path.join(process.cwd(), "articles")
const articlesDir = path.join(process.cwd(), "articles")

// 1) Get list of all posts (ids + front-matter)
export function getSortedArticles(): ArticleItem[] {
  const files = fs.readdirSync(articlesDir)
  const all = files.map((f) => {
    const id = f.replace(/\.md$/, "")
    const raw = fs.readFileSync(path.join(articlesDir, f), "utf-8")
    const { data } = matter(raw)
    const formatted = moment(data.date, "DD-MM-YYYY").format("MMM D, YYYY")
    return { id, title: data.title, date: formatted }
  })
  return all.sort((a, b) => (a.date < b.date ? 1 : -1))
}

// 2) For dynamic routes
export function getAllArticleIds() {
  return fs
    .readdirSync(articlesDir)
    .map((f) => ({ slug: f.replace(/\.md$/, "") }))
}

// 3) Get one article’s HTML + metadata
export async function getArticleData(id: string): Promise<ArticleData> {
  // 1) read file + front-matter
  const fullPath = path.join(articlesDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(fileContents)

  // 2) unified pipeline: parse → GFM → rehype → highlight → stringify
  const processed = await unified()
    .use(remarkParse)       // parse Markdown
    .use(remarkGfm)         // GitHub-flavored Markdown (tables, fences)
    .use(remarkRehype)      // turn Markdown AST into HTML AST
    .use(rehypeHighlight)   // syntax-highlight code blocks
    .use(rehypeStringify)   // serialize HTML AST to HTML string
    .process(content)

  const contentHtml = processed.toString()

  // 3) format date
  const formattedDate = moment(data.date, "DD-MM-YYYY").format("MMM D, YYYY")

  return {
    id,
    title: data.title,
    date: formattedDate,
    contentHtml,
  }
}

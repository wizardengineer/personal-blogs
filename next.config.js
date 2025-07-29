/** @type {import('next').NextConfig} */
// const nextConfig = {}
// next.config.js or next.config.mjs
import withMDX from '@next/mdx'            // MDX loader
import remarkGfm from 'remark-gfm'          
import rehypeHighlight from 'rehype-highlight' 

export default withMDX({
  pageExtensions: ['js','jsx','ts','tsx','md','mdx'],
  extension: /\.mdx?$/,

  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
})

// module.exports = nextConfig

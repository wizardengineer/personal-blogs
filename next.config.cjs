// next.config.cjs
const withMDX = require("@next/mdx")({ extension: /\.mdx?$/ });
const remarkGfm = require("remark-gfm");
const rehypeHighlight = require("rehype-highlight");

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ["js","jsx","ts","tsx","md","mdx"],
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
  output: "export",   // ← static-export mode
});

module.exports = nextConfig;

// next.config.cjs
const withMDX = require("@next/mdx")({ extension: /\.mdx?$/ });
const remarkGfm = require("remark-gfm");
const rehypeHighlight = require("rehype-highlight");

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  output: "export",   // ← static-export mode
  pageExtensions: ["js","jsx","ts","tsx","md","mdx"],
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
});

module.exports = nextConfig;

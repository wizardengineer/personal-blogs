// next.config.js
import withMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ["js","jsx","ts","tsx","md","mdx"],
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
  // ← Tell Next (and the action) “yes, use static export”
  // output: "export",
});

// export default nextConfig;

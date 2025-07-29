// next.config.cjs
const createMDX     = require("@next/mdx");
const remarkGfm     = require("remark-gfm");
const rehypeHighlight = require("rehype-highlight");

let assetPrefix = "";
let basePath   = "";

if (process.env.GITHUB_ACTIONS) {
  const repo = process.env.GITHUB_REPOSITORY.split("/")[1];
  assetPrefix = `/${repo}/`;
  basePath   = `/${repo}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  assetPrefix,
  basePath,
  images: { unoptimized: true },
  pageExtensions: ["js","jsx","ts","tsx","md","mdx"],
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
});

module.exports = withMDX(nextConfig);

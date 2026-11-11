import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  transpilePackages: ['@zoytoy/ui', '@zoytoy/games'],
  // Images are pre-sized at upload (card/large/thumb WebP) and served as-is — no on-demand optimisation,
  // which keeps us inside free-tier compute limits (docs/08 §4).
  images: { unoptimized: true },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: { root: path.resolve(dirname, '../..') },
  async headers() {
    return [
      // fonts never change under the same name — let browsers keep them for a year
      { source: '/fonts/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // the *.vercel.app demo stays out of search results; the shop's own domain is indexed as usual
      { source: '/:path*', has: [{ type: 'host', value: '(?<host>.+)\\.vercel\\.app' }], headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

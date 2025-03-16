import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/json']
    },
    sitemap: 'https://scio.ly/sitemap.xml',
  }
}
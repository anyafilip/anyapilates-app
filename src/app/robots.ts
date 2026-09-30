import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*/admin/',
        '/*/account/',
        '/*/instructor/',
        '/*/buy-credits/pending',
      ],
    },
    sitemap: 'https://anyapilatesstudio.com/sitemap.xml',
  }
}

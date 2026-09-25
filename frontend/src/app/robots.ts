import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/settings', '/scratch/'],
      },
    ],
    sitemap: 'https://jbsnap.app/sitemap.xml',
  };
}

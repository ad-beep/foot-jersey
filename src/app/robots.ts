import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * robots.ts — Explicitly allow major AI crawlers so FootJersey appears in
 * AI-powered search answers (ChatGPT, Gemini, Claude, Perplexity, etc.).
 * Disallow only admin and raw API routes from all bots.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default rule — allow everything except admin/api ───────────────
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // ── AI crawlers — explicitly welcome ──────────────────────────────
      { userAgent: 'GPTBot',         allow: '/' },
      { userAgent: 'ChatGPT-User',   allow: '/' },
      { userAgent: 'CCBot',          allow: '/' },
      { userAgent: 'anthropic-ai',   allow: '/' },
      { userAgent: 'ClaudeBot',      allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'PerplexityBot',  allow: '/' },
      { userAgent: 'Amazonbot',      allow: '/' },
      { userAgent: 'Applebot',       allow: '/' },
      { userAgent: 'YouBot',         allow: '/' },
      { userAgent: 'Meta-ExternalAgent', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

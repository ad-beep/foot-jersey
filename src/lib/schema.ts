/**
 * JSON-LD schema builders for FootJersey.
 * Import these and pass the result to <JsonLd schema={...} /> or inject directly.
 */

const SITE_URL = 'https://shopfootjersey.com';
const SITE_NAME = 'FootJersey';

// ── Organization + LocalBusiness ─────────────────────────────────────────────
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'OnlineStore'],
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        legalName: 'FootJersey',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/favicon.svg`,
          width: 512,
          height: 512,
        },
        image: `${SITE_URL}/favicon.svg`,
        description:
          'FootJersey is Israel\'s leading online store for premium football jerseys. We carry over 18 collections including Premier League, La Liga, Serie A, Bundesliga, Retro Classics, World Cup 2026, and special editions. Fast shipping across Israel, secure PayPal and BIT payments. Free replacement for damaged goods.',
        foundingDate: '2023',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IL',
          addressLocality: 'Israel',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Israel',
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: '+972-58-414-0508',
            contactOption: ['TollFree'],
            availableLanguage: ['Hebrew', 'English'],
            areaServed: 'IL',
          },
        ],
        sameAs: [
          'https://www.instagram.com/foot_jersey4',
          'https://www.tiktok.com/@foot.jerseys4',
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Football Jersey Collections',
          numberOfItems: 18,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: 'Premium football jerseys shipped across Israel. All leagues, retro, World Cup 2026 and special editions.',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: ['en', 'he'],
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/en/discover?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        ],
      },
    ],
  };
}

// ── FAQ Page ─────────────────────────────────────────────────────────────────
export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(items: FaqItem[], pageUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': pageUrl ? `${pageUrl}#faq` : undefined,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface ProductSchemaInput {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  additionalImages?: string[];
  price: number;
  currency?: string;
  sku?: string;
  inStock?: boolean;
  league?: string;
  type?: string;
  season?: string;
  brand?: string;
  reviewCount?: number;
  ratingValue?: number;
  url: string;
}

export function productSchema(p: ProductSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${p.url}#product`,
    name: p.name,
    description: p.description || `Premium ${p.name} football jersey. ${p.league ? `League: ${p.league}.` : ''} ${p.season ? `Season: ${p.season}.` : ''} Ships to Israel.`,
    image: [p.imageUrl, ...(p.additionalImages || [])].filter(Boolean),
    sku: p.sku || p.id,
    brand: {
      '@type': 'Brand',
      name: p.brand || 'FootJersey',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: p.currency || 'ILS',
      price: p.price,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: p.inStock !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: p.url,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          currency: 'ILS',
          value: '15',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IL',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 14,
            maxValue: 21,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        merchantReturnDays: 0,
        applicableCountry: 'IL',
      },
    },
  };

  // Add aggregate rating if we have data
  if (p.reviewCount && p.ratingValue) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.ratingValue,
      reviewCount: p.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`,
    })),
  };
}

// ── Collection / Category ─────────────────────────────────────────────────────
export function collectionSchema(name: string, description: string, url: string, itemCount?: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(itemCount !== undefined && {
      numberOfItems: itemCount,
    }),
  };
}

// ── Review / Testimonial ──────────────────────────────────────────────────────
export interface ReviewInput {
  author: string;
  reviewBody: string;
  ratingValue: number;
  datePublished?: string;
}

export function reviewSchema(
  itemName: string,
  itemUrl: string,
  reviews: ReviewInput[],
  aggregateRating?: { ratingValue: number; reviewCount: number },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemName,
    url: itemUrl.startsWith('http') ? itemUrl : `${SITE_URL}${itemUrl}`,
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.author,
      },
      reviewBody: r.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.ratingValue,
        bestRating: '5',
        worstRating: '1',
      },
      datePublished: r.datePublished || new Date().toISOString().split('T')[0],
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    })),
  };
}

// ── Local Business (for Contact / About pages) ────────────────────────────────
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/#store`,
    name: SITE_NAME,
    description: 'Israel\'s top online football jersey store. All leagues, fast delivery, secure payments.',
    url: SITE_URL,
    telephone: '+972-58-414-0508',
    email: 'support@shopfootjersey.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IL',
      addressLocality: 'Israel',
    },
    currenciesAccepted: 'ILS',
    paymentAccepted: 'PayPal, BIT',
    openingHours: 'Mo-Su',
    priceRange: '₪100-₪125',
    image: `${SITE_URL}/favicon.svg`,
    sameAs: [
      'https://www.instagram.com/foot_jersey4',
      'https://www.tiktok.com/@foot.jerseys4',
    ],
  };
}

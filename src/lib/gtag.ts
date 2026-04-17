export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
  }
};

export const event = (action: string, params: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
};

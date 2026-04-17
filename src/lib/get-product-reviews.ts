import { REVIEWS, type Review } from '@/data/reviews';

/**
 * Returns up to 3 reviews that match the given product's team name.
 * Matching is done by checking if the review's `jersey` field contains
 * any significant word from teamName (case-insensitive).
 */
export function getProductReviews(teamName: string): Review[] {
  if (!teamName) return [];

  // Extract meaningful words (length > 2, skip generic terms)
  const skip = new Set(['the', 'and', 'fc', 'cf', 'sc', 'afc', 'utd', 'united']);
  const words = teamName
    .toLowerCase()
    .split(/[\s\-_]+/)
    .filter((w) => w.length > 2 && !skip.has(w));

  if (words.length === 0) return [];

  return REVIEWS.filter((r) => {
    const haystack = r.jersey.toLowerCase();
    return words.some((w) => haystack.includes(w));
  }).slice(0, 3);
}

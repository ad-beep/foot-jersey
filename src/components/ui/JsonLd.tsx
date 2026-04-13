/**
 * JsonLd — injects a JSON-LD schema script tag into the document head.
 * Usage: <JsonLd schema={faqPageSchema(items)} />
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

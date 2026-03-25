import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center bg-black">
      <h1 className="mb-2 text-6xl font-bold text-white">404</h1>
      <p className="mb-8 text-lg text-gray-400">Page not found</p>
      <Link
        href="/en"
        className="rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
      >
        Go Home
      </Link>
    </div>
  );
}

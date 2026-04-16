import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import AuthClient from './client';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? `כניסה לחשבון | ${SITE_NAME}` : `Sign In | ${SITE_NAME}`,
    robots: { index: false, follow: false },
  };
}

export default function AuthPage() {
  return <AuthClient />;
}

import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import AuthClient from './client';

export const metadata: Metadata = { title: `Sign In | ${SITE_NAME}` };

export default function AuthPage() {
  return <AuthClient />;
}

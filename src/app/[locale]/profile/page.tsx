import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { fetchJerseys } from '@/lib/google-sheets';
import type { Jersey } from '@/types';
import ProfileClient from './client';

export const metadata: Metadata = {
  title: `My Profile | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  let allJerseys: Jersey[] = [];
  try {
    allJerseys = await fetchJerseys();
  } catch {
    allJerseys = [];
  }

  return <ProfileClient allJerseys={allJerseys} />;
}

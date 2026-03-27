import type { Metadata } from 'next';
import ForgotPasswordClient from './client';

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}

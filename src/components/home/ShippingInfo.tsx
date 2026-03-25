'use client';

import { Truck, Package, RotateCcw, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { SHIPPING_POLICY } from '@/lib/constants';
import type { Locale } from '@/types';
import type { Dictionary } from '@/i18n/dictionaries';

interface ShippingInfoProps {
  locale: Locale;
  dict:   Dictionary;
}

const CARDS = [
  {
    icon: Truck,
    key:  'delivery',
  },
  {
    icon: Package,
    key:  'freeShipping',
  },
  {
    icon: RotateCcw,
    key:  'returns',
  },
  {
    icon: ShieldCheck,
    key:  'secure',
  },
] as const;

export function ShippingInfo({ locale, dict: _dict }: ShippingInfoProps) {
  const isHe   = locale === 'he';
  const policy = isHe ? SHIPPING_POLICY.policy.he : SHIPPING_POLICY.policy.en;

  return (
    <section
      className="py-12 md:py-16"
      style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          {CARDS.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              className="flex flex-col items-center text-center gap-3 px-4 py-6 rounded-xl"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(0,195,216,0.1)' }}
              >
                <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-secondary)' }}>
                {policy[key]}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

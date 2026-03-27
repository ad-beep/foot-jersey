'use client';

import { CreditCard, Smartphone, AlertCircle, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export type PaymentMethod = 'bit' | 'paypal' | 'credit-card';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  isHe: boolean;
  isRtl: boolean;
  disabled?: boolean;
}

const methods = [
  {
    id: 'bit' as PaymentMethod,
    labelEn: 'Bit',
    labelHe: 'Bit',
    descEn: 'Israeli P2P payment',
    descHe: 'העברה בנקאית ישראלית',
    icon: Smartphone,
  },
  {
    id: 'paypal' as PaymentMethod,
    labelEn: 'PayPal',
    labelHe: 'PayPal',
    descEn: 'Pay with your PayPal account',
    descHe: 'שלם עם חשבון PayPal שלך',
    icon: Wallet,
  },
  {
    id: 'credit-card' as PaymentMethod,
    labelEn: 'Credit Card',
    labelHe: 'כרטיס אשראי',
    descEn: 'Visa, Mastercard, Amex',
    descHe: 'ויזה, מאסטרקארד, אמקס',
    icon: CreditCard,
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  isHe,
  isRtl,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">
        {isHe ? 'בחר שיטת תשלום' : 'Select Payment Method'}
      </h3>

      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3`}>
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;

          return (
            <motion.button
              key={method.id}
              onClick={() => !disabled && onSelect(method.id)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className="relative p-4 rounded-xl transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSelected
                  ? 'rgba(0,195,216,0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: isSelected
                  ? '2px solid var(--accent)'
                  : '1px solid var(--border)',
              }}
            >
              {/* Background glow effect */}
              {isSelected && (
                <motion.div
                  layoutId="payment-glow"
                  className="absolute inset-0 rounded-xl opacity-20"
                  style={{ backgroundColor: 'var(--cta)' }}
                  initial={false}
                  transition={{ duration: 0.3 }}
                />
              )}

              <div className="relative space-y-2">
                <div className="flex items-start justify-between">
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                  />
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: isSelected ? 'var(--accent)' : 'white' }}
                  >
                    {isHe ? method.labelHe : method.labelEn}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {isHe ? method.descHe : method.descEn}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info box */}
      <div
        className="p-3 rounded-lg flex items-start gap-2"
        style={{ backgroundColor: 'rgba(0,195,216,0.08)' }}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isHe
            ? 'כל שיטות התשלום מאובטחות והנתונים שלך מוגנים'
            : 'All payment methods are secure and encrypted'}
        </p>
      </div>
    </div>
  );
}

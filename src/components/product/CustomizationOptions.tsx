'use client';

import { useLocale } from '@/hooks/useLocale';
import { PRICES, CURRENCY } from '@/lib/constants';
import type { CartCustomization, JerseyType } from '@/types';

interface CustomizationOptionsProps {
  customization: CartCustomization;
  onChange: (c: CartCustomization) => void;
  jerseyType: JerseyType;
  nameNumberOpen: boolean;
  setNameNumberOpen: (v: boolean) => void;
  patchOpen: boolean;
  setPatchOpen: (v: boolean) => void;
  patchError?: boolean;
  nameNumberError?: boolean;
}

export function CustomizationOptions({
  customization,
  onChange,
  jerseyType,
  nameNumberOpen,
  setNameNumberOpen,
  patchOpen,
  setPatchOpen,
  patchError = false,
  nameNumberError = false,
}: CustomizationOptionsProps) {
  const { locale, isRtl } = useLocale();
  const isHe = locale === 'he';
  const isRetro = jerseyType === 'retro';

  // Build visible options based on jersey type
  const options = [
    {
      key: 'nameNumber' as const,
      en: 'Name & Number',
      he: 'שם ומספר',
      price: PRICES.customization.nameAndNumber,
    },
    {
      key: 'patch' as const,
      en: 'Patch',
      he: "פאצ'",
      price: PRICES.customization.patch,
    },
    {
      key: 'pants' as const,
      en: 'Pants',
      he: 'מכנסיים',
      price: PRICES.customization.pants,
    },
    // Player Version — hidden for retro jerseys
    ...(!isRetro
      ? [{
          key: 'playerVersion' as const,
          en: 'Player Version',
          he: 'גרסת שחקן',
          price: PRICES.customization.playerVersion,
        }]
      : []),
  ];

  const isOptionActive = (key: string): boolean => {
    switch (key) {
      case 'nameNumber': return nameNumberOpen;
      case 'patch': return patchOpen;
      case 'pants': return customization.hasPants;
      case 'playerVersion': return customization.isPlayerVersion;
      default: return false;
    }
  };

  const handleToggle = (key: string) => {
    switch (key) {
      case 'nameNumber':
        if (nameNumberOpen) {
          setNameNumberOpen(false);
          onChange({ ...customization, customName: '', customNumber: '' });
        } else {
          setNameNumberOpen(true);
        }
        break;
      case 'patch':
        if (patchOpen) {
          setPatchOpen(false);
          onChange({ ...customization, hasPatch: false, patchText: '' });
        } else {
          setPatchOpen(true);
          onChange({ ...customization, hasPatch: true });
        }
        break;
      case 'pants':
        onChange({ ...customization, hasPants: !customization.hasPants });
        break;
      case 'playerVersion':
        onChange({ ...customization, isPlayerVersion: !customization.isPlayerVersion });
        break;
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border)',
  };

  return (
    <div>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
        {isHe ? 'התאמה אישית' : 'Customize'}
      </p>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {options.map((opt, i) => {
          const active = isOptionActive(opt.key);
          return (
            <div key={opt.key}>
              {/* Row */}
              <button
                onClick={() => handleToggle(opt.key)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]"
                aria-checked={active}
                role="switch"
              >
                <div className="flex items-center gap-3">
                  {/* Toggle switch */}
                  <div
                    className="w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                    style={{ backgroundColor: active ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
                      style={{ [isRtl ? 'right' : 'left']: active ? 18 : 2 }}
                    />
                  </div>
                  <span className="text-sm text-white">{isHe ? opt.he : opt.en}</span>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  +{CURRENCY}{opt.price}
                </span>
              </button>

              {/* Name & Number inputs */}
              {opt.key === 'nameNumber' && nameNumberOpen && (
                <div className="px-4 pb-3 flex gap-2">
                  <input
                    type="text"
                    value={customization.customName}
                    onChange={(e) => onChange({ ...customization, customName: e.target.value.slice(0, 12) })}
                    placeholder={isHe ? 'שם' : 'Name'}
                    maxLength={12}
                    className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
                    style={{
                      ...inputStyle,
                      direction: isRtl ? 'rtl' : 'ltr',
                      borderColor: nameNumberError ? '#f87171' : undefined,
                    }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customization.customNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                      onChange({ ...customization, customNumber: v });
                    }}
                    placeholder="#"
                    maxLength={2}
                    className="w-16 rounded-lg px-3 py-2 text-sm text-white text-center placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
                    style={{
                      ...inputStyle,
                      borderColor: nameNumberError ? '#f87171' : undefined,
                    }}
                  />
                </div>
              )}

              {/* Patch text input */}
              {opt.key === 'patch' && patchOpen && (
                <div className="px-4 pb-3">
                  <input
                    type="text"
                    value={customization.patchText}
                    onChange={(e) => onChange({ ...customization, patchText: e.target.value.slice(0, 30) })}
                    placeholder={isHe ? "איזה פאצ' תרצה?" : 'Which patch would you like?'}
                    maxLength={30}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]"
                    style={{
                      ...inputStyle,
                      direction: isRtl ? 'rtl' : 'ltr',
                      borderColor: patchError ? '#f87171' : undefined,
                    }}
                  />
                </div>
              )}

              {/* Divider */}
              {i < options.length - 1 && (
                <div style={{ borderBottom: '1px solid var(--border)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

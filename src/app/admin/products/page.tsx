'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { PRICES } from '@/lib/constants';
import { Upload, Loader2, CheckCircle, AlertCircle, X, ImagePlus } from 'lucide-react';

// ─── Tag options (user-facing label is "Tag") ──────────
const JERSEY_TAGS = [
  { value: 'regular', label: 'Regular' },
  { value: 'retro', label: 'Retro' },
  { value: 'special', label: 'Special Edition' },
  { value: 'drip', label: 'Drip' },
  { value: 'kids', label: 'Kids' },
  { value: 'world-cup', label: 'World Cup' },
  { value: 'other', label: 'Other Products' },
];

const LEAGUES = [
  { value: 'england', label: 'Premier League' },
  { value: 'spain', label: 'La Liga' },
  { value: 'germany', label: 'Bundesliga' },
  { value: 'italy', label: 'Serie A' },
  { value: 'france', label: 'Ligue 1' },
  { value: 'national_teams', label: 'International' },
  { value: 'rest_of_world', label: 'Rest of the World' },
];

// ─── Auto-category mapping ──────────────────────────────
function deriveCategory(type: string, league: string): string {
  switch (type) {
    case 'retro':     return 'retro';
    case 'special':   return 'special';
    case 'drip':      return 'drip';
    case 'kids':      return 'kids';
    case 'world-cup': return 'world-cup';
    case 'other':     return 'accessories';
    default:          return league; // regular → league slug as category
  }
}

// Map form tag to the sheet/system type value
function sheetType(type: string): string {
  if (type === 'world-cup') return 'world_cup';
  if (type === 'other') return 'other_products';
  return type;
}

// Auto-price from tag
function getAutoPrice(type: string, isLongSleeve: boolean): number {
  const priceMap: Record<string, number> = {
    regular: PRICES.regular,
    retro: PRICES.retro,
    special: PRICES.special,
    drip: PRICES.drip,
    kids: PRICES.kids,
    'world-cup': PRICES.world_cup,
    other: PRICES.other_products,
  };
  return (priceMap[type] ?? PRICES.regular) + (isLongSleeve ? PRICES.longSleeveExtra : 0);
}

type Status = 'idle' | 'uploading' | 'saving' | 'success' | 'error';

export default function AddProductPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [nameHe, setNameHe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [league, setLeague] = useState('england');
  const [season, setSeason] = useState('24/25');
  const [type, setType] = useState('regular');
  const [isLongSleeve, setIsLongSleeve] = useState(false);
  const [availableSizes, setAvailableSizes] = useState('S,M,L,XL,XXL');

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Derived values
  const autoCategory = deriveCategory(type, league);
  const computedPrice = getAutoPrice(type, isLongSleeve);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!nameHe.trim()) {
      setErrorMsg('Hebrew name is required');
      return;
    }
    if (imageFiles.length === 0) {
      setErrorMsg('At least one image is required');
      return;
    }

    try {
      // 1. Upload images to Firebase Storage
      setStatus('uploading');
      const slug = nameHe.toLowerCase().replace(/\s+/g, '-');
      const id = `${slug}-${season.replace('/', '-')}-${Date.now()}`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const storageRef = ref(storage, `jerseys/${id}/${i === 0 ? 'main' : `extra-${i}`}.${ext}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }

      const mainImage = uploadedUrls[0];
      const additionalImages = uploadedUrls.slice(1).join('|');

      // 2. Build tags automatically
      const autoTags: string[] = [];
      if (isLongSleeve) autoTags.push('ארוך');
      if (type === 'world-cup') autoTags.push('מונדיאל');
      if (type === 'other') autoTags.push('Other');

      // 3. Write to Google Sheets via API route
      setStatus('saving');
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          team_name: nameHe.trim(),
          team_name_en: nameEn.trim(),
          league,
          season,
          type: sheetType(type),
          category: autoCategory,
          image_url: mainImage,
          additional_images: additionalImages,
          is_world_cup: type === 'world-cup' ? 'true' : 'false',
          international_team: '',
          available_sizes: availableSizes,
          tags: autoTags.join('|'),
          is_long_sleeve: isLongSleeve ? 'true' : 'false',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      setStatus('success');
      setTimeout(() => {
        setNameHe('');
        setNameEn('');
        setSeason('24/25');
        setType('regular');
        setLeague('england');
        setIsLongSleeve(false);
        setAvailableSizes('S,M,L,XL,XXL');
        setImageFiles([]);
        setPreviews([]);
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  const busy = status === 'uploading' || status === 'saving';

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Add Product</h1>
      <p className="text-sm text-gray-400 mb-8">Upload a new jersey to the catalogue</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name (Hebrew) + Name (English) side-by-side */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name (Hebrew)" required>
            <input
              type="text"
              value={nameHe}
              onChange={(e) => setNameHe(e.target.value)}
              placeholder="e.g. ברצלונה חולצת בית"
              className="admin-input"
            />
          </Field>
          <Field label="Name (English)">
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Barcelona Home Kit"
              className="admin-input"
            />
          </Field>
        </div>

        {/* Tag + League row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tag">
            <select value={type} onChange={(e) => setType(e.target.value)} className="admin-select">
              {JERSEY_TAGS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="League">
            <select value={league} onChange={(e) => setLeague(e.target.value)} className="admin-select">
              {LEAGUES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Season + Sizes row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Season">
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="24/25"
              className="admin-input"
            />
          </Field>
          <Field label="Available Sizes" hint="Comma-separated">
            <input
              type="text"
              value={availableSizes}
              onChange={(e) => setAvailableSizes(e.target.value)}
              placeholder="S,M,L,XL,XXL"
              className="admin-input"
            />
          </Field>
        </div>

        {/* Long Sleeve checkbox */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isLongSleeve}
            onChange={(e) => setIsLongSleeve(e.target.checked)}
            className="accent-cyan-500"
          />
          Long Sleeve (+₪{PRICES.longSleeveExtra})
        </label>

        {/* Auto-derived info strip */}
        <div className="flex items-center gap-5 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div>
            <span className="text-xs text-gray-500 block">Auto-price</span>
            <span className="text-lg font-bold text-cyan-400">₪{computedPrice}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-xs text-gray-500 block">Category</span>
            <span className="text-sm font-medium text-white">{autoCategory}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-xs text-gray-500 block">Tags</span>
            <span className="text-sm text-gray-300">
              {[
                isLongSleeve && 'ארוך',
                type === 'world-cup' && 'מונדיאל',
                type === 'other' && 'Other',
              ].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Images <span className="text-red-400">*</span>
            <span className="text-xs text-gray-500 ml-2">First image = main photo</span>
          </label>

          <div className="grid grid-cols-4 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-cyan-500 text-[10px] font-bold px-1.5 py-0.5 rounded text-black">
                    MAIN
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/40 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px]">Add</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-lg bg-red-500/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 text-sm p-3 rounded-lg bg-green-500/10">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Product added successfully!
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {status === 'uploading' ? 'Uploading images…' : 'Saving to catalogue…'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Add to Catalogue
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─── Reusable field wrapper ─────────────────────────────── */
function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-xs text-gray-500 ml-2">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

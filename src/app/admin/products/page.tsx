'use client';

import { useState, useRef, useMemo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { PRICES, CURRENT_SEASON } from '@/lib/constants';
import { Upload, Loader2, CheckCircle, AlertCircle, X, ImagePlus } from 'lucide-react';

// ─── Tag options (user-facing label is "Tag") ──────────
const JERSEY_TAGS = [
  { value: 'regular', label: 'Regular' },
  { value: 'retro', label: 'Retro' },
  { value: 'special', label: 'Special Edition' },
  { value: 'stussy', label: 'Stussy Edition' },
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

const LEAGUE_LABELS: Record<string, string> = {
  england: 'Premier League',
  spain: 'La Liga',
  germany: 'Bundesliga',
  italy: 'Serie A',
  france: 'Ligue 1',
  national_teams: 'International',
  rest_of_world: 'Rest of the World',
};

// ─── Auto-category / collections logic ───────────────────

/** Resolve which league page this product belongs to */
function deriveLeaguePage(tag: string, league: string): string {
  // World Cup always goes to International
  if (tag === 'world-cup') return 'national_teams';
  return league;
}

/** Resolve primary category for the sheet */
function deriveCategory(tag: string, league: string): string {
  switch (tag) {
    case 'retro':     return 'retro';
    case 'special':   return 'special';
    case 'stussy':    return 'special';
    case 'drip':      return 'drip';
    case 'kids':      return 'kids';
    case 'world-cup': return 'world-cup';
    case 'other':     return 'accessories';
    default:          return league;
  }
}

/** Is the season "current" (25/26)? */
function isCurrentSeason(season: string): boolean {
  return season.includes('25/26') || season.includes('2025') || season.includes('2026');
}

/** Derive all collection slugs this product will appear in */
function deriveCollections(tag: string, season: string, isLongSleeve: boolean): string[] {
  const collections: string[] = [];

  switch (tag) {
    case 'regular':
      if (isCurrentSeason(season)) collections.push('25/26 Season');
      break;
    case 'retro':
      collections.push('Retro');
      break;
    case 'special':
      collections.push('Special Edition');
      break;
    case 'stussy':
      collections.push('Special Edition');
      collections.push('Stussy Edition');
      break;
    case 'drip':
      collections.push('Drip');
      break;
    case 'kids':
      collections.push('Kids');
      break;
    case 'world-cup':
      collections.push('World Cup');
      break;
    case 'other':
      collections.push('Other Products');
      break;
  }

  if (isLongSleeve) {
    collections.push('Long Sleeve');
  }

  return collections;
}

// ─── Sheet type mapping ──────────────────────────────────
function sheetType(tag: string): string {
  if (tag === 'world-cup') return 'world_cup';
  if (tag === 'other') return 'other_products';
  if (tag === 'stussy') return 'special'; // stussy is a special edition type
  return tag;
}

// ─── Auto-price ──────────────────────────────────────────
function getAutoPrice(tag: string, isLongSleeve: boolean): number {
  const priceMap: Record<string, number> = {
    regular: PRICES.regular,
    retro: PRICES.retro,
    special: PRICES.special,
    stussy: PRICES.special,
    drip: PRICES.drip,
    kids: PRICES.kids,
    'world-cup': PRICES.world_cup,
    other: PRICES.other_products,
  };
  return (priceMap[tag] ?? PRICES.regular) + (isLongSleeve ? PRICES.longSleeveExtra : 0);
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
  const [tag, setTag] = useState('regular');
  const [isLongSleeve, setIsLongSleeve] = useState(false);
  const [availableSizes, setAvailableSizes] = useState('S,M,L,XL,XXL');

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Derived values
  const effectiveLeague = deriveLeaguePage(tag, league);
  const autoCategory = deriveCategory(tag, league);
  const computedPrice = getAutoPrice(tag, isLongSleeve);
  const collections = useMemo(
    () => deriveCollections(tag, season, isLongSleeve),
    [tag, season, isLongSleeve]
  );
  const tagLabel = JERSEY_TAGS.find((t) => t.value === tag)?.label ?? tag;

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
      setStatus('uploading');
      // Use English name for slug if available, otherwise generate a safe ASCII id
      const rawSlug = nameEn.trim()
        ? nameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : `jersey-${league}`;
      const id = `${rawSlug}-${season.replace('/', '-')}-${Date.now()}`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = i === 0 ? 'main' : `extra-${i}`;
        const storagePath = `jerseys/${id}/${fileName}.${ext}`;
        try {
          const storageRef = ref(storage, storagePath);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          uploadedUrls.push(url);
        } catch (uploadErr) {
          console.error(`Failed to upload image ${i}:`, uploadErr);
          throw new Error(`Image upload failed (${fileName}.${ext}). Check Firebase Storage permissions.`);
        }
      }

      const mainImage = uploadedUrls[0];
      const extraImages = uploadedUrls.slice(1);

      // Build tags automatically (pipe-separated)
      const autoTags: string[] = [];
      if (isLongSleeve) autoTags.push('ארוך');
      if (tag === 'world-cup') autoTags.push('מונדיאל');
      if (tag === 'stussy') autoTags.push('stussy');
      // Pack additional image URLs into tags so they survive the 10-column schema
      if (extraImages.length > 0) autoTags.push(`images:${extraImages.join(',')}`);
      if (isLongSleeve) autoTags.push('long_sleeve');
      if (tag === 'world-cup') autoTags.push('world_cup');
      if (nameEn.trim()) autoTags.push(`en:${nameEn.trim()}`);

      setStatus('saving');
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: nameHe.trim(),
          league: effectiveLeague,
          season,
          type: sheetType(tag),
          image_url: mainImage,
          available_sizes: availableSizes,
          tags: autoTags.join('|'),
          price: computedPrice,
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
        setTag('regular');
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
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Add Product</h1>
      <p className="text-sm text-gray-400 mb-8">Upload a new jersey to the catalogue</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* ─── Left: Form ─── */}
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
              <select value={tag} onChange={(e) => setTag(e.target.value)} className="admin-select">
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
                placeholder="25/26"
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

          {/* ─── Enhanced Info Strip ─── */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex items-center gap-5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 block">Price</span>
                <span className="text-lg font-bold text-cyan-400">₪{computedPrice}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 block">League Page</span>
                <span className="text-sm font-medium text-white">
                  {LEAGUE_LABELS[effectiveLeague] || effectiveLeague}
                </span>
              </div>
            </div>

            {collections.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Collections</span>
                <div className="flex flex-wrap gap-1.5">
                  {collections.map((col) => (
                    <span
                      key={col}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

        {/* ─── Right: Live Card Preview ─── */}
        <div className="lg:sticky lg:top-8 self-start">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-2">Card Preview</span>
          <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden w-full max-w-[260px]">
            {/* Image */}
            <div className="aspect-[3/4] bg-[#1a1a1a] relative overflow-hidden">
              {previews[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <ImagePlus className="w-8 h-8" />
                </div>
              )}
              {/* Type badge */}
              {tag !== 'regular' && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/90 text-black">
                  {tagLabel}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-semibold text-white truncate">
                {nameHe || 'Product Name'}
              </p>
              {nameEn && (
                <p className="text-xs text-gray-500 truncate">{nameEn}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {season} · {tagLabel}
                </span>
                <span className="text-sm font-bold text-cyan-400">₪{computedPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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

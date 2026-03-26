'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { PRICES } from '@/lib/constants';
import { Upload, Loader2, CheckCircle, AlertCircle, X, ImagePlus } from 'lucide-react';

const JERSEY_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'retro', label: 'Retro' },
  { value: 'kids', label: 'Kids' },
  { value: 'special', label: 'Special Edition' },
  { value: 'coat', label: 'Coat / Jacket' },
  { value: 'drip', label: 'Drip' },
  { value: 'scarf', label: 'Scarf' },
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

const CATEGORIES = [
  'home', 'away', 'third', 'goalkeeper', 'training', 'special', 'retro',
];

type Status = 'idle' | 'uploading' | 'saving' | 'success' | 'error';

export default function AddProductPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [teamName, setTeamName] = useState('');
  const [league, setLeague] = useState('england');
  const [season, setSeason] = useState('24/25');
  const [type, setType] = useState('regular');
  const [category, setCategory] = useState('home');
  const [isLongSleeve, setIsLongSleeve] = useState(false);
  const [isWorldCup, setIsWorldCup] = useState(false);
  const [internationalTeam, setInternationalTeam] = useState('');
  const [tags, setTags] = useState('');
  const [availableSizes, setAvailableSizes] = useState('S,M,L,XL,XXL');

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Computed price
  const basePrice = PRICES[type as keyof typeof PRICES];
  const computedPrice = typeof basePrice === 'number'
    ? basePrice + (isLongSleeve ? PRICES.longSleeveExtra : 0)
    : PRICES.regular + (isLongSleeve ? PRICES.longSleeveExtra : 0);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });
    // Reset input so same file can be re-selected
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

    if (!teamName.trim()) {
      setErrorMsg('Team name is required');
      return;
    }
    if (imageFiles.length === 0) {
      setErrorMsg('At least one image is required');
      return;
    }

    try {
      // 1. Upload images to Firebase Storage
      setStatus('uploading');
      const id = `${teamName.toLowerCase().replace(/\s+/g, '-')}-${season.replace('/', '-')}-${Date.now()}`;
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

      // 2. Write to Google Sheets via API route
      setStatus('saving');
      const tagList = [
        tags,
        isLongSleeve ? 'ארוך' : '',
        isWorldCup ? 'מונדיאל' : '',
      ].filter(Boolean).join('|');

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          team_name: teamName.trim(),
          league,
          season,
          type,
          category,
          image_url: mainImage,
          additional_images: additionalImages,
          is_world_cup: isWorldCup ? 'true' : 'false',
          international_team: internationalTeam.trim(),
          available_sizes: availableSizes,
          tags: tagList,
          is_long_sleeve: isLongSleeve ? 'true' : 'false',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      setStatus('success');
      // Reset form after 2s
      setTimeout(() => {
        setTeamName('');
        setSeason('24/25');
        setType('regular');
        setCategory('home');
        setLeague('england');
        setIsLongSleeve(false);
        setIsWorldCup(false);
        setInternationalTeam('');
        setTags('');
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
        {/* Team Name */}
        <Field label="Team / Product Name" required>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. ברצלונה חולצת בית"
            className="input"
          />
        </Field>

        {/* Type + League row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              {JERSEY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="League">
            <select value={league} onChange={(e) => setLeague(e.target.value)} className="input">
              {LEAGUES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Season + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Season">
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="24/25"
              className="input"
            />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Checkboxes row */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isLongSleeve}
              onChange={(e) => setIsLongSleeve(e.target.checked)}
              className="accent-cyan-500"
            />
            Long Sleeve (+₪{PRICES.longSleeveExtra})
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isWorldCup}
              onChange={(e) => setIsWorldCup(e.target.checked)}
              className="accent-cyan-500"
            />
            World Cup
          </label>
        </div>

        {/* International Team (conditional) */}
        {isWorldCup && (
          <Field label="International Team">
            <input
              type="text"
              value={internationalTeam}
              onChange={(e) => setInternationalTeam(e.target.value)}
              placeholder="e.g. Brazil"
              className="input"
            />
          </Field>
        )}

        {/* Tags */}
        <Field label="Tags" hint="Pipe-separated (e.g. מונדיאל|רטרו)">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1|tag2"
            className="input"
          />
        </Field>

        {/* Available Sizes */}
        <Field label="Available Sizes" hint="Comma-separated">
          <input
            type="text"
            value={availableSizes}
            onChange={(e) => setAvailableSizes(e.target.value)}
            placeholder="S,M,L,XL,XXL"
            className="input"
          />
        </Field>

        {/* Auto-priced display */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-sm text-gray-400">Auto-price:</span>
          <span className="text-lg font-bold text-cyan-400">₪{computedPrice}</span>
          <span className="text-xs text-gray-500">
            ({type}{isLongSleeve ? ' + long sleeve' : ''})
          </span>
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

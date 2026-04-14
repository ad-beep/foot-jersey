'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User as UserIcon, LogOut, Trash2, ChevronDown, ChevronUp, MapPin, Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth-store';
import type { ShippingAddress } from '@/stores/auth-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/ui/reveal';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import type { Jersey, Size, KidsSize } from '@/types';

// ─── Labels ──────────────────────────────────────────────────────
const L = {
  myProfile:      { en: 'My Profile',          he: 'הפרופיל שלי' },
  memberSince:    { en: 'Member since',         he: 'חבר מאז' },
  profile:        { en: 'Profile',              he: 'פרופיל' },
  orders:         { en: 'Orders',               he: 'הזמנות' },
  addresses:      { en: 'Addresses',            he: 'כתובות' },
  settings:       { en: 'Settings',             he: 'הגדרות' },
  sizeVault:      { en: 'My Size Vault',        he: 'המידות שלי' },
  sizeVaultSub:   { en: 'Save your preferred sizes for faster checkout', he: 'שמור את המידות המועדפות שלך' },
  adultSize:      { en: 'Adult Size',           he: 'מידת מבוגר' },
  kidsSize:       { en: 'Kids Size',            he: 'מידת ילדים' },
  save:           { en: 'Save',                 he: 'שמור' },
  saved:          { en: 'Saved!',               he: 'נשמר!' },
  likedJerseys:   { en: 'Liked Jerseys',        he: 'חולצות שאהבתי' },
  viewAll:        { en: 'View All',             he: 'צפה בהכל' },
  noLikes:        { en: "You haven't liked any jerseys yet. Start exploring!", he: 'עדיין לא אהבת חולצות. התחל לגלות!' },
  recommended:    { en: 'Recommended For You',  he: 'מומלץ עבורך' },
  orderHistory:   { en: 'Order History',        he: 'היסטוריית הזמנות' },
  noOrders:       { en: 'No orders yet. Start shopping!', he: 'אין הזמנות עדיין. התחל לקנות!' },
  savedAddresses: { en: 'Saved Addresses',      he: 'כתובות שמורות' },
  addAddress:     { en: 'Add New Address',      he: 'הוסף כתובת חדשה' },
  noAddresses:    { en: 'No saved addresses yet.', he: 'אין כתובות שמורות עדיין.' },
  prefLanguage:   { en: 'Preferred Language',   he: 'שפה מועדפת' },
  newsletter:     { en: 'Newsletter',           he: 'ניוזלטר' },
  newsletterSub:  { en: 'Receive updates on new jerseys and deals', he: 'קבל עדכונים על חולצות חדשות ומבצעים' },
  signOut:        { en: 'Sign Out',             he: 'התנתק' },
  deleteAccount:  { en: 'Delete Account',       he: 'מחק חשבון' },
  deleteSub:      { en: 'Contact support to delete your account', he: 'צור קשר עם התמיכה למחיקת החשבון' },
  signInPrompt:   { en: 'Sign in to access your profile', he: 'התחבר כדי לגשת לפרופיל שלך' },
  signIn:         { en: 'Sign In',              he: 'התחבר' },
  signedOut:      { en: 'Signed out successfully', he: 'התנתקת בהצלחה' },
  items:          { en: 'items',                he: 'פריטים' },
  explore:        { en: 'Explore',              he: 'גלה' },
  home:           { en: 'Home',                 he: 'בית' },
  default:        { en: 'Default',              he: 'ברירת מחדל' },
  fullName:       { en: 'Full Name',            he: 'שם מלא' },
  street:         { en: 'Street',               he: 'רחוב' },
  city:           { en: 'City',                 he: 'עיר' },
  zipCode:        { en: 'Zip Code',             he: 'מיקוד' },
  country:        { en: 'Country',              he: 'מדינה' },
  phone:          { en: 'Phone',                he: 'טלפון' },
  cancel:         { en: 'Cancel',               he: 'ביטול' },
  edit:           { en: 'Edit',                 he: 'ערוך' },
  delete:         { en: 'Delete',               he: 'מחק' },
  setDefault:     { en: 'Set as Default',       he: 'הגדר כברירת מחדל' },
  processing:     { en: 'Processing',           he: 'בעיבוד' },
  shipped:        { en: 'Shipped',              he: 'נשלח' },
  delivered:      { en: 'Delivered',            he: 'הגיע' },
  pending:        { en: 'Pending',              he: 'ממתין' },
  cancelled:      { en: 'Cancelled',            he: 'בוטל' },
} as const;

type TabKey = 'profile' | 'orders' | 'addresses' | 'settings';

const TABS: { key: TabKey; label: { en: string; he: string } }[] = [
  { key: 'profile',   label: L.profile },
  { key: 'orders',    label: L.orders },
  { key: 'addresses', label: L.addresses },
  { key: 'settings',  label: L.settings },
];

const ADULT_SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL'];
const KIDS_SIZES: KidsSize[] = ['16', '18', '20', '22', '24', '26', '28'];

interface ProfileClientProps {
  allJerseys: Jersey[];
}

// ─── Main Component ──────────────────────────────────────────────
export default function ProfileClient({ allJerseys }: ProfileClientProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const hydrated = useHydration();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const isHe = locale === 'he';

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const breadcrumbs = [
    { label: isHe ? L.home.he : L.home.en, href: `/${locale}` },
    { label: isHe ? L.myProfile.he : L.myProfile.en },
  ];

  if (!hydrated) return null;

  // Not signed in — show prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <UserIcon className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-lg font-semibold text-white mb-2">
            {isHe ? L.signInPrompt.he : L.signInPrompt.en}
          </p>
          <Link href={`/${locale}/auth`}>
            <Button variant="primary" size="lg">
              {isHe ? L.signIn.he : L.signIn.en}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    if (!confirm(isHe ? 'בטוח שברצונך להתנתק?' : 'Are you sure you want to sign out?')) return;
    try {
      await signOut();
      toast({ title: isHe ? L.signedOut.he : L.signedOut.en, variant: 'success' });
      router.push(`/${locale}`);
    } catch {
      toast({ title: isHe ? 'שגיאה' : 'Error', variant: 'error' });
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* ── User Header ────────────────────────────────────────── */}
        <Reveal>
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '2px solid var(--border)' }}
          >
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--text-muted)' }} />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">
              {user.displayName || (isHe ? 'משתמש' : 'User')}
            </h1>
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isHe ? L.memberSince.he : L.memberSince.en} 2024
            </p>
          </div>
        </div>
        </Reveal>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="overflow-x-auto pb-2 mb-6 -mx-4 px-4 md:mx-0 md:px-0" role="tablist" aria-label="Profile sections">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                  activeTab === tab.key
                    ? 'bg-white/10 text-white'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5',
                )}
              >
                {isHe ? tab.label.he : tab.label.en}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ────────────────────────────────────────── */}
        <div role="tabpanel">
          {activeTab === 'profile' && <ProfileTab allJerseys={allJerseys} />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'settings' && <SettingsTab onSignOut={handleSignOut} />}
        </div>
      </div>
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────
function Section({ title, subtitle, children, trailing }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5 md:p-6 mb-6"
      style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 1: PROFILE
// ═════════════════════════════════════════════════════════════════
function ProfileTab({ allJerseys }: { allJerseys: Jersey[] }) {
  return (
    <>
      <SizeVault />
      <LikedJerseys allJerseys={allJerseys} />
      {/* TODO: Recently Viewed — add when view tracking is implemented */}
      <RecommendedSection allJerseys={allJerseys} />
    </>
  );
}

// ─── Size Vault ──────────────────────────────────────────────────
function SizeVault() {
  const { locale } = useLocale();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const setSavedSize = useAuthStore((s) => s.setSavedSize);
  const setSavedKidsSize = useAuthStore((s) => s.setSavedKidsSize);
  const isHe = locale === 'he';

  const [adultSize, setAdultSize] = useState<Size | null>(user?.savedSize ?? null);
  const [kidsSize, setKidsSize] = useState<KidsSize | null>(user?.savedKidsSize ?? null);

  const handleSave = () => {
    if (adultSize) setSavedSize(adultSize);
    if (kidsSize) setSavedKidsSize(kidsSize);
    toast({ title: isHe ? L.saved.he : L.saved.en, variant: 'success' });
  };

  return (
    <Section title={isHe ? L.sizeVault.he : L.sizeVault.en} subtitle={isHe ? L.sizeVaultSub.he : L.sizeVaultSub.en}>
      {/* Adult sizes */}
      <div className="mb-4">
        <p className="text-sm font-medium text-white mb-2">{isHe ? L.adultSize.he : L.adultSize.en}</p>
        <div className="flex flex-wrap gap-2">
          {ADULT_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setAdultSize(s)}
              className={cn(
                'h-9 px-4 rounded-full text-sm font-medium transition-all duration-200',
                adultSize === s
                  ? 'bg-[var(--gold)] text-black'
                  : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Kids sizes */}
      <div className="mb-4">
        <p className="text-sm font-medium text-white mb-2">{isHe ? L.kidsSize.he : L.kidsSize.en}</p>
        <div className="flex flex-wrap gap-2">
          {KIDS_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setKidsSize(s)}
              className={cn(
                'h-9 px-4 rounded-full text-sm font-medium transition-all duration-200',
                kidsSize === s
                  ? 'bg-[var(--gold)] text-black'
                  : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary" size="sm" onClick={handleSave}>
        {isHe ? L.save.he : L.save.en}
      </Button>
    </Section>
  );
}

// ─── Liked Jerseys ───────────────────────────────────────────────
function LikedJerseys({ allJerseys }: { allJerseys: Jersey[] }) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);

  const likedJerseys = useMemo(
    () => allJerseys.filter((j) => favoriteIds.includes(j.id)),
    [allJerseys, favoriteIds],
  );

  return (
    <Section
      title={isHe ? L.likedJerseys.he : L.likedJerseys.en}
      trailing={
        likedJerseys.length > 0 ? (
          <div className="flex items-center gap-2">
            <Badge variant="accent">{likedJerseys.length}</Badge>
            <Link
              href={`/${locale}/favorites`}
              className="text-sm font-medium transition-colors hover:underline"
              style={{ color: 'var(--gold)' }}
            >
              {isHe ? L.viewAll.he : L.viewAll.en} &rarr;
            </Link>
          </div>
        ) : undefined
      }
    >
      {likedJerseys.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            {isHe ? L.noLikes.he : L.noLikes.en}
          </p>
          <Link href={`/${locale}/discover`}>
            <Button variant="secondary" size="sm">{isHe ? L.explore.he : L.explore.en}</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5 pb-2">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {likedJerseys.slice(0, 4).map((j) => (
              <div key={j.id} className="w-[180px] shrink-0">
                <ProductCard jersey={j} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Recommended For You ─────────────────────────────────────────
function RecommendedSection({ allJerseys }: { allJerseys: Jersey[] }) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const getRecommendedIds = useAnalyticsStore((s) => s.getRecommendedIds);

  const recommended = useMemo(() => {
    if (allJerseys.length === 0) return [];
    const ids = getRecommendedIds(allJerseys.map((j) => j.id), 8);
    const byId = new Map(allJerseys.map((j) => [j.id, j]));
    const result = ids.map((id) => byId.get(id)).filter(Boolean) as Jersey[];
    // If analytics has no data yet, fall back to first 8
    return result.length > 0 ? result : allJerseys.slice(0, 8);
  }, [allJerseys, getRecommendedIds]);

  if (recommended.length === 0) return null;

  return (
    <Section title={isHe ? L.recommended.he : L.recommended.en}>
      <div className="overflow-x-auto -mx-5 px-5 pb-2">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {recommended.map((j) => (
            <div key={j.id} className="w-[180px] shrink-0">
              <ProductCard jersey={j} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 2: ORDERS
// ═════════════════════════════════════════════════════════════════
function OrdersTab() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const orders = useAuthStore((s) => s.user?.orderHistory ?? []);

  const statusBadge = (status: string) => {
    const variant = status === 'delivered' ? 'success' : status === 'cancelled' ? 'error' : status === 'shipped' ? 'accent' : 'default';
    const label = L[status as keyof typeof L] as { en: string; he: string } | undefined;
    return <Badge variant={variant}>{label ? (isHe ? label.he : label.en) : status}</Badge>;
  };

  if (orders.length === 0) {
    return (
      <Section title={isHe ? L.orderHistory.he : L.orderHistory.en}>
        <div className="text-center py-8">
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            {isHe ? L.noOrders.he : L.noOrders.en}
          </p>
          <Link href={`/${locale}/discover`}>
            <Button variant="secondary" size="sm">{isHe ? L.explore.he : L.explore.en}</Button>
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <Section title={isHe ? L.orderHistory.he : L.orderHistory.en}>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </Section>
  );
}

function OrderCard({ order }: { order: { id: string; items: { jerseyId: string; jersey: Jersey; size: string; quantity: number; totalPrice: number }[]; total: number; createdAt: number; status: string } }) {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [expanded, setExpanded] = useState(false);

  const statusVariant = order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : order.status === 'shipped' ? 'accent' : 'default';
  const statusLabel = L[order.status as keyof typeof L] as { en: string; he: string } | undefined;

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-start min-w-0">
            <p className="text-sm font-semibold text-white">
              #{order.id.slice(-6)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(order.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}
              {' · '}{order.items.length} {isHe ? L.items.he : L.items.en}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusVariant}>{statusLabel ? (isHe ? statusLabel.he : statusLabel.en) : order.status}</Badge>
          <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>₪{order.total}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-white">{item.jersey.teamName}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {item.size} &times; {item.quantity} · ₪{item.totalPrice}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 3: ADDRESSES
// ═════════════════════════════════════════════════════════════════
function AddressesTab() {
  const { locale } = useLocale();
  const { toast } = useToast();
  const isHe = locale === 'he';
  const addresses = useAuthStore((s) => s.user?.shippingAddresses ?? []);
  const addAddress = useAuthStore((s) => s.addShippingAddress);
  const removeAddress = useAuthStore((s) => s.removeShippingAddress);
  const updateAddress = useAuthStore((s) => s.updateShippingAddress);
  const setDefault = useAuthStore((s) => s.setDefaultAddress);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = (data: Omit<ShippingAddress, 'id'>) => {
    if (editingId) {
      updateAddress(editingId, data);
      setEditingId(null);
      toast({ title: isHe ? 'הכתובת עודכנה' : 'Address updated', variant: 'success' });
    } else {
      addAddress(data);
      toast({ title: isHe ? 'הכתובת נוספה' : 'Address added', variant: 'success' });
    }
    setShowForm(false);
  };

  const handleEdit = (addr: ShippingAddress) => {
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm(isHe ? 'בטוח שברצונך למחוק כתובת זו?' : 'Delete this address?')) return;
    removeAddress(id);
    toast({ title: isHe ? 'הכתובת נמחקה' : 'Address deleted', variant: 'info' });
  };

  const editingAddress = editingId ? addresses.find((a) => a.id === editingId) : undefined;

  return (
    <Section
      title={isHe ? L.savedAddresses.he : L.savedAddresses.en}
      trailing={
        !showForm ? (
          <Button variant="secondary" size="sm" onClick={() => { setEditingId(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 me-1" />
            {isHe ? L.addAddress.he : L.addAddress.en}
          </Button>
        ) : undefined
      }
    >
      {showForm && (
        <AddressForm
          initial={editingAddress}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      {!showForm && addresses.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          {isHe ? L.noAddresses.he : L.noAddresses.en}
        </p>
      )}

      {!showForm && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-lg p-4 flex items-start gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
            >
              <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">{addr.fullName}</p>
                  {addr.isDefault && <Badge variant="accent">{isHe ? L.default.he : L.default.en}</Badge>}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {addr.street}, {addr.city} {addr.zipCode}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{addr.phone}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(addr)} className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                    <Pencil className="w-3 h-3" /> {isHe ? L.edit.he : L.edit.en}
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-[var(--error)]" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 className="w-3 h-3" /> {isHe ? L.delete.he : L.delete.en}
                  </button>
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr.id)} className="text-xs font-medium transition-colors hover:text-[var(--gold)]" style={{ color: 'var(--text-muted)' }}>
                      {isHe ? L.setDefault.he : L.setDefault.en}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ─── Address Form ────────────────────────────────────────────────
function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ShippingAddress;
  onSave: (data: Omit<ShippingAddress, 'id'>) => void;
  onCancel: () => void;
}) {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [street, setStreet] = useState(initial?.street ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [zipCode, setZipCode] = useState(initial?.zipCode ?? '');
  const [country, setCountry] = useState(initial?.country ?? (isHe ? 'ישראל' : 'Israel'));
  const [phone, setPhone] = useState(initial?.phone ?? '');

  const inputClass = 'w-full bg-white/5 border border-[var(--border)] rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors duration-200 focus:border-[var(--gold)] placeholder:text-[var(--text-muted)]';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, street, city, zipCode, country, phone, isDefault: initial?.isDefault ?? false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{isHe ? L.fullName.he : L.fullName.en}</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required dir={isHe ? 'rtl' : 'ltr'} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{isHe ? L.phone.he : L.phone.en}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required dir="ltr" type="tel" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{isHe ? L.street.he : L.street.en}</label>
        <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} required dir={isHe ? 'rtl' : 'ltr'} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{isHe ? L.city.he : L.city.en}</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required dir={isHe ? 'rtl' : 'ltr'} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{isHe ? L.zipCode.he : L.zipCode.en}</label>
          <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputClass} dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{isHe ? L.country.he : L.country.en}</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} required dir={isHe ? 'rtl' : 'ltr'} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm">{isHe ? L.save.he : L.save.en}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>{isHe ? L.cancel.he : L.cancel.en}</Button>
      </div>
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════
// TAB 4: SETTINGS
// ═════════════════════════════════════════════════════════════════
function SettingsTab({ onSignOut }: { onSignOut: () => void }) {
  const { locale, switchLocale } = useLocale();
  const isHe = locale === 'he';
  const newsletter = useAuthStore((s) => s.user?.newsletter ?? false);
  const setNewsletter = useAuthStore((s) => s.setNewsletter);

  return (
    <Section title={isHe ? L.settings.he : L.settings.en}>
      <div className="space-y-5">
        {/* Language */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{isHe ? L.prefLanguage.he : L.prefLanguage.en}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => switchLocale('en')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                locale === 'en' ? 'bg-[var(--gold)] text-black' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10',
              )}
            >
              English
            </button>
            <button
              onClick={() => switchLocale('he')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                locale === 'he' ? 'bg-[var(--gold)] text-black' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10',
              )}
            >
              עברית
            </button>
          </div>
        </div>

        {/* Newsletter */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{isHe ? L.newsletter.he : L.newsletter.en}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isHe ? L.newsletterSub.he : L.newsletterSub.en}</p>
          </div>
          <button
            onClick={() => setNewsletter(!newsletter)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors duration-200',
              newsletter ? 'bg-[var(--gold)]' : 'bg-white/10',
            )}
            role="switch"
            aria-checked={newsletter}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
                newsletter ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

        {/* Sign Out */}
        <Button variant="ghost" onClick={onSignOut} className="text-[var(--error)] hover:text-[var(--error)]">
          <LogOut className="w-4 h-4 me-2" />
          {isHe ? L.signOut.he : L.signOut.en}
        </Button>

        {/* Delete Account */}
        <p className="text-xs" style={{ color: 'var(--error)' }}>
          {isHe ? L.deleteAccount.he : L.deleteAccount.en}:{' '}
          <span style={{ color: 'var(--text-muted)' }}>{isHe ? L.deleteSub.he : L.deleteSub.en}</span>
        </p>
      </div>
    </Section>
  );
}

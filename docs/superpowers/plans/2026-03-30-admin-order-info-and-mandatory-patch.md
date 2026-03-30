# Admin Order Info + Mandatory Patch/Name Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show quantity and total price per item in the admin order detail view, and block "Add to Cart" when the patch toggle is on with no text, or the name/number toggle is on with both fields empty.

**Architecture:** Lift `nameNumberOpen` and `patchOpen` from local state in `CustomizationOptions` up to the product page client so the parent can validate before adding to cart. Admin page gets two extra fields per item card (quantity and line total). No new files needed.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Firebase Firestore

---

### Task 1: Add quantity and totalPrice to admin order item cards

**Files:**
- Modify: `src/app/admin/orders/[id]/page.tsx`

**What it looks like today (lines 279–316):** Each item card is a 148px-wide box. It shows teamName, size, and then badges/tags for customizations. It never renders `item.quantity` or `item.totalPrice`.

- [ ] **Step 1: Add qty and price rows to the item card**

In `src/app/admin/orders/[id]/page.tsx`, find the card body `<div className="p-3 flex flex-col gap-1.5">` (around line 293) and add two lines after the existing `<p>Size:...</p>` line:

```tsx
<p className="text-xs text-gray-400">Size: <span className="text-white font-medium">{item.size}</span></p>
{item.quantity > 1 && (
  <p className="text-xs text-gray-400">Qty: <span className="text-white font-medium">×{item.quantity}</span></p>
)}
<p className="text-xs text-gray-400">Price: <span className="text-white font-medium">₪{item.totalPrice}</span></p>
```

Quantity is only shown when it's more than 1 (the common case is 1, no need to clutter).

- [ ] **Step 2: Manual verify**

Run `npm run dev`. Open any order in `/admin/orders/[id]`. Confirm each item card now shows the line-item price. For any order with quantity > 1, confirm the qty row appears. For qty = 1, confirm it stays hidden.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/orders/[id]/page.tsx
git commit -m "feat: show quantity and line price on admin order item cards"
```

---

### Task 2: Lift nameNumberOpen and patchOpen state to product page parent

**Files:**
- Modify: `src/components/product/CustomizationOptions.tsx`
- Modify: `src/app/[locale]/product/[id]/client.tsx`

**Why:** `nameNumberOpen` and `patchOpen` are currently local state inside `CustomizationOptions`. The parent (`client.tsx`) has no way to know whether those sections are open, so it cannot validate them before adding to cart. Moving them up makes validation trivial.

- [ ] **Step 1: Update `CustomizationOptions` props interface**

In `src/components/product/CustomizationOptions.tsx`, replace the props interface and remove the two local `useState` calls:

```tsx
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
  // ← DELETE the two useState lines that were here
```

- [ ] **Step 2: Update `handleToggle` to use the passed-in setters**

The `handleToggle` function currently calls `setNameNumberOpen` and `setPatchOpen` from local state. Those names stay the same, so no change is needed inside `handleToggle`. The only change is that the state now lives in the parent. Verify `handleToggle` still reads correctly:

```tsx
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
```

- [ ] **Step 3: Apply error styles to the patch text input**

Find the patch text `<input>` (around line 162 in the original, now wherever it lands). Add a conditional border color that turns red when `patchError` is true:

```tsx
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
```

- [ ] **Step 4: Apply error styles to the name/number inputs**

Find the name/number inputs block (around line 134 in the original). Add a conditional border color when `nameNumberError` is true:

```tsx
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
```

- [ ] **Step 5: Update `client.tsx` to own the open state**

In `src/app/[locale]/product/[id]/client.tsx`, add the four new state variables near the other `useState` declarations (around line 137):

```tsx
const [nameNumberOpen, setNameNumberOpen] = useState(false);
const [patchOpen, setPatchOpen] = useState(false);
const [patchError, setPatchError] = useState(false);
const [nameNumberError, setNameNumberError] = useState(false);
```

- [ ] **Step 6: Pass the new props to `CustomizationOptions` in client.tsx**

Find the `<CustomizationOptions ... />` usage (around line 309) and add the new props:

```tsx
<CustomizationOptions
  customization={customization}
  onChange={setCustomization}
  jerseyType={jersey.type}
  nameNumberOpen={nameNumberOpen}
  setNameNumberOpen={setNameNumberOpen}
  patchOpen={patchOpen}
  setPatchOpen={setPatchOpen}
  patchError={patchError}
  nameNumberError={nameNumberError}
/>
```

- [ ] **Step 7: Manual verify — no regressions**

Run `npm run dev`. Open any product page. Toggle name/number on and off, toggle patch on and off. Confirm everything still works the same as before. No TypeScript errors in the terminal.

- [ ] **Step 8: Commit**

```bash
git add src/components/product/CustomizationOptions.tsx src/app/[locale]/product/[id]/client.tsx
git commit -m "refactor: lift nameNumberOpen and patchOpen to product page client"
```

---

### Task 3: Validate customization before adding to cart

**Files:**
- Modify: `src/app/[locale]/product/[id]/client.tsx`

**What to validate:**
- If `patchOpen` is true and `customization.patchText.trim()` is empty → block, highlight input, show toast
- If `nameNumberOpen` is true and both `customization.customName.trim()` and `customization.customNumber.trim()` are empty → block, highlight inputs, show toast

- [ ] **Step 1: Add validation to `handleAddToCart`**

In `src/app/[locale]/product/[id]/client.tsx`, find `handleAddToCart` (around line 175). After the `!selectedSize` check and before the `addItem` call, add:

```tsx
// Validate: name/number section open but both fields empty
if (nameNumberOpen && !customization.customName.trim() && !customization.customNumber.trim()) {
  setNameNumberError(true);
  setTimeout(() => setNameNumberError(false), 800);
  toast({
    title: isHe ? 'אנא הזן שם או מספר' : 'Please enter a name or number',
    variant: 'error',
  });
  return;
}

// Validate: patch section open but text empty
if (patchOpen && !customization.patchText.trim()) {
  setPatchError(true);
  setTimeout(() => setPatchError(false), 800);
  toast({
    title: isHe ? "אנא הזן טקסט לפאצ'" : 'Please enter patch text',
    variant: 'error',
  });
  return;
}
```

The full `handleAddToCart` after the edit should look like:

```tsx
const handleAddToCart = useCallback(() => {
  if (!jersey) return;
  if (!selectedSize) {
    setShakeSize(true);
    setTimeout(() => setShakeSize(false), 500);
    toast({ title: isHe ? 'בחר מידה' : 'Please select a size', variant: 'error' });
    return;
  }
  if (nameNumberOpen && !customization.customName.trim() && !customization.customNumber.trim()) {
    setNameNumberError(true);
    setTimeout(() => setNameNumberError(false), 800);
    toast({
      title: isHe ? 'אנא הזן שם או מספר' : 'Please enter a name or number',
      variant: 'error',
    });
    return;
  }
  if (patchOpen && !customization.patchText.trim()) {
    setPatchError(true);
    setTimeout(() => setPatchError(false), 800);
    toast({
      title: isHe ? "אנא הזן טקסט לפאצ'" : 'Please enter patch text',
      variant: 'error',
    });
    return;
  }
  addItem(jersey, selectedSize, customization);
  recordCartAdd(jersey.id);
  recordInteraction(jersey.id, 'cart');
  const displayName = getJerseyName(jersey, locale);
  toast({ title: isHe ? 'נוסף לסל!' : 'Added to cart!', description: displayName, variant: 'success' });
}, [jersey, selectedSize, customization, nameNumberOpen, patchOpen, addItem, recordCartAdd, recordInteraction, toast, isHe, locale]);
```

Note the dependency array now includes `nameNumberOpen` and `patchOpen`.

- [ ] **Step 2: Manual verify — patch validation**

Run `npm run dev`. Open any product page. Toggle Patch on, leave the text empty, click "Add to Cart". Confirm:
- Toast appears: "Please enter patch text"
- The patch input border turns red briefly
- Item is NOT added to cart

Then fill in the patch text and click Add to Cart. Confirm item IS added.

- [ ] **Step 3: Manual verify — name/number validation**

Toggle Name & Number on, leave both fields empty, click "Add to Cart". Confirm:
- Toast appears: "Please enter a name or number"
- Both name and number input borders turn red briefly
- Item is NOT added to cart

Fill in either the name OR the number (not both required, just one), click Add to Cart. Confirm item IS added.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/product/[id]/client.tsx
git commit -m "feat: require patch text and name/number before adding to cart"
```

---

### Task 4: Push to origin

- [ ] **Step 1: Push**

```bash
git push origin main
```

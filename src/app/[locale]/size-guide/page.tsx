import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'מדריך מידות — FootJersey' : 'Size Guide — FootJersey',
    description: isHe
      ? 'מצא את המידה הנכונה לחולצת הכדורגל שלך. טבלאות מידות למבוגרים וילדים.'
      : 'Find your perfect football jersey size. Adult and kids size charts for all jerseys.',
  };
}

export default function SizeGuidePage({ params }: { params: { locale: string } }) {
  const isHe = params.locale === 'he';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      {/* Header */}
      <div className="py-20 md:py-24" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={`max-w-[800px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-4">{isHe ? 'עזרה במידות' : 'Sizing Help'}</p>
          <h1
            className="font-playfair font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {isHe ? 'מדריך מידות' : 'Size Guide'}
          </h1>
          <p className="text-base" style={{ color: 'var(--muted)' }}>
            {isHe
              ? 'מצא את המידה המושלמת. אם אתה בין שתי מידות, מומלץ לבחור את הגדולה יותר.'
              : 'Find your perfect fit. If between two sizes, we recommend sizing up.'}
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-12 space-y-12">

        {/* Adult sizes */}
        <div>
          <h2
            className={`font-semibold text-white text-xl mb-6 ${isHe ? 'text-right' : ''}`}
          >
            {isHe ? '👕 מידות מבוגרים' : '👕 Adult Sizes'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--steel)' }}>
                  {[
                    isHe ? 'מידה' : 'Size',
                    isHe ? 'סביבת חזה (ס"מ)' : 'Chest (cm)',
                    isHe ? 'אורך (ס"מ)' : 'Length (cm)',
                    isHe ? 'סביבת חזה (אינץ\')' : 'Chest (in)',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[10px] uppercase tracking-wide px-4 py-3 text-left"
                      style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'S',   chest: '86–91',  length: '67', chestIn: '34–36' },
                  { size: 'M',   chest: '91–96',  length: '69', chestIn: '36–38' },
                  { size: 'L',   chest: '96–101', length: '71', chestIn: '38–40' },
                  { size: 'XL',  chest: '101–106',length: '73', chestIn: '40–42' },
                  { size: 'XXL', chest: '106–111',length: '75', chestIn: '42–44' },
                ].map((row, i) => (
                  <tr
                    key={i}
                    style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                  >
                    <td className="px-4 py-3 font-semibold text-white" style={{ borderBottom: '1px solid var(--border)' }}>{row.size}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.chest}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.length}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.chestIn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kids sizes */}
        <div>
          <h2 className={`font-semibold text-white text-xl mb-6 ${isHe ? 'text-right' : ''}`}>
            {isHe ? '👶 מידות ילדים' : '👶 Kids Sizes'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--steel)' }}>
                  {[
                    isHe ? 'מידה' : 'Size',
                    isHe ? 'גיל מוערך' : 'Age (approx)',
                    isHe ? 'גובה (ס"מ)' : 'Height (cm)',
                    isHe ? 'סביבת חזה (ס"מ)' : 'Chest (cm)',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[10px] uppercase tracking-wide px-4 py-3 text-left"
                      style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { size: '16', age: '4–5',   height: '104–110', chest: '57–60' },
                  { size: '18', age: '6–7',   height: '116–122', chest: '60–64' },
                  { size: '20', age: '8–9',   height: '128–134', chest: '64–68' },
                  { size: '22', age: '10–11', height: '140–146', chest: '68–72' },
                  { size: '24', age: '12–13', height: '152–158', chest: '72–76' },
                  { size: '26', age: '13–14', height: '158–164', chest: '76–80' },
                  { size: '28', age: '14–15', height: '164–170', chest: '80–84' },
                ].map((row, i) => (
                  <tr
                    key={i}
                    style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                  >
                    <td className="px-4 py-3 font-semibold text-white" style={{ borderBottom: '1px solid var(--border)' }}>{row.size}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.age}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.height}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.chest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div
          className={`p-6 rounded-xl ${isHe ? 'text-right' : ''}`}
          style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-semibold text-white mb-4">
            {isHe ? '💡 טיפים לבחירת מידה' : '💡 Sizing Tips'}
          </h3>
          <ul className={`space-y-2 text-sm ${isHe ? 'pr-4' : 'pl-4'} list-disc`} style={{ color: 'var(--muted)' }}>
            {(isHe ? [
              'מדוד את סביבת החזה הרחבה ביותר שלך לפני בחירת המידה',
              'חולצות כדורגל בדרך כלל חתוכות ב-fit רגיל — לא רפוי ולא צמוד',
              'אם אתה בין שתי מידות, בחר את הגדולה יותר',
              'ילדים גדלים מהר — מידה גדולה יותר תחזיק יותר זמן',
              'גרסת שחקן (Player Version) בדרך כלל חתוכה יותר צמוד',
            ] : [
              'Measure your chest at its widest point before selecting size',
              'Football jerseys are typically regular fit — not baggy, not tight',
              'If between two sizes, choose the larger one',
              'Kids grow fast — sizing up means longer wear',
              'Player Version jerseys are typically cut slimmer',
            ]).map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

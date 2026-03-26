'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackagePlus, Ticket, ClipboardList, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const NAV = [
  { href: '/admin',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/products',  label: 'Add Product', icon: PackagePlus },
  { href: '/admin/discounts', label: 'Discounts',   icon: Ticket },
  { href: '/admin/orders',    label: 'Orders',      icon: ClipboardList },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/10 bg-[#0d0d0d]">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" style={{ boxShadow: '0 0 8px #00C3D8' }} />
          <span className="font-bold text-white text-sm tracking-tight">FootJersey Admin</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

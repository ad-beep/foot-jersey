'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackagePlus, Ticket, ClipboardList, ShieldCheck, LogOut, Menu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const NAV = [
  { href: '/admin',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/products',  label: 'Add Product', icon: PackagePlus },
  { href: '/admin/discounts', label: 'Discounts',   icon: Ticket },
  { href: '/admin/orders',    label: 'Orders',      icon: ClipboardList },
  { href: '/admin/audit',     label: 'Audit Log',   icon: ShieldCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('admin-sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <aside
      className="shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/10 bg-[#0d0d0d] transition-all duration-200"
      style={{ width: collapsed ? '56px' : '224px' }}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-white/10 flex items-center gap-2 min-h-[57px]">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" style={{ boxShadow: '0 0 8px #00C3D8' }} />
            <span className="font-bold text-white text-sm tracking-tight truncate">FootJersey Admin</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <span className="w-2 h-2 rounded-full bg-cyan-500 block" style={{ boxShadow: '0 0 8px #00C3D8' }} />
          </Link>
        )}
        <button
          onClick={toggle}
          className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

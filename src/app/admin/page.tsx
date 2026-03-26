'use client';

import Link from 'next/link';
import { PackagePlus, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Admin Cockpit</h1>
      <p className="text-sm text-gray-400 mb-8">Manage products and orders</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-4 p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <PackagePlus className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Add Product</p>
            <p className="text-xs text-gray-500">Add jerseys to the catalogue</p>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="flex items-center gap-4 p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Orders</p>
            <p className="text-xs text-gray-500">View and manage live orders</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

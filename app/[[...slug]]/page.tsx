"use client";

import dynamic from "next/dynamic";

const ExistingStorefront = dynamic(() => import("@/App"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />
        <p className="text-sm font-semibold text-slate-700">Loading Tech Innovation…</p>
      </div>
    </main>
  ),
});

export default function StorefrontRoute() {
  return (
    <div id="root">
      <ExistingStorefront />
    </div>
  );
}

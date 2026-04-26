'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(value.trim(), 10);
    if (!isNaN(n) && n > 0) router.push(`/teams/${n}`);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-44">
        <label htmlFor="team-search-compact" className="sr-only">Search team number</label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="team-search-compact"
            type="number"
            min={1}
            max={99999}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Team #…"
            className="w-full pl-8 pr-12 py-1.5 bg-[#1a1f2e] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:border-green-500 focus:bg-[#1f2535] transition-colors"
            aria-label="Search by team number"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
          >
            Go
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <label htmlFor="team-search" className="sr-only">Search team number</label>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          id="team-search"
          type="number"
          min={1}
          max={99999}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter team number…"
          className="w-full pl-10 pr-4 py-3 bg-[#1a1f2e] border border-white/10 rounded-xl text-white placeholder-gray-500 text-lg focus:border-green-500 focus:bg-[#1f2535] transition-colors"
          aria-label="Search by team number"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[56px] min-h-[36px]"
        >
          Go
        </button>
      </div>
    </form>
  );
}

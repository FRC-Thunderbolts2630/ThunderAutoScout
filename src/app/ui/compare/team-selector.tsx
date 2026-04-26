'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TeamSelector({ selectedTeams }: { selectedTeams: number[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [input, setInput] = useState('');

  function pushTeams(teams: number[]) {
    const p = new URLSearchParams(params?.toString() ?? '');
    p.set('teams', teams.join(','));
    router.push(`/compare?${p.toString()}`);
  }

  function addTeam(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(input.trim(), 10);
    if (!isNaN(n) && n > 0 && !selectedTeams.includes(n) && selectedTeams.length < 8) {
      pushTeams([...selectedTeams, n]);
      setInput('');
    }
  }

  function removeTeam(n: number) {
    pushTeams(selectedTeams.filter((t) => t !== n));
  }

  return (
    <div className="space-y-3">
      {/* Selected team pills */}
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {selectedTeams.map((n) => (
          <span
            key={n}
            className="flex items-center gap-1.5 bg-[#1a1f2e] border border-white/10 text-white text-sm px-3 py-1 rounded-full"
          >
            <Link href={`/teams/${n}`} className="font-mono hover:text-green-400 transition-colors">
              {n}
            </Link>
            <button
              onClick={() => removeTeam(n)}
              className="text-gray-500 hover:text-red-400 transition-colors"
              aria-label={`Remove team ${n}`}
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {selectedTeams.length === 0 && (
          <span className="text-sm text-gray-600 self-center">Add team numbers to compare</span>
        )}
      </div>

      {/* Add team form */}
      <form onSubmit={addTeam} className="flex gap-2">
        <label htmlFor="add-team" className="sr-only">Add team number</label>
        <input
          id="add-team"
          type="number"
          min={1}
          max={99999}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add team number…"
          className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-500 focus:outline-none transition-colors"
          aria-label="Add team number to compare"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={selectedTeams.length >= 8}
          className="flex items-center gap-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px]"
          aria-label="Add team to comparison"
        >
          <PlusIcon className="w-4 h-4" />
          Add
        </button>
      </form>
    </div>
  );
}

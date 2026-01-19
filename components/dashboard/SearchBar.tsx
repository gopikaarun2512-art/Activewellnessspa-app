'use client';

import { useState, useEffect } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search by name or phone...',
  onSearch,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-white/70 dark:text-gray-400 group-focus-within:text-white dark:group-focus-within:text-wellness-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-12 pr-12 py-3.5 border border-white/40 dark:border-gray-700 rounded-xl bg-white/25 dark:bg-gray-900/50 backdrop-blur-md text-white dark:text-white placeholder-white/70 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 dark:focus:ring-wellness-500 focus:border-transparent focus:bg-white/35 dark:focus:bg-gray-900/70 transition-all duration-300 shadow-premium hover:shadow-premium-lg font-medium"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-wellness-400 hover:scale-110 transition-all duration-300"
          aria-label="Clear search"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

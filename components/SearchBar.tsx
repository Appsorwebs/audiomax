import React, { useState, useEffect } from 'react';
import { searchService, type SearchResult } from '../services/searchService';

interface SearchBarProps {
  onSearch?: (results: SearchResult[]) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search meetings...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [exactPhrase, setExactPhrase] = useState(false);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const searchResults = searchService.search(searchQuery, {
        exactPhrase,
        minRelevance: 0.05,
      });

      setResults(searchResults);
      setShowResults(true);
      setShowSuggestions(false);
      setIsSearching(false);

      onSearch?.(searchResults);
    }, 100);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (value.length > 1) {
      const newSuggestions = searchService.getSuggestions(value, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const newQuery = suggestion;
    setQuery(newQuery);
    setShowSuggestions(false);
    handleSearch(newQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const getResultSummary = () => {
    if (results.length === 0 && query) {
      return 'No results found';
    }
    if (results.length === 1) {
      return `Found ${results[0].matchCount} match`;
    }
    const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);
    return `Found ${totalMatches} matches in ${results.length} meetings`;
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => showSuggestions && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />

        {/* Search Button */}
        <button
          onClick={() => handleSearch(query)}
          disabled={!query.trim() || isSearching}
          className="absolute right-3 top-3 px-3 py-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition"
        >
          {isSearching ? (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            '🔍'
          )}
        </button>

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
              setShowSuggestions(false);
            }}
            className="absolute right-14 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition"
            >
              <span className="text-slate-500 dark:text-slate-400 mr-2">🔤</span>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Search Options */}
      {query && (
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={exactPhrase}
              onChange={(e) => {
                setExactPhrase(e.target.checked);
                handleSearch(query);
              }}
              className="w-4 h-4 rounded accent-sky-500"
            />
            <span className="text-slate-700 dark:text-slate-300">Exact phrase</span>
          </label>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {getResultSummary()}
          </span>
        </div>
      )}

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {result.meetingTitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {result.matchCount} match{result.matchCount > 1 ? 'es' : ''} •
                    Relevance: {(result.relevance * 100).toFixed(0)}%
                  </p>
                </div>
                <span className="inline-block px-2 py-1 bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium rounded">
                  {result.matchCount} hits
                </span>
              </div>

              {/* Snippets */}
              <div className="space-y-2">
                {result.snippets.map((snippet, snippetIdx) => (
                  <div
                    key={snippetIdx}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded text-sm text-slate-700 dark:text-slate-300 font-mono text-xs leading-relaxed"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: snippet.highlighted.replaceAll(
                          '<mark>',
                          '<span class="bg-yellow-300 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 font-bold rounded px-1">'
                        ),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {showResults && results.length === 0 && query && (
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            No results found for "{query}"
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Try a different search term or use exact phrase matching
          </p>
        </div>
      )}

      {/* Help Text */}
      {!showResults && !query && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 Search tips: Type to find content, use Ctrl+K to focus search
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

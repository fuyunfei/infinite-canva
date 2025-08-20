/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom: () => void;
  isLoading: boolean;
  viewMode: 'normal' | 'onepage';
  onViewModeChange: (mode: 'normal' | 'onepage') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onRandom, isLoading, viewMode, onViewModeChange }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery(''); // Clear the input field after search
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="search-input"
          aria-label="Search for a topic"
          disabled={isLoading}
        />
      </form>
      <button onClick={onRandom} className="random-button" disabled={isLoading}>
        Random
      </button>
      <button 
        onClick={() => onViewModeChange(viewMode === 'normal' ? 'onepage' : 'normal')} 
        className="random-button"
        title={viewMode === 'normal' ? 'Switch to One Page View' : 'Switch to Normal View'}
      >
        {viewMode === 'normal' ? 'One Page' : 'Normal'}
      </button>
    </div>
  );
};

export default SearchBar;
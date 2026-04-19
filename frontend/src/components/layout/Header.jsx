import React, { useState, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useDataContext } from '../../store/context';
import { getrelavantNames } from '../../services/api';

const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

function looksLikeAddress(query) {
  if (!query || query.trim().length < 3) return false;
  const trimmed = query.trim();
  if (/^\d+\s+\w/.test(trimmed)) return true;
  if (trimmed.includes(',')) return true;
  const streetWords = /\b(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|pl|place|cres|crescent|ct|court|hwy|highway)\b/i;
  if (streetWords.test(trimmed)) return true;
  return false;
}

async function geocodeAddress(query) {
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&proximity=-79.3957,43.6629&limit=5`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    return data.features.map(f => ({
      name: f.place_name,
      longitude: f.center[0],
      latitude: f.center[1],
      type: f.place_type?.[0] || 'address',
    }));
  }
  return [];
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [addressResults, setAddressResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { handleSearch, searchByLocation } = useDataContext();
  const debounceRef = useRef(null);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length > 0) {
      debounceRef.current = setTimeout(async () => {
        try {
          const namePromise = getrelavantNames(value).catch(() => []);
          let geoPromise = Promise.resolve([]);
          if (looksLikeAddress(value) && MAPTILER_KEY && MAPTILER_KEY !== 'your_maptiler_api_key_here') {
            geoPromise = geocodeAddress(value).catch(() => []);
          }
          const [names, geoResults] = await Promise.all([namePromise, geoPromise]);
          setSuggestions(names || []);
          setAddressResults(geoResults || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setAddressResults([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setAddressResults([]);
      setShowSuggestions(false);
    }
  };

  const handleNameClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressResults([]);
  };

  const handleAddressClick = (result) => {
    setSearchQuery(result.name);
    searchByLocation(result.latitude, result.longitude);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddressResults([]);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);

    if (looksLikeAddress(searchQuery) && MAPTILER_KEY && MAPTILER_KEY !== 'your_maptiler_api_key_here') {
      setIsGeocoding(true);
      try {
        const results = await geocodeAddress(searchQuery);
        if (results.length > 0) {
          searchByLocation(results[0].latitude, results[0].longitude);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
        handleSearch(searchQuery);
      } finally {
        setIsGeocoding(false);
      }
    } else {
      handleSearch(searchQuery);
    }
  };

  const hasNameSuggestions = suggestions.length > 0;
  const hasAddressResults = addressResults.length > 0;
  const hasAnySuggestions = hasNameSuggestions || hasAddressResults;

  // Suggestion item component
  const SuggestionItem = ({ icon, iconBg, label, onClick: onItemClick, hoverBg }) => (
    <div
      onClick={onItemClick}
      className={`px-4 py-2.5 cursor-pointer transition-all duration-150 flex items-center gap-3 ${hoverBg}`}
    >
      <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
    </div>
  );

  return (
    <header
      className="relative z-30"
      style={{
        background: 'var(--color-surface-elevated)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        {/* Top row */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-accent)', boxShadow: 'var(--shadow-glow)' }}
            >
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>P</span>
            </div>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
            >
              Parking<span style={{ color: 'var(--color-accent)' }}>TO</span>
            </h1>
          </div>

          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:block flex-1 max-w-xl mx-6">
            <div className="relative">
              <div
                className="flex items-center rounded-xl overflow-hidden transition-shadow duration-200 focus-within:shadow-md"
                style={{
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {isGeocoding ? (
                  <Loader2 className="w-4 h-4 ml-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <Search className="w-4 h-4 ml-4" style={{ color: 'var(--color-text-muted)' }} />
                )}
                <input
                  type="text"
                  placeholder="Search spots or enter an address..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => hasAnySuggestions && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full px-3 py-2.5 border-none outline-none text-sm"
                  style={{
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
              </div>

              {/* Desktop Dropdown */}
              {showSuggestions && hasAnySuggestions && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto animate-fade-in-up"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {hasNameSuggestions && (
                    <>
                      <div
                        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
                      >
                        Parking Spots
                      </div>
                      {suggestions.slice(0, 5).map((s, i) => (
                        <SuggestionItem
                          key={`name-${i}`}
                          icon={<span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>P</span>}
                          iconBg="bg-teal-50"
                          label={s}
                          onClick={() => handleNameClick(s)}
                          hoverBg="hover:bg-teal-50/50"
                        />
                      ))}
                    </>
                  )}
                  {hasAddressResults && (
                    <>
                      <div
                        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
                      >
                        Locations
                      </div>
                      {addressResults.map((r, i) => (
                        <SuggestionItem
                          key={`addr-${i}`}
                          icon={<MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-dark)' }} />}
                          iconBg="bg-emerald-50"
                          label={r.name}
                          onClick={() => handleAddressClick(r)}
                          hoverBg="hover:bg-emerald-50/50"
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Nav */}
          <nav className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              className="hidden md:block text-sm font-medium transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-gray-100"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              About
            </button>
            <button
              className="px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: 'var(--color-accent)', boxShadow: 'var(--shadow-glow)' }}
            >
              Login
            </button>
          </nav>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearchSubmit} className="md:hidden mt-3">
          <div className="relative">
            <div
              className="flex items-center rounded-xl overflow-hidden transition-shadow duration-200 focus-within:shadow-md"
              style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
            >
              {isGeocoding ? (
                <Loader2 className="w-4 h-4 ml-3 animate-spin" style={{ color: 'var(--color-accent)' }} />
              ) : (
                <Search className="w-4 h-4 ml-3" style={{ color: 'var(--color-text-muted)' }} />
              )}
              <input
                type="text"
                placeholder="Search spots or address..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => hasAnySuggestions && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-3 py-2.5 border-none outline-none text-sm"
                style={{
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  fontFamily: "'Outfit', sans-serif",
                }}
              />
            </div>

            {/* Mobile Dropdown */}
            {showSuggestions && hasAnySuggestions && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto animate-fade-in-up"
                style={{
                  background: 'var(--color-surface-elevated)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {hasNameSuggestions && (
                  <>
                    <div
                      className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
                    >
                      Parking Spots
                    </div>
                    {suggestions.slice(0, 4).map((s, i) => (
                      <SuggestionItem
                        key={`m-name-${i}`}
                        icon={<span className="text-[10px] font-bold" style={{ color: 'var(--color-accent)' }}>P</span>}
                        iconBg="bg-teal-50"
                        label={s}
                        onClick={() => handleNameClick(s)}
                        hoverBg="hover:bg-teal-50/40"
                      />
                    ))}
                  </>
                )}
                {hasAddressResults && (
                  <>
                    <div
                      className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
                    >
                      Locations
                    </div>
                    {addressResults.slice(0, 3).map((r, i) => (
                      <SuggestionItem
                        key={`m-addr-${i}`}
                        icon={<MapPin className="w-3 h-3" style={{ color: 'var(--color-accent-dark)' }} />}
                        iconBg="bg-emerald-50"
                        label={r.name}
                        onClick={() => handleAddressClick(r)}
                        hoverBg="hover:bg-emerald-50/40"
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </header>
  );
}

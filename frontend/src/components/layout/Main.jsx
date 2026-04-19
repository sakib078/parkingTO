import React, { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import { useDataContext } from '../../store/context';
import { MapPin, Navigation as NavIcon, ExternalLink, Car, Accessibility, Shield, Search, ChevronUp, X, List } from 'lucide-react';

const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// ──────────────────────────────────────────
// Capacity Bar
// ──────────────────────────────────────────
function CapacityBar({ total }) {
  const n = parseInt(total) || 0;
  const pct = Math.min((n / 60) * 100, 100);
  const color = n > 30 ? 'var(--color-success)' : n > 10 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Capacity</span>
        <span className="font-medium">{n} spaces</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-surface)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Parking Card
// ──────────────────────────────────────────
function ParkingCard({ spot, index, onClick, isNearest, animDelay }) {
  const totalSpaces = parseInt(spot.totalSpaces) || 0;
  const regularSpaces = parseInt(spot.regularSpaces) || 0;
  const handicapSpaces = parseInt(spot.handicapSpaces) || 0;

  const accessStyles = {
    'Public': { bg: 'rgba(5, 150, 105, 0.08)', color: 'var(--color-success)' },
    'Private': { bg: 'rgba(225, 29, 72, 0.08)', color: 'var(--color-danger)' },
    'Permit': { bg: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-warning)' },
  };
  const access = accessStyles[spot.access] || { bg: 'var(--color-surface)', color: 'var(--color-text-secondary)' };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden group animate-fade-in-up"
      style={{
        background: 'var(--color-surface-elevated)',
        boxShadow: 'var(--shadow-sm)',
        animationDelay: `${(animDelay || 0) * 60}ms`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Card header — subtle gradient accent strip */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isNearest ? 'rgba(225, 29, 72, 0.08)' : 'var(--color-accent-glow)' }}
          >
            {isNearest ? (
              <span className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>{index + 1}</span>
            ) : (
              <Car className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            )}
          </div>
          <h3
            className="font-semibold text-sm truncate"
            style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text-primary)' }}
          >
            {spot.name || 'Parking Spot'}
          </h3>
        </div>
        {isNearest && spot.distance !== undefined && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-2 flex-shrink-0"
            style={{ background: 'rgba(225, 29, 72, 0.06)', color: 'var(--color-danger)' }}
          >
            {spot.distance} km
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-2">
        {/* Access badge */}
        {spot.access && (
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: access.bg, color: access.color }}
            >
              {spot.access}
            </span>
          </div>
        )}

        {/* Capacity */}
        {totalSpaces > 0 && (
          <>
            <CapacityBar total={totalSpaces} />
            <div className="flex gap-4 text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {regularSpaces > 0 && (
                <div className="flex items-center gap-1">
                  <Car className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                  <span>{regularSpaces} regular</span>
                </div>
              )}
              {handicapSpaces > 0 && (
                <div className="flex items-center gap-1">
                  <Accessibility className="w-3 h-3" style={{ color: 'var(--color-accent)' }} />
                  <span>{handicapSpaces} accessible</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Directions */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 mt-1"
          style={{ color: 'var(--color-accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
        >
          <NavIcon className="w-3.5 h-3.5" />
          Get Directions
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────
export default function Main() {
  const { data, nearestLocs, mapCenter, Nearestspots, setSelectedPlace, setMapCenter } = useDataContext();
  const [viewState, setViewState] = useState({
    latitude: 43.6629,
    longitude: -79.3957,
    zoom: 12,
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const resultsCount = (nearestLocs?.length || 0) + (data?.length || 0);
  const hasResults = resultsCount > 0;

  useEffect(() => {
    if (hasResults) setSidebarOpen(true);
  }, [nearestLocs, data, hasResults]);

  const handleMarkerClick = useCallback((place) => {
    setSelectedMarker(place);
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);
    if (lat && lng) {
      setSelectedPlace({ lat, lng });
      Nearestspots({ lat, lng });
    }
  }, [setSelectedPlace, Nearestspots]);

  const handleMapClick = useCallback((e) => {
    const { lat, lng } = e.lngLat;
    setSelectedPlace({ lat, lng });
    setMapCenter({ lat, lng });
    Nearestspots({ lat, lng });
    setSelectedMarker(null);
  }, [setSelectedPlace, setMapCenter, Nearestspots]);

  useEffect(() => {
    if (mapCenter && mapCenter.lat && mapCenter.lng) {
      setViewState((prev) => ({
        ...prev,
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        zoom: 14,
      }));
    }
  }, [mapCenter]);

  const getDirectionsUrl = (lat, lng) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // ── Sidebar Content ──
  const SidebarContent = () => (
    <>
      <div
        className="px-4 py-3.5 md:py-4 flex items-center sticky top-0 z-10"
        style={{ background: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border-soft)' }}
      >
        <h2
          className="text-sm md:text-base font-bold flex items-center gap-2 flex-1"
          style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text-primary)' }}
        >
          {nearestLocs && nearestLocs.length > 0 ? (
            <>
              <MapPin className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
              <span>Nearest Spots</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: 'rgba(225, 29, 72, 0.06)', color: 'var(--color-danger)' }}
              >
                {nearestLocs.length}
              </span>
            </>
          ) : data && data.length > 0 ? (
            <>
              <Car className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span>Search Results</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)' }}
              >
                {data.length}
              </span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <span>Nearby Parking</span>
            </>
          )}
        </h2>

        {/* Mobile close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg transition-colors ml-2"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {nearestLocs && nearestLocs.length > 0 ? (
          nearestLocs.map((spot, index) => (
            <ParkingCard
              key={`nearest-${index}`}
              spot={spot}
              index={index}
              isNearest={true}
              animDelay={index}
              onClick={() => {
                handleMarkerClick(spot);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
            />
          ))
        ) : data && data.length > 0 ? (
          data.map((place, index) => (
            <ParkingCard
              key={`search-${index}`}
              spot={place}
              index={index}
              isNearest={false}
              animDelay={index}
              onClick={() => {
                handleMarkerClick(place);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4 animate-fade-in-up">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-surface)' }}
            >
              <MapPin className="w-7 h-7" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              No results yet
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              Search for a parking spot, enter an address, or click on the map
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="relative flex" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Map ── */}
      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <FullscreenControl position="top-right" />

          {/* Search markers (teal) */}
          {data?.map((place, i) => (
            <Marker
              key={`search-${i}`}
              latitude={parseFloat(place.latitude)}
              longitude={parseFloat(place.longitude)}
              anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); handleMarkerClick(place); }}
            >
              <div
                title={place.name || 'Parking Spot'}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  border: '2px solid var(--color-accent-dark)',
                  cursor: 'pointer',
                  transition: 'transform 150ms var(--ease-out)',
                  boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)',
                }}
                onMouseEnter={(e) => (e.target.style.transform = 'scale(1.4)')}
                onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
              />
            </Marker>
          ))}

          {/* Nearest markers (rose) */}
          {nearestLocs?.map((spot, i) => (
            <Marker
              key={`nearest-${i}`}
              latitude={parseFloat(spot.latitude)}
              longitude={parseFloat(spot.longitude)}
              anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); handleMarkerClick(spot); }}
            >
              <div
                title={`${i + 1}. ${spot.name || 'Nearest Spot'}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--color-danger)',
                  border: '2.5px solid #9f1239',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '700',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'transform 150ms var(--ease-out)',
                  boxShadow: '0 2px 10px rgba(225, 29, 72, 0.35)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {i + 1}
              </div>
            </Marker>
          ))}

          {/* Popup */}
          {selectedMarker && (
            <Popup
              latitude={parseFloat(selectedMarker.latitude)}
              longitude={parseFloat(selectedMarker.longitude)}
              anchor="bottom"
              onClose={() => setSelectedMarker(null)}
              closeOnClick={false}
              maxWidth="280px"
              offset={14}
            >
              <div className="p-3.5">
                <h3
                  className="font-bold text-sm mb-2.5"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--color-text-primary)' }}
                >
                  {selectedMarker.name || 'Parking Spot'}
                </h3>

                <div className="space-y-1.5 mb-3">
                  {selectedMarker.distance !== undefined && (
                    <p className="text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                      <span className="font-medium">{selectedMarker.distance} km</span> away
                    </p>
                  )}
                  {selectedMarker.totalSpaces && (
                    <p className="text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <Car className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                      {selectedMarker.totalSpaces} spaces
                    </p>
                  )}
                  {selectedMarker.handicapSpaces > 0 && (
                    <p className="text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <Accessibility className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                      {selectedMarker.handicapSpaces} accessible
                    </p>
                  )}
                  {selectedMarker.access && (
                    <p className="text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <Shield className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                      {selectedMarker.access}
                    </p>
                  )}
                </div>

                <a
                  href={getDirectionsUrl(selectedMarker.latitude, selectedMarker.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-white py-2 rounded-lg transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{ background: 'var(--color-accent)', boxShadow: 'var(--shadow-glow)' }}
                >
                  <NavIcon className="w-3.5 h-3.5" />
                  Get Directions
                </a>
              </div>
            </Popup>
          )}
        </Map>

        {/* Mobile floating button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 text-white px-5 py-3 rounded-full flex items-center gap-2.5 transition-all duration-200 active:scale-95"
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 4px 24px rgba(13, 148, 136, 0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <List className="w-5 h-5" />
            <span className="font-semibold text-sm">
              {hasResults ? `View Results (${resultsCount})` : 'Results'}
            </span>
            <ChevronUp className="w-4 h-4 opacity-70" />
          </button>
        )}
      </div>

      {/* ── Desktop Sidebar ── */}
      <div
        className="hidden md:block w-80 overflow-y-auto"
        style={{ background: 'var(--color-surface)' }}
      >
        <SidebarContent />
      </div>

      {/* ── Mobile Bottom Sheet ── */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-20 rounded-t-2xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '65vh',
          height: '65vh',
          background: 'var(--color-surface)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 cursor-grab" onClick={() => setSidebarOpen(false)}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 16px)' }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-10 transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.15)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

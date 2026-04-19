import React, { createContext, useContext, useState } from "react";
import { getCoordinates, Nearestspot } from '../services/api.js';

const DataContext = createContext();

export function useDataContext() {
  return useContext(DataContext);
}


export function DataContextProvider({ children }) {

  const [data, setData] = useState([]);
  const [nearestLocs, setnearestLocs] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState({});
  const [mapCenter, setMapCenter] = useState({ lat: 43.6629, lng: -79.3957 });
  const [searchMode, setSearchMode] = useState(null); // 'name' | 'location'

  const value = {
    data,
    nearestLocs,
    selectedPlace,
    mapCenter,
    searchMode,
    handleSearch,
    searchByLocation,
    Nearestspots,
    setSelectedPlace,
    setMapCenter,
  }

  // Search by parking spot name (existing)
  function handleSearch(value) {
    if (value) {
      setSearchMode('name');
      setnearestLocs([]); // Clear nearest when doing name search
      getCoordinates(value)
        .then(data => {
          if (data) {
            setData(data);
            // Center map on first result
            if (data.length > 0 && data[0].latitude && data[0].longitude) {
              setMapCenter({
                lat: parseFloat(data[0].latitude),
                lng: parseFloat(data[0].longitude),
              });
            }
          } else {
            console.error('Received undefined or null data');
          }
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    } else {
      console.error('No search value provided');
    }
  }

  // Search by location/address — centers map and finds nearest spots
  function searchByLocation(lat, lng) {
    setSearchMode('location');
    setData([]); // Clear name search results
    setMapCenter({ lat, lng });
    setSelectedPlace({ lat, lng });
    Nearestspots({ lat, lng });
  }

  function Nearestspots(selectedPlace) {
     
      Nearestspot(selectedPlace.lat, selectedPlace.lng)
        .then( places => {
           if(places) {
              setnearestLocs(places)
           }
           else {
             console.error('Receives undefined or null value');
           }
        }).catch(error => {
           console.error('Error fetching nearest places: ', error);
        })
     }


  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

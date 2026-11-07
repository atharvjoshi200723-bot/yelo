import React, { createContext, useContext, useState, useEffect } from 'react';

export const UTTARAKHAND_CITIES = [
  'Dehradun',
  'Rishikesh',
  'Haridwar',
  'Haldwani',
  'Nainital',
  'Mussoorie',
  'Roorkee',
  'Rudrapur',
  'Kashipur',
  'Almora',
  'Pithoragarh',
];

interface CityContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  cities: string[];
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    return localStorage.getItem('yelo_selected_city') || 'Dehradun';
  });

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem('yelo_selected_city', city);
  };

  useEffect(() => {
    // If not in our list, fallback to Dehradun
    if (!UTTARAKHAND_CITIES.includes(selectedCity)) {
      setSelectedCity('Dehradun');
    }
  }, [selectedCity]);

  return (
    <CityContext.Provider value={{ selectedCity, setSelectedCity, cities: UTTARAKHAND_CITIES }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};


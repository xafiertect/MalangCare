import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung GPS.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        setError('Izin lokasi ditolak. Silakan atur pin lokasi secara manual.');
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return { coords, error, isLoading, getLocation };
}

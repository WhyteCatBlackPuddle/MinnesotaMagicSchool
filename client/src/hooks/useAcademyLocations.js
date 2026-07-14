import { useEffect, useState } from 'react';

export default function useAcademyLocations() {
  const [locations, setLocations] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      try {
        const response = await fetch('/api/locations', { signal: controller.signal });
        if (!response.ok) throw new Error(`Location request failed with ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload)) throw new Error('Location response was not an array');
        setLocations(payload);
        setStatus('connected');
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.info('Living Map is using its local atlas descriptions.', error.message);
        setStatus('local');
      }
    }

    loadLocations();
    return () => controller.abort();
  }, []);

  return { locations, status };
}

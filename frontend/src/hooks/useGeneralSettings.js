import { useState, useEffect } from 'react';
import api from '../api/client';

let cachedSettings = null;

export function useGeneralSettings() {
  const [settings, setSettings] = useState(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;
    api.get('/admin/general-settings')
      .then((res) => {
        cachedSettings = res.data.data;
        setSettings(cachedSettings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}

export function invalidateGeneralSettingsCache() {
  cachedSettings = null;
}

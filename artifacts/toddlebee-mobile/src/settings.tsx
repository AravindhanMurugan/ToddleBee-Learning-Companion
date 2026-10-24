import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from './i18n';

const KEYS = {
  language: 'toddlebee-language',
  age: 'toddlebee-age',
  sessionId: 'toddlebee-session-id',
  sessionIds: 'toddlebee-session-history',
} as const;

interface AppSettings {
  language: Language;
  setLanguage: (language: Language) => void;
  age: number;
  setAge: (age: number) => void;
  sessionId: string | null;
  sessionIds: string[];
  setSession: (id: string, isSample: boolean) => Promise<void>;
  ready: boolean;
  storageError: boolean;
}

const SettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageValue] = useState<Language>('en');
  const [age, setAgeValue] = useState<number>(9);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const values = await AsyncStorage.multiGet(Object.values(KEYS));
        const stored = Object.fromEntries(values);
        const nextLanguage: Language = stored[KEYS.language] === 'ta' ? 'ta' : 'en';
        const storedAge = Number(stored[KEYS.age]);
        let ids: string[] = [];
        try {
          const parsed: unknown = JSON.parse(stored[KEYS.sessionIds] ?? '[]');
          if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string');
        } catch {
          ids = [];
        }
        const current = stored[KEYS.sessionId] || null;
        if (!active) return;
        setLanguageValue(nextLanguage);
        setAgeValue(Number.isInteger(storedAge) && storedAge >= 8 && storedAge <= 12 ? storedAge : 9);
        setSessionId(current);
        setSessionIds([...new Set([...(current ? [current] : []), ...ids])].slice(0, 20));
      } catch {
        if (active) setStorageError(true);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageValue(next);
    void AsyncStorage.setItem(KEYS.language, next).catch(() => setStorageError(true));
  };

  const setAge = (next: number) => {
    const safeAge = Math.max(8, Math.min(12, Math.round(next)));
    setAgeValue(safeAge);
    void AsyncStorage.setItem(KEYS.age, String(safeAge)).catch(() => setStorageError(true));
  };

  const setSession = async (id: string, _isSample: boolean) => {
    const nextIds = [...new Set([id, ...sessionIds])].slice(0, 20);
    setSessionId(id);
    setSessionIds(nextIds);
    try {
      await AsyncStorage.multiSet([
        [KEYS.sessionId, id],
        [KEYS.sessionIds, JSON.stringify(nextIds)],
      ]);
    } catch {
      setStorageError(true);
    }
  };

  const value = useMemo(
    () => ({ language, setLanguage, age, setAge, sessionId, sessionIds, setSession, ready, storageError }),
    [language, age, sessionId, sessionIds, ready, storageError],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return context;
}

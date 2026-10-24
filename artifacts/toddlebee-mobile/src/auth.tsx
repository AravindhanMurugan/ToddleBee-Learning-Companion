import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const AUTH_KEY = 'toddlebee-demo-auth-v1';
type DemoAuth = { ready: boolean; signedIn: boolean; signIn: (username: string, password: string) => boolean; signOut: () => void };
const AuthContext = createContext<DemoAuth | null>(null);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(AUTH_KEY).then((value) => {
      if (active) setSignedIn(value === '{"signedIn":true}');
    }).catch(() => undefined).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const signIn = (username: string, password: string) => {
    if (username.trim() !== 'test' || password !== 'test') return false;
    setSignedIn(true);
    void AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ signedIn: true }));
    return true;
  };
  const signOut = () => {
    setSignedIn(false);
    void AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ signedIn: false }));
  };
  const value = useMemo(() => ({ ready, signedIn, signIn, signOut }), [ready, signedIn]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDemoAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useDemoAuth must be used within DemoAuthProvider');
  return value;
}

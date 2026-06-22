import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'athlete' | 'doctor' | 'coach' | 'medical_partner' | 'admin' | null;

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sport: string | null;
  position: string | null;
  phone: string | null;
  sport_category: string | null;
  birthdate: string | null;
  hometown: string | null;
  current_location: string | null;
  nationality: string | null;
  league: string | null;
  chesscom_username: string | null;
  lichess_username: string | null;
  external_provider: string | null;
  external_player_id: string | null;
  football_api_player_id: string | null;
  sportify_linked: boolean;
  sportify_athlete_id: string | null;
  sportify_is_minor: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  sport_category: string;
  birthdate: string;
  hometown: string;
  current_location: string;
  nationality: string;
  league?: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, role, full_name, avatar_url, bio, sport, position, phone, sport_category, birthdate, hometown, current_location, nationality, league, chesscom_username, lichess_username, external_provider, external_player_id, football_api_player_id, sportify_linked, sportify_athlete_id, sportify_is_minor'
      )
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  }

  async function refreshProfile() {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
    setRole((p?.role as UserRole) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).then((p) => {
          setProfile(p);
          setRole((p?.role as UserRole) ?? null);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).then((p) => {
          setProfile(p);
          setRole((p?.role as UserRole) ?? null);
        });
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      setProfile(p);
      setRole((p?.role as UserRole) ?? null);
    }
    return { error: null };
  }

  async function signUp(data: SignUpData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: 'athlete' },
      },
    });
    if (error) return { error: error.message };
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        role: 'athlete',
        full_name: data.full_name,
        phone: data.phone,
        sport_category: data.sport_category,
        birthdate: data.birthdate,
        hometown: data.hometown,
        current_location: data.current_location,
        nationality: data.nationality,
        league: data.league || null,
      });
      if (profileError) return { error: profileError.message };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, role, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

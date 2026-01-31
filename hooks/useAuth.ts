'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, createElement } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { ApiResponse } from '@/types';

const MOCK_USER: User = {
    id: 'mock-user-id-12345',
    email: 'test@betanalytix.dev',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
} as User;

const isMockMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    return process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
};

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<ApiResponse<User>>;
    signUp: (email: string, password: string, fullName?: string) => Promise<ApiResponse<User>>;
    signOut: () => Promise<ApiResponse<null>>;
    isMockMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider(props: { children: ReactNode }): ReactNode {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    const supabase = getSupabaseClient();
    const mockMode = isMockMode();

    useEffect(() => {
        if (mockMode) {
            setState({ user: MOCK_USER, loading: false, error: null });
            return;
        }

        if (!supabase) {
            setState({ user: null, loading: false, error: 'Supabase not configured' });
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({ user: session?.user ?? null, loading: false, error: null });
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setState(prev => ({ ...prev, user: session?.user ?? null }));
        });

        return () => subscription.unsubscribe();
    }, [supabase, mockMode]);

    const signIn = useCallback(async (email: string, password: string): Promise<ApiResponse<User>> => {
        if (mockMode) {
            setState({ user: MOCK_USER, loading: false, error: null });
            return { data: MOCK_USER, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                setState(prev => ({ ...prev, loading: false, error: error.message }));
                return { data: null, error: error.message, success: false };
            }

            setState({ user: data.user, loading: false, error: null });
            return { data: data.user, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign in failed';
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { data: null, error: message, success: false };
        }
    }, [supabase, mockMode]);

    const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<ApiResponse<User>> => {
        if (mockMode) {
            setState({ user: MOCK_USER, loading: false, error: null });
            return { data: MOCK_USER, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } },
            });

            if (error) {
                setState(prev => ({ ...prev, loading: false, error: error.message }));
                return { data: null, error: error.message, success: false };
            }

            setState({ user: data.user, loading: false, error: null });
            return { data: data.user, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign up failed';
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { data: null, error: message, success: false };
        }
    }, [supabase, mockMode]);

    const signOut = useCallback(async (): Promise<ApiResponse<null>> => {
        if (mockMode) {
            setState({ user: null, loading: false, error: null });
            return { data: null, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setState(prev => ({ ...prev, loading: true }));

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                setState(prev => ({ ...prev, loading: false, error: error.message }));
                return { data: null, error: error.message, success: false };
            }

            setState({ user: null, loading: false, error: null });
            return { data: null, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign out failed';
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { data: null, error: message, success: false };
        }
    }, [supabase, mockMode]);

    const contextValue: AuthContextType = {
        ...state,
        signIn,
        signUp,
        signOut,
        isMockMode: mockMode,
    };

    // Using createElement to avoid JSX parsing issues
    return createElement(AuthContext.Provider, { value: contextValue }, props.children);
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

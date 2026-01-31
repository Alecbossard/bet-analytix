'use client';

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Bankroll, BankrollInsert, BankrollUpdate, ApiResponse } from '@/types';

// Mock user ID for testing without Supabase auth
const MOCK_USER_ID = 'mock-user-id-12345';
const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

export function useBankroll() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabaseClient();

    /**
     * Fetch all bankrolls for the current user
     */
    const getBankrolls = useCallback(async (): Promise<ApiResponse<Bankroll[]>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: supabaseError } = await supabase
                .from('bankrolls')
                .select('*')
                .order('created_at', { ascending: false });

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as Bankroll[], error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bankrolls';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Get a single bankroll by ID
     */
    const getBankroll = useCallback(async (id: string): Promise<ApiResponse<Bankroll>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: supabaseError } = await supabase
                .from('bankrolls')
                .select('*')
                .eq('id', id)
                .single();

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as Bankroll, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bankroll';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Create a new bankroll
     */
    const createBankroll = useCallback(async (bankroll: Omit<BankrollInsert, 'user_id'>): Promise<ApiResponse<Bankroll>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            // Get user ID - use mock ID in mock mode, otherwise get from Supabase auth
            let userId: string;

            if (isMockMode()) {
                userId = MOCK_USER_ID;
            } else {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    const message = 'You must be logged in to create a bankroll';
                    setError(message);
                    return { data: null, error: message, success: false };
                }
                userId = user.id;
            }

            const newBankroll: BankrollInsert = {
                ...bankroll,
                user_id: userId,
                current_capital: bankroll.initial_capital, // Initialize current = initial
            };

            const { data, error: supabaseError } = await supabase
                .from('bankrolls')
                .insert(newBankroll)
                .select()
                .single();

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as Bankroll, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create bankroll';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Update an existing bankroll
     */
    const updateBankroll = useCallback(async (id: string, updates: BankrollUpdate): Promise<ApiResponse<Bankroll>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: supabaseError } = await supabase
                .from('bankrolls')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as Bankroll, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update bankroll';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Delete a bankroll
     */
    const deleteBankroll = useCallback(async (id: string): Promise<ApiResponse<null>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { error: supabaseError } = await supabase
                .from('bankrolls')
                .delete()
                .eq('id', id);

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: null, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete bankroll';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    return {
        loading,
        error,
        getBankrolls,
        getBankroll,
        createBankroll,
        updateBankroll,
        deleteBankroll,
    };
}

'use client';

import { useCallback, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ApiResponse, PublicProfile, PublicBankroll } from '@/types';

const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

// Mock data for testing
const MOCK_PROFILE: PublicProfile = {
    id: 'mock-user-id',
    username: 'demo_tipster',
    full_name: 'Demo Tipster',
    avatar_url: null,
    bio: 'Professional sports bettor sharing my picks and analysis.',
    created_at: '2024-01-01T00:00:00Z',
    stats: {
        total_bets: 156,
        won_bets: 98,
        lost_bets: 58,
        total_profit: 2450.50,
        win_rate: 62.82,
    },
    followers: 234,
    following: 12,
};

const MOCK_BANKROLLS: PublicBankroll[] = [
    {
        id: 'mock-bankroll-1',
        name: 'NFL Season 2024',
        currency: 'USD',
        initial_capital: 1000,
        current_capital: 1850,
        created_at: '2024-09-01T00:00:00Z',
        profit: 850,
        roi: 85,
    },
    {
        id: 'mock-bankroll-2',
        name: 'NBA Picks',
        currency: 'USD',
        initial_capital: 500,
        current_capital: 720,
        created_at: '2024-10-15T00:00:00Z',
        profit: 220,
        roi: 44,
    },
];

export function useSocial() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabaseClient();

    /**
     * Get public profile by username
     */
    const getPublicProfile = useCallback(async (
        username: string
    ): Promise<ApiResponse<PublicProfile>> => {
        if (isMockMode()) {
            return {
                data: { ...MOCK_PROFILE, username },
                error: null,
                success: true
            };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('get_public_profile', { p_username: username });

            if (rpcError) {
                setError(rpcError.message);
                return { data: null, error: rpcError.message, success: false };
            }

            if (data?.error) {
                return { data: null, error: data.error, success: false };
            }

            return { data: data as PublicProfile, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch profile';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Get public bankrolls by username
     */
    const getPublicBankrolls = useCallback(async (
        username: string
    ): Promise<ApiResponse<PublicBankroll[]>> => {
        if (isMockMode()) {
            return { data: MOCK_BANKROLLS, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('get_public_bankrolls', { p_username: username });

            if (rpcError) {
                return { data: null, error: rpcError.message, success: false };
            }

            return { data: data as PublicBankroll[], error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bankrolls';
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Follow a user
     */
    const followUser = useCallback(async (
        userId: string
    ): Promise<ApiResponse<null>> => {
        if (isMockMode()) {
            return { data: null, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        try {
            const { error: insertError } = await supabase
                .from('follows')
                .insert({ following_id: userId });

            if (insertError) {
                return { data: null, error: insertError.message, success: false };
            }

            return { data: null, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to follow user';
            return { data: null, error: message, success: false };
        }
    }, [supabase]);

    /**
     * Unfollow a user
     */
    const unfollowUser = useCallback(async (
        userId: string
    ): Promise<ApiResponse<null>> => {
        if (isMockMode()) {
            return { data: null, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        try {
            const { error: deleteError } = await supabase
                .from('follows')
                .delete()
                .eq('following_id', userId);

            if (deleteError) {
                return { data: null, error: deleteError.message, success: false };
            }

            return { data: null, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unfollow user';
            return { data: null, error: message, success: false };
        }
    }, [supabase]);

    /**
     * Check if current user is following another user
     */
    const isFollowing = useCallback(async (
        userId: string
    ): Promise<boolean> => {
        if (isMockMode()) {
            return false;
        }

        if (!supabase) {
            return false;
        }

        try {
            const { data } = await supabase
                .rpc('is_following', { p_following_id: userId });

            return data === true;
        } catch {
            return false;
        }
    }, [supabase]);

    return {
        loading,
        error,
        getPublicProfile,
        getPublicBankrolls,
        followUser,
        unfollowUser,
        isFollowing,
    };
}

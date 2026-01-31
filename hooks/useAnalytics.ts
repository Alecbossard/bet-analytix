'use client';

import { useCallback, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ApiResponse } from '@/types';

export interface BankrollStats {
    total_bets: number;
    won_bets: number;
    lost_bets: number;
    pending_bets: number;
    total_staked: number;
    total_returns: number;
    total_profit: number;
    win_rate: number;
    roi: number;
    roc: number;
    avg_odds: number;
    avg_stake: number;
}

export interface BalancePoint {
    date: string;
    balance: number;
}

// Mock stats for testing without Supabase
const MOCK_STATS: BankrollStats = {
    total_bets: 24,
    won_bets: 14,
    lost_bets: 8,
    pending_bets: 2,
    total_staked: 1200,
    total_returns: 1450,
    total_profit: 250,
    win_rate: 63.64,
    roi: 20.83,
    roc: 25.0,
    avg_odds: 1.95,
    avg_stake: 50,
};

// Mock balance history
const MOCK_HISTORY: BalancePoint[] = [
    { date: '2024-01-01', balance: 1000 },
    { date: '2024-01-05', balance: 1080 },
    { date: '2024-01-10', balance: 1020 },
    { date: '2024-01-15', balance: 1150 },
    { date: '2024-01-20', balance: 1100 },
    { date: '2024-01-25', balance: 1200 },
    { date: '2024-01-30', balance: 1250 },
];

const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

export function useAnalytics() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabaseClient();

    /**
     * Get bankroll statistics via RPC
     */
    const getBankrollStats = useCallback(async (
        bankrollId: string
    ): Promise<ApiResponse<BankrollStats>> => {
        if (isMockMode()) {
            // Return mock data with slight variations
            return {
                data: { ...MOCK_STATS, total_profit: Math.random() * 500 - 100 },
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
                .rpc('get_bankroll_stats', { p_bankroll_id: bankrollId });

            if (rpcError) {
                setError(rpcError.message);
                return { data: null, error: rpcError.message, success: false };
            }

            return { data: data as BankrollStats, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch stats';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Get balance history via RPC
     */
    const getBalanceHistory = useCallback(async (
        bankrollId: string,
        days: number = 30
    ): Promise<ApiResponse<BalancePoint[]>> => {
        if (isMockMode()) {
            return { data: MOCK_HISTORY, error: null, success: true };
        }

        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('get_balance_history', {
                    p_bankroll_id: bankrollId,
                    p_days: days
                });

            if (rpcError) {
                setError(rpcError.message);
                return { data: null, error: rpcError.message, success: false };
            }

            return { data: data as BalancePoint[], error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch history';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    return {
        loading,
        error,
        getBankrollStats,
        getBalanceHistory,
    };
}

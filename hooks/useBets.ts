'use client';

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type {
    Bet,
    BetLeg,
    BetInsert,
    BetLegInsert,
    BetStatus,
    ApiResponse,
    Sport,
    Bookmaker
} from '@/types';

// Mock user ID for testing without Supabase auth
const MOCK_USER_ID = 'mock-user-id-12345';
const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

// Extended bet type with relations
export interface BetWithLegs extends Bet {
    bet_legs?: BetLeg[];
    bankroll?: { name: string; currency: string };
    bookmaker?: { name: string } | null;
}

export function useBets() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = getSupabaseClient();

    /**
     * Fetch all bets for the current user, optionally filtered by bankroll
     */
    const getBets = useCallback(async (bankrollId?: string): Promise<ApiResponse<BetWithLegs[]>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('bets')
                .select(`
          *,
          bet_legs (*),
          bankroll:bankrolls (name, currency),
          bookmaker:bookmakers (name)
        `)
                .order('placed_at', { ascending: false });

            if (bankrollId) {
                query = query.eq('bankroll_id', bankrollId);
            }

            const { data, error: supabaseError } = await query;

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as BetWithLegs[], error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bets';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Fetch a single bet by ID with all relations
     */
    const getBetById = useCallback(async (betId: string): Promise<ApiResponse<BetWithLegs>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: supabaseError } = await supabase
                .from('bets')
                .select(`
                    *,
                    bet_legs (*),
                    bankroll:bankrolls (name, currency),
                    bookmaker:bookmakers (name)
                `)
                .eq('id', betId)
                .single();

            if (supabaseError) {
                setError(supabaseError.message);
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as BetWithLegs, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bet';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Get sports list for dropdown
     */
    const getSports = useCallback(async (): Promise<ApiResponse<Sport[]>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        try {
            const { data, error: supabaseError } = await supabase
                .from('sports')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (supabaseError) {
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as Sport[], error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sports';
            return { data: null, error: message, success: false };
        }
    }, [supabase]);

    /**
     * Get bookmakers list for dropdown
     */
    const getBookmakers = useCallback(async (): Promise<ApiResponse<Bookmaker[]>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        try {
            const { data, error: supabaseError } = await supabase
                .from('bookmakers')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (supabaseError) {
                return { data: null, error: supabaseError.message, success: false };
            }

            return { data: data as Bookmaker[], error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch bookmakers';
            return { data: null, error: message, success: false };
        }
    }, [supabase]);

    /**
     * Create a new bet with optional legs (for accumulators)
     */
    const createBet = useCallback(async (
        bet: Omit<BetInsert, 'user_id'>,
        legs?: Omit<BetLegInsert, 'bet_id'>[]
    ): Promise<ApiResponse<Bet>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            // Get user ID
            let userId: string;

            if (isMockMode()) {
                userId = MOCK_USER_ID;
            } else {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    const message = 'You must be logged in to create a bet';
                    setError(message);
                    return { data: null, error: message, success: false };
                }
                userId = user.id;
            }

            // Calculate total odds for accumulator
            let totalOdds = bet.total_odds;
            if (bet.bet_type === 'accumulator' && legs && legs.length > 0) {
                totalOdds = legs.reduce((acc, leg) => acc * leg.odds, 1);
            }

            // Insert bet
            const newBet: BetInsert = {
                ...bet,
                user_id: userId,
                total_odds: totalOdds,
            };

            const { data: betData, error: betError } = await supabase
                .from('bets')
                .insert(newBet)
                .select()
                .single();

            if (betError) {
                setError(betError.message);
                return { data: null, error: betError.message, success: false };
            }

            // Insert legs if provided (for accumulator bets)
            if (legs && legs.length > 0) {
                const legsToInsert: BetLegInsert[] = legs.map(leg => ({
                    ...leg,
                    bet_id: betData.id,
                }));

                const { error: legsError } = await supabase
                    .from('bet_legs')
                    .insert(legsToInsert);

                if (legsError) {
                    // Rollback: delete the bet if legs insertion failed
                    await supabase.from('bets').delete().eq('id', betData.id);
                    setError(legsError.message);
                    return { data: null, error: legsError.message, success: false };
                }
            }

            return { data: betData as Bet, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create bet';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Settle a bet (mark as won/lost/void)
     * This triggers the database function to update bankroll balance
     */
    const settleBet = useCallback(async (
        betId: string,
        status: BetStatus,
        actualReturn?: number
    ): Promise<ApiResponse<Bet>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            // Get the bet to calculate actual return if not provided
            const { data: existingBet, error: fetchError } = await supabase
                .from('bets')
                .select('stake, potential_return')
                .eq('id', betId)
                .single();

            if (fetchError) {
                setError(fetchError.message);
                return { data: null, error: fetchError.message, success: false };
            }

            // Calculate actual return based on status
            let returnAmount = actualReturn;
            if (returnAmount === undefined) {
                if (status === 'won') {
                    returnAmount = existingBet.potential_return;
                } else if (status === 'lost') {
                    returnAmount = 0;
                } else if (status === 'void') {
                    returnAmount = existingBet.stake; // Return stake on void
                } else {
                    returnAmount = 0;
                }
            }

            const { data, error: updateError } = await supabase
                .from('bets')
                .update({
                    status,
                    actual_return: returnAmount,
                    settled_at: new Date().toISOString(),
                })
                .eq('id', betId)
                .select()
                .single();

            if (updateError) {
                setError(updateError.message);
                return { data: null, error: updateError.message, success: false };
            }

            return { data: data as Bet, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to settle bet';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    /**
     * Delete a bet
     */
    const deleteBet = useCallback(async (betId: string): Promise<ApiResponse<null>> => {
        if (!supabase) {
            return { data: null, error: 'Supabase not configured', success: false };
        }

        setLoading(true);
        setError(null);

        try {
            // Legs will be cascade deleted due to foreign key constraint
            const { error: deleteError } = await supabase
                .from('bets')
                .delete()
                .eq('id', betId);

            if (deleteError) {
                setError(deleteError.message);
                return { data: null, error: deleteError.message, success: false };
            }

            return { data: null, error: null, success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete bet';
            setError(message);
            return { data: null, error: message, success: false };
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    return {
        loading,
        error,
        getBets,
        getBetById,
        getSports,
        getBookmakers,
        createBet,
        settleBet,
        deleteBet,
    };
}

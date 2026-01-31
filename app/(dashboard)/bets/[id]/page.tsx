'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBets, BetWithLegs } from '@/hooks/useBets';
import type { BetStatus } from '@/types';

const STATUS_COLORS: Record<BetStatus, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    won: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    lost: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    void: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
    cashout: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    half_won: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
    half_lost: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};

export default function BetDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { getBetById, settleBet, loading } = useBets();

    const [bet, setBet] = useState<BetWithLegs | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settling, setSettling] = useState(false);

    const betId = params.id as string;

    const fetchBet = useCallback(async () => {
        if (!betId) return;

        const result = await getBetById(betId);
        if (result.success && result.data) {
            setBet(result.data);
        } else {
            setError(result.error || 'Bet not found');
        }
    }, [betId, getBetById]);

    useEffect(() => {
        fetchBet();
    }, [fetchBet]);

    const handleSettle = async (status: BetStatus) => {
        if (!bet) return;
        setSettling(true);

        const result = await settleBet(bet.id, status);
        if (result.success) {
            await fetchBet(); // Refresh bet data
        }
        setSettling(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCurrency = () => bet?.bankroll?.currency || 'USD';

    if (loading && !bet) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading bet details...
                </div>
            </div>
        );
    }

    if (error || !bet) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Bet Not Found</h1>
                        <p className="text-gray-400 mb-8">{error || 'The bet you are looking for does not exist.'}</p>
                        <Link
                            href="/bets"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Bets
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const statusStyle = STATUS_COLORS[bet.status];
    const hasLegs = bet.bet_legs && bet.bet_legs.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">Bet Details</h1>
                            <p className="text-sm text-gray-400">
                                {bet.bet_type === 'accumulator' ? `${bet.bet_legs?.length}-Fold Accumulator` : 'Single Bet'}
                            </p>
                        </div>
                        <span
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium uppercase ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                        >
                            {bet.status}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Main Info Card */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Odds</p>
                            <p className="text-2xl font-bold text-white font-mono">{bet.total_odds.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Stake</p>
                            <p className="text-2xl font-bold text-white font-mono">{getCurrency()} {bet.stake.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Potential Return</p>
                            <p className="text-2xl font-bold text-blue-400 font-mono">{getCurrency()} {bet.potential_return.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Profit/Loss</p>
                            <p className={`text-2xl font-bold font-mono ${bet.profit_loss > 0 ? 'text-green-400' : bet.profit_loss < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                {bet.profit_loss >= 0 ? '+' : ''}{getCurrency()} {bet.profit_loss.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-gray-700/50">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Placed At</p>
                            <p className="text-white">{formatDate(bet.placed_at)}</p>
                        </div>
                        {bet.settled_at && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Settled At</p>
                                <p className="text-white">{formatDate(bet.settled_at)}</p>
                            </div>
                        )}
                        {bet.bankroll && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Bankroll</p>
                                <p className="text-white">{bet.bankroll.name}</p>
                            </div>
                        )}
                        {bet.bookmaker && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Bookmaker</p>
                                <p className="text-white">{bet.bookmaker.name}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selections / Legs */}
                {hasLegs && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            {bet.bet_type === 'accumulator' ? 'Selections' : 'Selection'}
                        </h2>
                        <div className="space-y-3">
                            {bet.bet_legs!.map((leg, idx) => (
                                <div
                                    key={leg.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {bet.bet_type === 'accumulator' && (
                                                <span className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 text-xs flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                            )}
                                            <p className="font-medium text-white">{leg.event_name}</p>
                                        </div>
                                        <p className="text-gray-400 text-sm">{leg.selection}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-mono font-semibold">{leg.odds.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {bet.notes && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-3">Notes</h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{bet.notes}</p>
                    </div>
                )}

                {/* Actions */}
                {bet.status === 'pending' && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Settle Bet</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleSettle('won')}
                                disabled={settling}
                                className="flex-1 min-w-[120px] px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 disabled:opacity-50 transition-colors"
                            >
                                Mark Won
                            </button>
                            <button
                                onClick={() => handleSettle('lost')}
                                disabled={settling}
                                className="flex-1 min-w-[120px] px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
                            >
                                Mark Lost
                            </button>
                            <button
                                onClick={() => handleSettle('void')}
                                disabled={settling}
                                className="flex-1 min-w-[120px] px-6 py-3 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-500 disabled:opacity-50 transition-colors"
                            >
                                Void
                            </button>
                            <button
                                onClick={() => handleSettle('cashout')}
                                disabled={settling}
                                className="flex-1 min-w-[120px] px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
                            >
                                Cash Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <div className="flex gap-4">
                    <Link
                        href="/bets"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800/50 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Bets
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
                    >
                        Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}

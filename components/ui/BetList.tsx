'use client';

import { useState } from 'react';
import type { BetWithLegs } from '@/hooks/useBets';
import type { BetStatus } from '@/types';

interface BetListProps {
    bets: BetWithLegs[];
    onSettle: (betId: string, status: BetStatus) => void;
    onDelete?: (betId: string) => void;
    loading?: boolean;
}

const STATUS_COLORS: Record<BetStatus, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    won: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    lost: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    void: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
    cashout: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    half_won: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
    half_lost: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};

export function BetList({ bets, onSettle, onDelete, loading }: BetListProps) {
    const [expandedBet, setExpandedBet] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading bets...
                </div>
            </div>
        );
    }

    if (bets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No bets yet</h3>
                <p className="text-gray-400 text-sm">Start tracking your bets by adding your first one</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getCurrency = (bet: BetWithLegs) => {
        return bet.bankroll?.currency || 'USD';
    };

    return (
        <div className="space-y-3">
            {bets.map((bet) => {
                const statusStyle = STATUS_COLORS[bet.status];
                const isExpanded = expandedBet === bet.id;
                const hasLegs = bet.bet_legs && bet.bet_legs.length > 0;

                return (
                    <div
                        key={bet.id}
                        className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden"
                    >
                        {/* Main row - responsive layout */}
                        <div
                            className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                            onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                        >
                            {/* Mobile: Stack layout */}
                            <div className="flex items-center justify-between mb-2 md:hidden">
                                <span
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                                >
                                    {bet.status}
                                </span>
                                <div className="flex items-center gap-2">
                                    {bet.bet_type === 'accumulator' && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                            ACCA
                                        </span>
                                    )}
                                    <svg
                                        className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Mobile: Selection */}
                            <div className="md:hidden mb-3">
                                <p className="font-medium text-white">
                                    {bet.bet_type === 'accumulator' && hasLegs
                                        ? `${bet.bet_legs?.length}-Fold Accumulator`
                                        : bet.bet_legs?.[0]?.event_name || 'Bet'}
                                </p>
                                {bet.bet_type === 'single' && bet.bet_legs?.[0] && (
                                    <p className="text-sm text-gray-400">{bet.bet_legs[0].selection}</p>
                                )}
                            </div>

                            {/* Mobile: Stats row */}
                            <div className="flex items-center justify-between md:hidden">
                                <div className="flex gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Odds: </span>
                                        <span className="text-white font-mono">{bet.total_odds.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Stake: </span>
                                        <span className="text-white font-mono">{getCurrency(bet)} {bet.stake.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {bet.status === 'won' ? (
                                        <span className="text-green-400 font-mono font-semibold">
                                            +{bet.profit_loss.toFixed(2)}
                                        </span>
                                    ) : bet.status === 'lost' ? (
                                        <span className="text-red-400 font-mono font-semibold">
                                            -{bet.stake.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 font-mono">
                                            {bet.potential_return.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Desktop: Original horizontal layout */}
                            <div className="hidden md:flex items-center gap-4">
                                {/* Status badge */}
                                <span
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                                >
                                    {bet.status}
                                </span>

                                {/* Selection/Match info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white truncate">
                                            {bet.bet_type === 'accumulator' && hasLegs
                                                ? `${bet.bet_legs?.length}-Fold Accumulator`
                                                : bet.bet_legs?.[0]?.event_name || 'Bet'}
                                        </span>
                                        {bet.bet_type === 'accumulator' && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                                ACCA
                                            </span>
                                        )}
                                    </div>
                                    {bet.bet_type === 'single' && bet.bet_legs?.[0] && (
                                        <p className="text-sm text-gray-400 truncate">{bet.bet_legs[0].selection}</p>
                                    )}
                                </div>

                                {/* Odds */}
                                <div className="text-right">
                                    <p className="text-white font-mono">{bet.total_odds.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">odds</p>
                                </div>

                                {/* Stake */}
                                <div className="text-right">
                                    <p className="text-white font-mono">{getCurrency(bet)} {bet.stake.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">stake</p>
                                </div>

                                {/* Potential/Actual Return */}
                                <div className="text-right min-w-[80px]">
                                    {bet.status === 'won' ? (
                                        <p className="text-green-400 font-mono font-semibold">
                                            +{getCurrency(bet)} {bet.profit_loss.toFixed(2)}
                                        </p>
                                    ) : bet.status === 'lost' ? (
                                        <p className="text-red-400 font-mono font-semibold">
                                            -{getCurrency(bet)} {bet.stake.toFixed(2)}
                                        </p>
                                    ) : (
                                        <p className="text-gray-300 font-mono">
                                            {getCurrency(bet)} {bet.potential_return.toFixed(2)}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {bet.status === 'pending' ? 'potential' : 'return'}
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="text-gray-500 text-sm text-right min-w-[80px]">
                                    {formatDate(bet.placed_at)}
                                </div>

                                {/* Expand arrow */}
                                <svg
                                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-700/50">
                                {/* Legs */}
                                {hasLegs && bet.bet_legs!.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Selections</p>
                                        {bet.bet_legs!.map((leg, idx) => (
                                            <div
                                                key={leg.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                                            >
                                                <div>
                                                    <p className="text-white text-sm">{leg.event_name}</p>
                                                    <p className="text-gray-400 text-xs">{leg.selection}</p>
                                                </div>
                                                <span className="text-white font-mono text-sm">{leg.odds.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Notes */}
                                {bet.notes && (
                                    <div className="mt-4 p-3 rounded-lg bg-gray-800/50">
                                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                                        <p className="text-gray-300 text-sm">{bet.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4 flex items-center gap-2">
                                    {bet.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSettle(bet.id, 'won');
                                                }}
                                                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 transition-colors"
                                            >
                                                Mark Won
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSettle(bet.id, 'lost');
                                                }}
                                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
                                            >
                                                Mark Lost
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSettle(bet.id, 'void');
                                                }}
                                                className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-500 transition-colors"
                                            >
                                                Void
                                            </button>
                                        </>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(bet.id);
                                            }}
                                            className="ml-auto px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

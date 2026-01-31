'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBankroll } from '@/hooks/useBankroll';
import { useAnalytics, BankrollStats, BalancePoint } from '@/hooks/useAnalytics';
import { useBets, BetWithLegs } from '@/hooks/useBets';
import { KPICard } from '@/components/ui/KPICard';
import { BankrollChart } from '@/components/charts/BankrollChart';
import { BetList } from '@/components/ui/BetList';
import type { Bankroll, BetStatus } from '@/types';

export default function BankrollDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const { getBankroll, loading: bankrollLoading } = useBankroll();
    const { getBankrollStats, getBalanceHistory, loading: analyticsLoading } = useAnalytics();
    const { getBets, settleBet, loading: betsLoading } = useBets();

    const [bankroll, setBankroll] = useState<Bankroll | null>(null);
    const [stats, setStats] = useState<BankrollStats | null>(null);
    const [history, setHistory] = useState<BalancePoint[]>([]);
    const [bets, setBets] = useState<BetWithLegs[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const bankrollId = params.id as string;

    const fetchBankroll = useCallback(async () => {
        if (!bankrollId) return;

        const result = await getBankroll(bankrollId);
        if (result.success && result.data) {
            setBankroll(result.data);
        } else {
            setError(result.error || 'Bankroll not found');
        }
    }, [bankrollId, getBankroll]);

    const fetchAnalytics = useCallback(async () => {
        if (!bankrollId) return;

        const [statsRes, historyRes, betsRes] = await Promise.all([
            getBankrollStats(bankrollId),
            getBalanceHistory(bankrollId, 30),
            getBets(bankrollId),
        ]);

        if (statsRes.success && statsRes.data) {
            setStats(statsRes.data);
        }
        if (historyRes.success && historyRes.data) {
            setHistory(historyRes.data);
        }
        if (betsRes.success && betsRes.data) {
            setBets(betsRes.data);
        }
    }, [bankrollId, refreshKey, getBankrollStats, getBalanceHistory, getBets]);

    useEffect(() => {
        fetchBankroll();
    }, [fetchBankroll]);

    useEffect(() => {
        if (bankroll) {
            fetchAnalytics();
        }
    }, [bankroll, fetchAnalytics]);

    const handleSettle = async (betId: string, status: BetStatus) => {
        const result = await settleBet(betId, status);
        if (result.success) {
            setRefreshKey(prev => prev + 1);
            fetchBankroll(); // Refresh bankroll balance
        }
    };

    const getTrend = (value: number): 'positive' | 'negative' | 'neutral' => {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return 'neutral';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    if (bankrollLoading && !bankroll) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading bankroll...
                </div>
            </div>
        );
    }

    if (error || !bankroll) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Bankroll Not Found</h1>
                        <p className="text-gray-400 mb-8">{error || 'The bankroll you are looking for does not exist.'}</p>
                        <Link
                            href="/bankrolls"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Bankrolls
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const profitLoss = bankroll.current_capital - bankroll.initial_capital;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                            <h1 className="text-xl font-bold text-white">{bankroll.name}</h1>
                            <p className="text-sm text-gray-400">{bankroll.currency} Bankroll</p>
                        </div>

                        {/* Balance Display */}
                        <div className="text-right mr-4">
                            <p className="text-2xl font-bold text-white font-mono">
                                {bankroll.currency} {formatCurrency(bankroll.current_capital)}
                            </p>
                            <p className={`text-sm font-mono ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                            </p>
                        </div>

                        {/* Settings Button */}
                        <Link
                            href={`/bankrolls/${bankrollId}/edit`}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Edit Bankroll"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KPICard
                        label="Total Profit"
                        value={stats ? (stats.total_profit >= 0 ? '+' : '') + stats.total_profit.toFixed(2) : '—'}
                        suffix={bankroll.currency}
                        trend={stats ? getTrend(stats.total_profit) : 'neutral'}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />

                    <KPICard
                        label="ROI"
                        value={stats?.roi?.toFixed(2) || '0.00'}
                        suffix="%"
                        trend={stats ? getTrend(stats.roi) : 'neutral'}
                        subtext="Return on Investment"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                    />

                    <KPICard
                        label="Win Rate"
                        value={stats?.win_rate?.toFixed(1) || '0.0'}
                        suffix="%"
                        trend={stats && stats.win_rate >= 50 ? 'positive' : stats && stats.win_rate > 0 ? 'negative' : 'neutral'}
                        subtext={`${stats?.won_bets || 0}W / ${stats?.lost_bets || 0}L`}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        }
                    />

                    <KPICard
                        label="Total Bets"
                        value={stats?.total_bets?.toString() || '0'}
                        trend="neutral"
                        subtext={`${stats?.pending_bets || 0} pending`}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                    />
                </div>

                {/* Chart Section */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Bankroll Evolution</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Last 30 days</span>
                        </div>
                    </div>
                    <BankrollChart
                        data={history}
                        currency={bankroll.currency}
                        loading={analyticsLoading}
                    />
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{bankroll.currency} {formatCurrency(bankroll.initial_capital)}</p>
                        <p className="text-sm text-gray-400">Initial Capital</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{stats?.avg_odds?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-400">Avg Odds</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{bankroll.currency} {stats?.avg_stake?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-400">Avg Stake</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{stats?.roc?.toFixed(2) || '0.00'}%</p>
                        <p className="text-sm text-gray-400">ROC</p>
                    </div>
                </div>

                {/* Bets List */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Bets in this Bankroll</h2>
                        <Link
                            href={`/bets?bankroll=${bankrollId}`}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            View All →
                        </Link>
                    </div>
                    <BetList
                        bets={bets}
                        onSettle={handleSettle}
                        loading={betsLoading}
                    />
                </div>

                {/* Description if exists */}
                {bankroll.description && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 mt-8">
                        <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
                        <p className="text-gray-300">{bankroll.description}</p>
                    </div>
                )}

                {/* Back Button */}
                <div className="mt-8 flex gap-4">
                    <Link
                        href="/bankrolls"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800/50 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Bankrolls
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

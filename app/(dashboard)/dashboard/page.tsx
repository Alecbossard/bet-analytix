'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAnalytics, BankrollStats, BalancePoint } from '@/hooks/useAnalytics';
import { useBankroll } from '@/hooks/useBankroll';
import { useBets, BetWithLegs } from '@/hooks/useBets';
import { KPICard } from '@/components/ui/KPICard';
import { BankrollChart } from '@/components/charts/BankrollChart';
import { BetList } from '@/components/ui/BetList';
import type { Bankroll, BetStatus } from '@/types';

export default function DashboardPage() {
    const { getBankrollStats, getBalanceHistory, loading: analyticsLoading } = useAnalytics();
    const { getBankrolls } = useBankroll();
    const { getBets, settleBet, loading: betsLoading } = useBets();

    const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
    const [selectedBankroll, setSelectedBankroll] = useState<string>('');
    const [stats, setStats] = useState<BankrollStats | null>(null);
    const [history, setHistory] = useState<BalancePoint[]>([]);
    const [recentBets, setRecentBets] = useState<BetWithLegs[]>([]);
    const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger

    const fetchBankrolls = useCallback(async () => {
        const result = await getBankrolls();
        if (result.success && result.data) {
            setBankrolls(result.data);
            if (result.data.length > 0 && !selectedBankroll) {
                setSelectedBankroll(result.data[0].id);
            }
        }
    }, [getBankrolls, selectedBankroll]);

    const fetchAnalytics = useCallback(async () => {
        if (!selectedBankroll) return;

        const [statsRes, historyRes, betsRes] = await Promise.all([
            getBankrollStats(selectedBankroll),
            getBalanceHistory(selectedBankroll, 30),
            getBets(selectedBankroll),
        ]);

        if (statsRes.success && statsRes.data) {
            setStats(statsRes.data);
        }
        if (historyRes.success && historyRes.data) {
            setHistory(historyRes.data);
        }
        if (betsRes.success && betsRes.data) {
            setRecentBets(betsRes.data.slice(0, 5));
        }
    }, [selectedBankroll, refreshKey, getBankrollStats, getBalanceHistory, getBets]);

    useEffect(() => {
        fetchBankrolls();
    }, [fetchBankrolls]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleSettle = async (betId: string, status: BetStatus) => {
        const result = await settleBet(betId, status);
        if (result.success) {
            // Trigger refresh by incrementing key
            setRefreshKey(prev => prev + 1);
        }
    };

    const selectedBankrollData = bankrolls.find(b => b.id === selectedBankroll);
    const currency = selectedBankrollData?.currency || 'USD';

    const getTrend = (value: number): 'positive' | 'negative' | 'neutral' => {
        if (value > 0) return 'positive';
        if (value < 0) return 'negative';
        return 'neutral';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                            <p className="text-sm text-gray-400">Your betting performance at a glance</p>
                        </div>

                        {/* Bankroll Selector */}
                        <select
                            value={selectedBankroll}
                            onChange={(e) => setSelectedBankroll(e.target.value)}
                            className="px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {bankrolls.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} ({b.currency})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KPICard
                        label="Total Profit"
                        value={stats ? (stats.total_profit >= 0 ? '+' : '') + stats.total_profit.toFixed(2) : '—'}
                        suffix={currency}
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
                        label="ROC"
                        value={stats?.roc?.toFixed(2) || '0.00'}
                        suffix="%"
                        trend={stats ? getTrend(stats.roc) : 'neutral'}
                        subtext="Return on Capital"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                        currency={currency}
                        loading={analyticsLoading}
                    />
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{stats?.total_bets || 0}</p>
                        <p className="text-sm text-gray-400">Total Bets</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-amber-400">{stats?.pending_bets || 0}</p>
                        <p className="text-sm text-gray-400">Pending</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{stats?.avg_odds?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-400">Avg Odds</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{currency} {stats?.avg_stake?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-400">Avg Stake</p>
                    </div>
                </div>

                {/* Recent Bets */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Recent Bets</h2>
                        <a
                            href="/bets"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            View All →
                        </a>
                    </div>
                    <BetList
                        bets={recentBets}
                        onSettle={handleSettle}
                        loading={betsLoading}
                    />
                </div>
            </main>
        </div>
    );
}

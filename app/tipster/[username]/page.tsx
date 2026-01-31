'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSocial } from '@/hooks/useSocial';
import { useAnalytics, BalancePoint } from '@/hooks/useAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { KPICard } from '@/components/ui/KPICard';
import { BankrollChart } from '@/components/charts/BankrollChart';
import type { PublicProfile, PublicBankroll } from '@/types';

export default function TipsterProfilePage() {
    const params = useParams();
    const username = params.username as string;

    const { user } = useAuth();
    const { getPublicProfile, getPublicBankrolls, followUser, unfollowUser, isFollowing, loading } = useSocial();
    const { getBalanceHistory } = useAnalytics();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [bankrolls, setBankrolls] = useState<PublicBankroll[]>([]);
    const [selectedBankroll, setSelectedBankroll] = useState<string>('');
    const [history, setHistory] = useState<BalancePoint[]>([]);
    const [following, setFollowing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        const result = await getPublicProfile(username);
        if (result.success && result.data) {
            setProfile(result.data);
            // Check if current user is following
            if (user && result.data.id !== user.id) {
                const isFollow = await isFollowing(result.data.id);
                setFollowing(isFollow);
            }
        } else {
            setError(result.error || 'Profile not found');
        }
    }, [username, getPublicProfile, user, isFollowing]);

    const fetchBankrolls = useCallback(async () => {
        const result = await getPublicBankrolls(username);
        if (result.success && result.data) {
            setBankrolls(result.data);
            if (result.data.length > 0) {
                setSelectedBankroll(result.data[0].id);
            }
        }
    }, [username, getPublicBankrolls]);

    const fetchHistory = useCallback(async () => {
        if (!selectedBankroll) return;
        const result = await getBalanceHistory(selectedBankroll, 30);
        if (result.success && result.data) {
            setHistory(result.data);
        }
    }, [selectedBankroll, getBalanceHistory]);

    useEffect(() => {
        fetchProfile();
        fetchBankrolls();
    }, [fetchProfile, fetchBankrolls]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleFollow = async () => {
        if (!profile) return;
        if (following) {
            const result = await unfollowUser(profile.id);
            if (result.success) {
                setFollowing(false);
                setProfile(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
            }
        } else {
            const result = await followUser(profile.id);
            if (result.success) {
                setFollowing(true);
                setProfile(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
            }
        }
    };

    const selectedBankrollData = bankrolls.find(b => b.id === selectedBankroll);
    const currency = selectedBankrollData?.currency || 'USD';

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Profile Not Available</h1>
                    <p className="text-gray-400">{error}</p>
                    <a href="/dashboard" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading && !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-gray-400">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Profile Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
                            {profile?.full_name?.[0] || profile?.username?.[0] || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white">
                                    {profile?.full_name || profile?.username}
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                    Verified Tipster
                                </span>
                            </div>
                            <p className="text-gray-400 mb-3">@{profile?.username}</p>
                            {profile?.bio && (
                                <p className="text-gray-300 mb-4">{profile.bio}</p>
                            )}

                            {/* Follow Stats */}
                            <div className="flex items-center gap-6 text-sm">
                                <div>
                                    <span className="font-bold text-white">{profile?.followers || 0}</span>
                                    <span className="text-gray-400 ml-1">Followers</span>
                                </div>
                                <div>
                                    <span className="font-bold text-white">{profile?.following || 0}</span>
                                    <span className="text-gray-400 ml-1">Following</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {/* Edit Profile - only for own profile */}
                            {user && profile && user.id === profile.id && (
                                <a
                                    href="/settings"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Edit Profile
                                </a>
                            )}

                            {/* Follow Button - only for other users */}
                            {user && profile && user.id !== profile.id && (
                                <button
                                    onClick={handleFollow}
                                    className={`px-6 py-2.5 rounded-lg font-medium transition-all ${following
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-blue-600 text-white hover:bg-blue-500'
                                        }`}
                                >
                                    {following ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* KPI Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <KPICard
                        label="Win Rate"
                        value={profile?.stats.win_rate.toFixed(1) || '0'}
                        suffix="%"
                        trend={profile && profile.stats.win_rate >= 50 ? 'positive' : 'neutral'}
                    />
                    <KPICard
                        label="Total Bets"
                        value={profile?.stats.total_bets || 0}
                        trend="neutral"
                    />
                    <KPICard
                        label="Won"
                        value={profile?.stats.won_bets || 0}
                        trend="positive"
                    />
                    <KPICard
                        label="Lost"
                        value={profile?.stats.lost_bets || 0}
                        trend="negative"
                    />
                </div>

                {/* Public Bankrolls */}
                {bankrolls.length > 0 && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Public Bankrolls</h2>
                            <select
                                value={selectedBankroll}
                                onChange={(e) => setSelectedBankroll(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                            >
                                {bankrolls.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Bankroll Stats */}
                        {selectedBankrollData && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                                    <p className="text-2xl font-bold text-white">
                                        {currency} {selectedBankrollData.current_capital.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-400">Current Balance</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                                    <p className={`text-2xl font-bold ${selectedBankrollData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {selectedBankrollData.profit >= 0 ? '+' : ''}{currency} {selectedBankrollData.profit.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-400">Profit/Loss</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                                    <p className={`text-2xl font-bold ${selectedBankrollData.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {selectedBankrollData.roi >= 0 ? '+' : ''}{selectedBankrollData.roi.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-gray-400">ROI</p>
                                </div>
                            </div>
                        )}

                        {/* Chart */}
                        <BankrollChart
                            data={history}
                            currency={currency}
                            loading={loading}
                        />
                    </div>
                )}

                {/* No public bankrolls */}
                {bankrolls.length === 0 && !loading && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8 text-center">
                        <p className="text-gray-400">This tipster has no public bankrolls yet.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

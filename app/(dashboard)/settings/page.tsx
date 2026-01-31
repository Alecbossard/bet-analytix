'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBankroll } from '@/hooks/useBankroll';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Bankroll } from '@/types';

type OddsFormat = 'decimal' | 'american';

interface ProfileSettings {
    username: string;
    full_name: string;
    bio: string;
    avatar_url: string;
    is_public: boolean;
    odds_format: OddsFormat;
    currency: string;
}

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const { getBankrolls } = useBankroll();
    const supabase = getSupabaseClient();

    const [profile, setProfile] = useState<ProfileSettings>({
        username: '',
        full_name: '',
        bio: '',
        avatar_url: '',
        is_public: false,
        odds_format: 'decimal',
        currency: 'USD',
    });
    const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
            setProfile({
                username: 'demo_tipster',
                full_name: 'Demo User',
                bio: 'Professional sports bettor',
                avatar_url: '',
                is_public: true,
                odds_format: 'decimal',
                currency: 'USD',
            });
        } else if (supabase) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    username: data.username || '',
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    avatar_url: data.avatar_url || '',
                    is_public: data.is_public || false,
                    odds_format: data.odds_format || 'decimal',
                    currency: data.currency || 'USD',
                });
            }
        }

        const bankrollRes = await getBankrolls();
        if (bankrollRes.success && bankrollRes.data) {
            setBankrolls(bankrollRes.data);
        }

        setLoading(false);
    }, [user, supabase, getBankrolls]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
                await new Promise(r => setTimeout(r, 500));
                setMessage({ type: 'success', text: 'Profile saved (mock mode)' });
            } else if (supabase) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        username: profile.username,
                        full_name: profile.full_name,
                        bio: profile.bio,
                        avatar_url: profile.avatar_url,
                        is_public: profile.is_public,
                        odds_format: profile.odds_format,
                        currency: profile.currency,
                    })
                    .eq('id', user.id);

                if (error) {
                    setMessage({ type: 'error', text: error.message });
                } else {
                    setMessage({ type: 'success', text: 'Profile saved successfully!' });
                }
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleBankrollVisibility = async (bankrollId: string, isPublic: boolean) => {
        if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
            setBankrolls(prev => prev.map(b =>
                b.id === bankrollId ? { ...b, is_public: isPublic } : b
            ));
            return;
        }

        if (!supabase) return;

        const { error } = await supabase
            .from('bankrolls')
            .update({ is_public: isPublic })
            .eq('id', bankrollId);

        if (!error) {
            setBankrolls(prev => prev.map(b =>
                b.id === bankrollId ? { ...b, is_public: isPublic } : b
            ));
        }
    };

    const handleSignOut = async () => {
        setLoggingOut(true);
        const result = await signOut();
        if (result.success) {
            window.location.href = '/login';
        }
        setLoggingOut(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-sm text-gray-400">Manage your profile and preferences</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {message && (
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Section */}
                <section className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
                    <div className="grid gap-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={profile.username}
                                    onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))}
                                    placeholder="your_username"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Your public profile URL: /tipster/{profile.username || 'username'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                                placeholder="Tell others about yourself and your betting strategy..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
                            <input
                                type="url"
                                value={profile.avatar_url}
                                onChange={(e) => setProfile(p => ({ ...p, avatar_url: e.target.value }))}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Privacy Section */}
                <section className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Privacy Settings</h2>
                    <div className="flex items-center justify-between py-4 border-b border-gray-700/50">
                        <div>
                            <p className="font-medium text-white">Public Profile</p>
                            <p className="text-sm text-gray-400">Allow others to view your tipster profile</p>
                        </div>
                        <button
                            onClick={() => setProfile(p => ({ ...p, is_public: !p.is_public }))}
                            className={`relative w-14 h-8 rounded-full transition-colors ${profile.is_public ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${profile.is_public ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                    <div className="mt-6">
                        <p className="font-medium text-white mb-4">Bankroll Visibility</p>
                        <p className="text-sm text-gray-400 mb-4">Choose which bankrolls appear on your public profile</p>
                        <div className="space-y-3">
                            {bankrolls.map(bankroll => (
                                <div key={bankroll.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50">
                                    <div>
                                        <p className="font-medium text-white">{bankroll.name}</p>
                                        <p className="text-sm text-gray-400">{bankroll.currency} {bankroll.current_capital.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleBankrollVisibility(bankroll.id, !bankroll.is_public)}
                                        className={`relative w-14 h-8 rounded-full transition-colors ${bankroll.is_public ? 'bg-green-600' : 'bg-gray-700'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${bankroll.is_public ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                            ))}
                            {bankrolls.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No bankrolls yet</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">App Preferences</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Odds Format</label>
                            <select
                                value={profile.odds_format}
                                onChange={(e) => setProfile(p => ({ ...p, odds_format: e.target.value as OddsFormat }))}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="decimal">Decimal (2.50)</option>
                                <option value="american">American (+150)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Default Currency</label>
                            <select
                                value={profile.currency}
                                onChange={(e) => setProfile(p => ({ ...p, currency: e.target.value }))}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="CAD">CAD (C$)</option>
                                <option value="AUD">AUD (A$)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Danger Zone - Sign Out */}
                <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                    <p className="text-gray-400 mb-4">Sign out of your account on this device.</p>
                    <button
                        onClick={handleSignOut}
                        disabled={loggingOut}
                        className="w-full px-6 py-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {loggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                </section>
            </main>
        </div>
    );
}

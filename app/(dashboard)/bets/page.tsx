'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBets, BetWithLegs } from '@/hooks/useBets';
import { useBankroll } from '@/hooks/useBankroll';
import { AddBetForm } from '@/components/forms/AddBetForm';
import { BetList } from '@/components/ui/BetList';
import type { Bankroll, BetStatus } from '@/types';

export default function BetsPage() {
    const { getBets, settleBet, deleteBet, loading } = useBets();
    const { getBankrolls } = useBankroll();

    const [bets, setBets] = useState<BetWithLegs[]>([]);
    const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedBankroll, setSelectedBankroll] = useState<string>('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchBets = useCallback(async () => {
        const result = await getBets(selectedBankroll || undefined);
        if (result.success && result.data) {
            setBets(result.data);
        }
    }, [getBets, selectedBankroll]);

    const fetchBankrolls = useCallback(async () => {
        const result = await getBankrolls();
        if (result.success && result.data) {
            setBankrolls(result.data);
        }
    }, [getBankrolls]);

    useEffect(() => {
        fetchBankrolls();
    }, [fetchBankrolls]);

    useEffect(() => {
        fetchBets();
    }, [fetchBets]);

    const handleAddSuccess = () => {
        setShowAddForm(false);
        fetchBets();
    };

    const handleSettle = async (betId: string, status: BetStatus) => {
        const result = await settleBet(betId, status);
        if (result.success) {
            fetchBets();
        }
    };

    const handleDelete = async (betId: string) => {
        const result = await deleteBet(betId);
        if (result.success) {
            setDeleteConfirm(null);
            fetchBets();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Bets</h1>
                            <p className="text-sm text-gray-400">Track and manage your bets</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Bet
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter by Bankroll */}
                <div className="mb-6">
                    <select
                        value={selectedBankroll}
                        onChange={(e) => setSelectedBankroll(e.target.value)}
                        className="px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Bankrolls</option>
                        {bankrolls.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                        <p className="text-gray-400 text-sm">Total Bets</p>
                        <p className="text-2xl font-bold text-white">{bets.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-amber-400 text-sm">Pending</p>
                        <p className="text-2xl font-bold text-amber-400">
                            {bets.filter(b => b.status === 'pending').length}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-green-400 text-sm">Won</p>
                        <p className="text-2xl font-bold text-green-400">
                            {bets.filter(b => b.status === 'won').length}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-red-400 text-sm">Lost</p>
                        <p className="text-2xl font-bold text-red-400">
                            {bets.filter(b => b.status === 'lost').length}
                        </p>
                    </div>
                </div>

                {/* Bet List */}
                <BetList
                    bets={bets}
                    onSettle={handleSettle}
                    onDelete={(id) => setDeleteConfirm(id)}
                    loading={loading}
                />
            </main>

            {/* Add Bet Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
                    <div className="relative w-full max-w-2xl my-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Add New Bet</h2>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <AddBetForm
                            onSuccess={handleAddSuccess}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative w-full max-w-md bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Delete Bet</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this bet? This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

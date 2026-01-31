'use client';

// Force dynamic rendering to avoid pre-render errors without env variables
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useBankroll } from '@/hooks/useBankroll';
import { CreateBankrollForm } from '@/components/forms/CreateBankrollForm';
import { BankrollCard } from '@/components/ui/BankrollCard';
import type { Bankroll } from '@/types';

export default function BankrollsPage() {
    const { getBankrolls, deleteBankroll, loading } = useBankroll();
    const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Bankroll | null>(null);

    // Fetch bankrolls on mount
    useEffect(() => {
        fetchBankrolls();
    }, []);

    const fetchBankrolls = async () => {
        const result = await getBankrolls();
        if (result.success && result.data) {
            setBankrolls(result.data);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
        fetchBankrolls();
    };

    const handleDelete = async (bankroll: Bankroll) => {
        const result = await deleteBankroll(bankroll.id);
        if (result.success) {
            setDeleteConfirm(null);
            fetchBankrolls();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Bankrolls</h1>
                            <p className="text-sm text-gray-400">Manage your betting bankrolls</p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Bankroll
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Loading State */}
                {loading && bankrolls.length === 0 && (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3 text-gray-400">
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Loading bankrolls...
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && bankrolls.length === 0 && !showCreateForm && (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No bankrolls yet</h3>
                        <p className="text-gray-400 mb-6 max-w-sm">
                            Create your first bankroll to start tracking your sports betting performance
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Bankroll
                        </button>
                    </div>
                )}

                {/* Bankroll Grid */}
                {bankrolls.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bankrolls.map((bankroll) => (
                            <BankrollCard
                                key={bankroll.id}
                                bankroll={bankroll}
                                onDelete={(b) => setDeleteConfirm(b)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateForm(false)} />
                    <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Create New Bankroll</h2>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <CreateBankrollForm
                            onSuccess={handleCreateSuccess}
                            onCancel={() => setShowCreateForm(false)}
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
                            <h3 className="text-xl font-semibold text-white mb-2">Delete Bankroll</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete &ldquo;{deleteConfirm.name}&rdquo;? This will also delete all bets in this bankroll. This action cannot be undone.
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

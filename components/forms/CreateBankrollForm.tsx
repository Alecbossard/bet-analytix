'use client';

import { useState } from 'react';
import { useBankroll } from '@/hooks/useBankroll';
import { CURRENCIES } from '@/lib/utils';
import type { CreateBankrollFormData } from '@/types';

interface CreateBankrollFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CreateBankrollForm({ onSuccess, onCancel }: CreateBankrollFormProps) {
    const { createBankroll, loading, error } = useBankroll();
    const [formData, setFormData] = useState<CreateBankrollFormData>({
        name: '',
        description: '',
        initial_capital: 0,
        currency: 'USD',
    });
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.name.trim()) {
            setFormError('Bankroll name is required');
            return;
        }

        if (formData.initial_capital <= 0) {
            setFormError('Initial capital must be greater than 0');
            return;
        }

        const result = await createBankroll({
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            initial_capital: formData.initial_capital,
            currency: formData.currency,
        });

        if (result.success) {
            // Reset form
            setFormData({
                name: '',
                description: '',
                initial_capital: 0,
                currency: 'USD',
            });
            onSuccess?.();
        } else {
            setFormError(result.error || 'Failed to create bankroll');
        }
    };

    const displayError = formError || error;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {displayError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {displayError}
                </div>
            )}

            {/* Bankroll Name */}
            <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                    Bankroll Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Bankroll, NFL Season 2024"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                    Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add notes about this bankroll..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    disabled={loading}
                />
            </div>

            {/* Initial Capital & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="initial_capital" className="block text-sm font-medium text-gray-200">
                        Initial Capital <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$'}
                        </span>
                        <input
                            type="number"
                            id="initial_capital"
                            value={formData.initial_capital || ''}
                            onChange={(e) => setFormData({ ...formData, initial_capital: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-200">
                        Currency <span className="text-red-400">*</span>
                    </label>
                    <select
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                        disabled={loading}
                    >
                        {CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                        </>
                    ) : (
                        'Create Bankroll'
                    )}
                </button>
            </div>
        </form>
    );
}

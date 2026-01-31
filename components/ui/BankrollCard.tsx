import { formatCurrency, formatPercentage, calculateROI } from '@/lib/utils';
import type { Bankroll } from '@/types';
import Link from 'next/link';

interface BankrollCardProps {
    bankroll: Bankroll;
    onEdit?: (bankroll: Bankroll) => void;
    onDelete?: (bankroll: Bankroll) => void;
}

export function BankrollCard({ bankroll, onEdit, onDelete }: BankrollCardProps) {
    const profitLoss = bankroll.current_capital - bankroll.initial_capital;
    const roi = calculateROI(profitLoss, bankroll.initial_capital);
    const isPositive = profitLoss >= 0;

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-6 hover:border-blue-500/30 transition-all duration-300">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Status indicator */}
            <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bankroll.is_active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                    {bankroll.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="relative space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-xl font-semibold text-white truncate pr-20">
                        {bankroll.name}
                    </h3>
                    {bankroll.description && (
                        <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                            {bankroll.description}
                        </p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-700/50">
                    {/* Current Capital */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current</p>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(bankroll.current_capital, bankroll.currency)}
                        </p>
                    </div>

                    {/* Initial Capital */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Initial</p>
                        <p className="text-lg text-gray-300">
                            {formatCurrency(bankroll.initial_capital, bankroll.currency)}
                        </p>
                    </div>

                    {/* Profit/Loss */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">P/L</p>
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(profitLoss, bankroll.currency)}
                        </p>
                    </div>

                    {/* ROI */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ROI</p>
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercentage(roi)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <Link
                        href={`/bankrolls/${bankroll.id}`}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        View Details →
                    </Link>

                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(bankroll)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
                                title="Edit"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(bankroll)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

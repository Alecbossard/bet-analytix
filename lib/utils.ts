import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(profit: number, totalStaked: number): number {
    if (totalStaked === 0) return 0;
    return (profit / totalStaked) * 100;
}

/**
 * Calculate win rate
 */
export function calculateWinRate(wins: number, totalSettled: number): number {
    if (totalSettled === 0) return 0;
    return (wins / totalSettled) * 100;
}

/**
 * Supported currencies with their symbols
 */
export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
] as const;

/**
 * Bet status colors for UI
 */
export const BET_STATUS_COLORS = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    won: 'bg-green-500/10 text-green-500 border-green-500/20',
    lost: 'bg-red-500/10 text-red-500 border-red-500/20',
    void: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cashout: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    half_won: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    half_lost: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
} as const;

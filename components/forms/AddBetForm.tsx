'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBets } from '@/hooks/useBets';
import { useBankroll } from '@/hooks/useBankroll';
import type { Bankroll, Sport, Bookmaker, BetType } from '@/types';

// Zod schema for bet leg
const betLegSchema = z.object({
    sport_id: z.string().optional(),
    event_name: z.string().min(1, 'Match name is required'),
    event_date: z.string().optional(),
    selection: z.string().min(1, 'Selection is required'),
    odds: z.number().min(1.01, 'Odds must be at least 1.01'),
    league: z.string().optional(),
});

// Zod schema for the full bet form
const betFormSchema = z.object({
    bankroll_id: z.string().min(1, 'Please select a bankroll'),
    bookmaker_id: z.string().optional(),
    bet_type: z.enum(['single', 'accumulator'] as const),
    stake: z.number().min(0.01, 'Stake must be greater than 0'),
    placed_at: z.string(),
    notes: z.string().optional(),
    legs: z.array(betLegSchema).min(1, 'At least one selection is required'),
});

type BetFormValues = z.infer<typeof betFormSchema>;

interface AddBetFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function AddBetForm({ onSuccess, onCancel }: AddBetFormProps) {
    const { createBet, getSports, getBookmakers, loading } = useBets();
    const { getBankrolls } = useBankroll();

    const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
    const [sports, setSports] = useState<Sport[]>([]);
    const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<BetFormValues>({
        resolver: zodResolver(betFormSchema),
        defaultValues: {
            bet_type: 'single',
            placed_at: new Date().toISOString().split('T')[0],
            legs: [{ event_name: '', selection: '', odds: 1.5 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'legs',
    });

    const betType = watch('bet_type');
    const legs = watch('legs');
    const stake = watch('stake') || 0;

    // Calculate total odds
    const totalOdds = legs.reduce((acc, leg) => {
        const odds = leg.odds || 1;
        return acc * odds;
    }, 1);

    // Calculate potential return
    const potentialReturn = stake * totalOdds;

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            const [bankrollsRes, sportsRes, bookmakersRes] = await Promise.all([
                getBankrolls(),
                getSports(),
                getBookmakers(),
            ]);

            if (bankrollsRes.success && bankrollsRes.data) {
                setBankrolls(bankrollsRes.data);
            }
            if (sportsRes.success && sportsRes.data) {
                setSports(sportsRes.data);
            }
            if (bookmakersRes.success && bookmakersRes.data) {
                setBookmakers(bookmakersRes.data);
            }
        };

        fetchData();
    }, [getBankrolls, getSports, getBookmakers]);

    // Reset legs when switching bet type
    useEffect(() => {
        if (betType === 'single' && fields.length > 1) {
            // Keep only the first leg for single bets
            while (fields.length > 1) {
                remove(fields.length - 1);
            }
        }
    }, [betType, fields.length, remove]);

    const onSubmit = async (data: BetFormValues) => {
        setFormError(null);

        const result = await createBet(
            {
                bankroll_id: data.bankroll_id,
                bookmaker_id: data.bookmaker_id || undefined,
                bet_type: data.bet_type as BetType,
                stake: data.stake,
                total_odds: totalOdds,
                placed_at: data.placed_at,
                notes: data.notes,
            },
            data.legs.map(leg => ({
                event_name: leg.event_name,
                selection: leg.selection,
                odds: leg.odds,
                sport_id: leg.sport_id || undefined,
                event_date: leg.event_date || undefined,
                league: leg.league || undefined,
            }))
        );

        if (result.success) {
            onSuccess?.();
        } else {
            setFormError(result.error || 'Failed to create bet');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error display */}
            {formError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {formError}
                </div>
            )}

            {/* Bet Type Toggle */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Bet Type</label>
                <div className="flex gap-2">
                    {(['single', 'accumulator'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setValue('bet_type', type)}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${betType === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {type === 'single' ? 'Single' : 'Accumulator'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bankroll Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                    Bankroll <span className="text-red-400">*</span>
                </label>
                <select
                    {...register('bankroll_id')}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select bankroll...</option>
                    {bankrolls.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name} ({b.currency} {b.current_capital.toFixed(2)})
                        </option>
                    ))}
                </select>
                {errors.bankroll_id && (
                    <p className="text-red-400 text-sm">{errors.bankroll_id.message}</p>
                )}
            </div>

            {/* Bookmaker Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Bookmaker</label>
                <select
                    {...register('bookmaker_id')}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select bookmaker (optional)...</option>
                    {bookmakers.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Legs/Selections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-200">
                        {betType === 'single' ? 'Selection' : 'Selections'}
                    </label>
                    {betType === 'accumulator' && (
                        <button
                            type="button"
                            onClick={() => append({ event_name: '', selection: '', odds: 1.5 })}
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Match
                        </button>
                    )}
                </div>

                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 space-y-3"
                    >
                        {betType === 'accumulator' && fields.length > 1 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Leg {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* Sport */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Sport</label>
                                <select
                                    {...register(`legs.${index}.sport_id`)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select...</option>
                                    {sports.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* League */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">League</label>
                                <input
                                    {...register(`legs.${index}.league`)}
                                    placeholder="e.g. Premier League"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Match Name */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Match <span className="text-red-400">*</span></label>
                            <input
                                {...register(`legs.${index}.event_name`)}
                                placeholder="e.g. Liverpool vs Manchester United"
                                className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errors.legs?.[index]?.event_name && (
                                <p className="text-red-400 text-xs">{errors.legs[index].event_name?.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Selection */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Selection <span className="text-red-400">*</span></label>
                                <input
                                    {...register(`legs.${index}.selection`)}
                                    placeholder="e.g. Liverpool to Win"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.legs?.[index]?.selection && (
                                    <p className="text-red-400 text-xs">{errors.legs[index].selection?.message}</p>
                                )}
                            </div>

                            {/* Odds */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Odds <span className="text-red-400">*</span></label>
                                <Controller
                                    name={`legs.${index}.odds`}
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="1.01"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                />
                                {errors.legs?.[index]?.odds && (
                                    <p className="text-red-400 text-xs">{errors.legs[index].odds?.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {errors.legs?.message && (
                    <p className="text-red-400 text-sm">{errors.legs.message}</p>
                )}
            </div>

            {/* Stake & Calculations */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                        Stake <span className="text-red-400">*</span>
                    </label>
                    <Controller
                        name="stake"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                    />
                    {errors.stake && (
                        <p className="text-red-400 text-sm">{errors.stake.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Total Odds</label>
                    <div className="px-4 py-3 rounded-lg bg-gray-800/30 border border-gray-700/50 text-white font-mono">
                        {totalOdds.toFixed(2)}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Potential Return</label>
                    <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-mono font-semibold">
                        {potentialReturn.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Date Placed */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Date Placed</label>
                <input
                    type="date"
                    {...register('placed_at')}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Notes</label>
                <textarea
                    {...register('notes')}
                    rows={2}
                    placeholder="Optional notes about this bet..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Placing Bet...
                        </>
                    ) : (
                        'Place Bet'
                    )}
                </button>
            </div>
        </form>
    );
}

'use client';

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import type { BalancePoint } from '@/hooks/useAnalytics';

interface BankrollChartProps {
    data: BalancePoint[];
    currency?: string;
    loading?: boolean;
}

export function BankrollChart({ data, currency = 'USD', loading }: BankrollChartProps) {
    if (loading) {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading chart...
                </div>
            </div>
        );
    }

    // Ensure we always have at least something to render
    const chartData = data && data.length > 0 ? data : [{ date: new Date().toISOString(), balance: 0 }];

    // Determine if trend is positive
    const firstBalance = chartData[0]?.balance || 0;
    const lastBalance = chartData[chartData.length - 1]?.balance || 0;
    const isPositive = lastBalance >= firstBalance;

    // Check if all points are on the same day (use time format)
    const isSameDay = (() => {
        if (chartData.length < 2) return true;
        const firstDate = new Date(chartData[0].date).toDateString();
        const lastDate = new Date(chartData[chartData.length - 1].date).toDateString();
        return firstDate === lastDate;
    })();

    // Format X-axis label based on date range
    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isSameDay) {
            // Show time (HH:mm) for same-day data
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        // Show date for multi-day data
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Format tooltip label with full date + time
    const formatTooltipLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatCurrency = (value: number) => {
        return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatXAxis}
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(val) => `${currency} ${val}`}
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        domain={['dataMin - 50', 'dataMax + 50']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                        }}
                        labelFormatter={(label) => formatTooltipLabel(String(label))}
                        formatter={(value) => [formatCurrency(value as number || 0), 'Balance']}
                    />
                    <Area
                        type="linear"
                        dataKey="balance"
                        stroke={isPositive ? '#22c55e' : '#ef4444'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                        dot={{ r: 5, fill: isPositive ? '#22c55e' : '#ef4444', strokeWidth: 2, stroke: '#1f2937' }}
                        activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

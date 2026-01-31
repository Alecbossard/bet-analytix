'use client';

interface KPICardProps {
    label: string;
    value: string | number;
    suffix?: string;
    trend?: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
    subtext?: string;
}

export function KPICard({ label, value, suffix, trend = 'neutral', icon, subtext }: KPICardProps) {
    const trendColors = {
        positive: {
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
            text: 'text-green-400',
            glow: 'shadow-green-500/10',
        },
        negative: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-400',
            glow: 'shadow-red-500/10',
        },
        neutral: {
            bg: 'bg-gray-800/30',
            border: 'border-gray-700/50',
            text: 'text-white',
            glow: '',
        },
    };

    const colors = trendColors[trend];

    return (
        <div
            className={`p-5 rounded-xl ${colors.bg} border ${colors.border} ${colors.glow} shadow-lg transition-all hover:scale-[1.02]`}
        >
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-gray-400 font-medium">{label}</p>
                {icon && <div className="text-gray-500">{icon}</div>}
            </div>

            <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${colors.text} tracking-tight`}>
                    {value}
                </span>
                {suffix && (
                    <span className={`text-lg font-medium ${colors.text} opacity-70`}>
                        {suffix}
                    </span>
                )}
            </div>

            {subtext && (
                <p className="mt-2 text-xs text-gray-500">{subtext}</p>
            )}
        </div>
    );
}

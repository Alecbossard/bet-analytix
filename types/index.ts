// ============================================
// BET-ANALYTIX TYPE DEFINITIONS
// Core TypeScript interfaces for the application
// ============================================

// ============================================
// ENUMS
// ============================================

export type BetType = 'single' | 'accumulator' | 'system';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashout' | 'half_won' | 'half_lost';

export type LegOutcome = 'pending' | 'won' | 'lost' | 'void' | 'push';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'CNY' | 'INR' | 'BRL';

// ============================================
// DATABASE MODELS
// ============================================

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    timezone: string;
    username: string | null;
    bio: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface Sport {
    id: string;
    name: string;
    icon: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Bookmaker {
    id: string;
    user_id: string | null;
    name: string;
    website_url: string | null;
    is_custom: boolean;
    is_active: boolean;
    created_at: string;
}

export interface Bankroll {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    initial_capital: number;
    current_capital: number;
    currency: string;
    is_active: boolean;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
}

export interface PublicProfile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    stats: {
        total_bets: number;
        won_bets: number;
        lost_bets: number;
        total_profit: number;
        win_rate: number;
    };
    followers: number;
    following: number;
}

export interface PublicBankroll {
    id: string;
    name: string;
    currency: string;
    initial_capital: number;
    current_capital: number;
    created_at: string;
    profit: number;
    roi: number;
}

export interface Bet {
    id: string;
    user_id: string;
    bankroll_id: string;
    bookmaker_id: string | null;
    bet_type: BetType;
    stake: number;
    total_odds: number;
    potential_return: number;
    actual_return: number;
    profit_loss: number;
    status: BetStatus;
    placed_at: string;
    settled_at: string | null;
    notes: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface BetLeg {
    id: string;
    bet_id: string;
    sport_id: string | null;
    event_name: string;
    event_date: string | null;
    selection: string;
    odds: number;
    outcome: LegOutcome;
    league: string | null;
    market_type: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export interface ProfileInsert {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    timezone?: string;
}

export interface BankrollInsert {
    user_id: string;
    name: string;
    description?: string | null;
    initial_capital: number;
    current_capital?: number;
    currency: string;
    is_active?: boolean;
}

export interface BetInsert {
    user_id: string;
    bankroll_id: string;
    bookmaker_id?: string | null;
    bet_type: BetType;
    stake: number;
    total_odds: number;
    actual_return?: number;
    status?: BetStatus;
    placed_at?: string;
    settled_at?: string | null;
    notes?: string | null;
    tags?: string[] | null;
}

export interface BetLegInsert {
    bet_id: string;
    sport_id?: string | null;
    event_name: string;
    event_date?: string | null;
    selection: string;
    odds: number;
    outcome?: LegOutcome;
    league?: string | null;
    market_type?: string | null;
}

export interface BookmakerInsert {
    user_id: string;
    name: string;
    website_url?: string | null;
    is_custom: boolean;
    is_active?: boolean;
}

// ============================================
// UPDATE TYPES (for updating existing records)
// ============================================

export interface ProfileUpdate {
    full_name?: string | null;
    avatar_url?: string | null;
    timezone?: string;
}

export interface BankrollUpdate {
    name?: string;
    description?: string | null;
    initial_capital?: number;
    current_capital?: number;
    currency?: string;
    is_active?: boolean;
}

export interface BetUpdate {
    bookmaker_id?: string | null;
    bet_type?: BetType;
    stake?: number;
    total_odds?: number;
    actual_return?: number;
    status?: BetStatus;
    placed_at?: string;
    settled_at?: string | null;
    notes?: string | null;
    tags?: string[] | null;
}

export interface BetLegUpdate {
    sport_id?: string | null;
    event_name?: string;
    event_date?: string | null;
    selection?: string;
    odds?: number;
    outcome?: LegOutcome;
    league?: string | null;
    market_type?: string | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface BankrollStats {
    totalBets: number;
    pendingBets: number;
    wonBets: number;
    lostBets: number;
    winRate: number;
    totalStaked: number;
    totalReturns: number;
    netProfitLoss: number;
    roi: number; // Return on Investment (%)
    averageOdds: number;
    averageStake: number;
}

export interface ChartDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface ProfitByPeriod {
    period: string;
    profit: number;
    bets: number;
    winRate: number;
}

export interface SportPerformance {
    sport: Sport;
    bets: number;
    profit: number;
    winRate: number;
    roi: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateBankrollFormData {
    name: string;
    description?: string;
    initial_capital: number;
    currency: string;
}

export interface CreateBetFormData {
    bankroll_id: string;
    bookmaker_id?: string;
    bet_type: BetType;
    stake: number;
    total_odds: number;
    placed_at: string;
    notes?: string;
    tags?: string[];
    legs: CreateBetLegFormData[];
}

export interface CreateBetLegFormData {
    sport_id?: string;
    event_name: string;
    event_date?: string;
    selection: string;
    odds: number;
    league?: string;
    market_type?: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface SelectOption {
    value: string;
    label: string;
}

export interface TableColumn<T> {
    key: keyof T;
    header: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface FilterState {
    status?: BetStatus[];
    sports?: string[];
    bookmakers?: string[];
    dateRange?: {
        start: string;
        end: string;
    };
    minStake?: number;
    maxStake?: number;
}

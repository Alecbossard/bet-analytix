-- ============================================
-- BET-ANALYTIX DATABASE SCHEMA
-- Sports Betting Bankroll Management Tool
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extended user data linked to Supabase auth
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- SPORTS TABLE
-- Sport categories for bet classification
-- ============================================
CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT, -- Optional icon identifier
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed default sports
INSERT INTO sports (name, icon, is_active) VALUES
    ('Football', 'football', true),
    ('Basketball', 'basketball', true),
    ('Tennis', 'tennis', true),
    ('Baseball', 'baseball', true),
    ('Hockey', 'hockey', true),
    ('Soccer', 'soccer', true),
    ('MMA/UFC', 'mma', true),
    ('Boxing', 'boxing', true),
    ('Golf', 'golf', true),
    ('Esports', 'esports', true),
    ('Other', 'other', true);

-- ============================================
-- BOOKMAKERS TABLE
-- Betting platforms/sportsbooks
-- ============================================
CREATE TABLE bookmakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website_url TEXT,
    is_custom BOOLEAN DEFAULT false NOT NULL, -- User-created vs system default
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, name)
);

-- Seed default bookmakers (null user_id = system defaults)
INSERT INTO bookmakers (user_id, name, website_url, is_custom, is_active) VALUES
    (NULL, 'DraftKings', 'https://draftkings.com', false, true),
    (NULL, 'FanDuel', 'https://fanduel.com', false, true),
    (NULL, 'BetMGM', 'https://betmgm.com', false, true),
    (NULL, 'Caesars', 'https://caesars.com', false, true),
    (NULL, 'PointsBet', 'https://pointsbet.com', false, true),
    (NULL, 'Bet365', 'https://bet365.com', false, true),
    (NULL, 'Betway', 'https://betway.com', false, true),
    (NULL, 'Unibet', 'https://unibet.com', false, true),
    (NULL, 'William Hill', 'https://williamhill.com', false, true),
    (NULL, 'Other', NULL, false, true);

-- ============================================
-- BANKROLLS TABLE
-- User bankrolls with capital tracking
-- ============================================
CREATE TABLE bankrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    initial_capital DECIMAL(15, 2) NOT NULL CHECK (initial_capital >= 0),
    current_capital DECIMAL(15, 2) NOT NULL CHECK (current_capital >= 0),
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, name)
);

-- Index for faster user queries
CREATE INDEX idx_bankrolls_user_id ON bankrolls(user_id);

-- ============================================
-- BETS TABLE
-- Main bets table (single, accumulator, system)
-- ============================================
CREATE TYPE bet_type AS ENUM ('single', 'accumulator', 'system');
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'void', 'cashout', 'half_won', 'half_lost');

CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bankroll_id UUID NOT NULL REFERENCES bankrolls(id) ON DELETE CASCADE,
    bookmaker_id UUID REFERENCES bookmakers(id) ON DELETE SET NULL,
    
    -- Bet details
    bet_type bet_type NOT NULL DEFAULT 'single',
    stake DECIMAL(15, 2) NOT NULL CHECK (stake > 0),
    total_odds DECIMAL(10, 4) NOT NULL CHECK (total_odds > 0),
    potential_return DECIMAL(15, 2) GENERATED ALWAYS AS (stake * total_odds) STORED,
    actual_return DECIMAL(15, 2) DEFAULT 0 CHECK (actual_return >= 0),
    profit_loss DECIMAL(15, 2) GENERATED ALWAYS AS (actual_return - stake) STORED,
    
    -- Status and timing
    status bet_status NOT NULL DEFAULT 'pending',
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    
    -- Optional notes
    notes TEXT,
    tags TEXT[], -- Array of user-defined tags
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_bankroll_id ON bets(bankroll_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_placed_at ON bets(placed_at DESC);
CREATE INDEX idx_bets_user_status ON bets(user_id, status);

-- ============================================
-- BET_LEGS TABLE
-- Individual selections within accumulator bets
-- ============================================
CREATE TYPE leg_outcome AS ENUM ('pending', 'won', 'lost', 'void', 'push');

CREATE TABLE bet_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_id UUID NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    
    -- Event details
    event_name TEXT NOT NULL, -- e.g., "Lakers vs Warriors"
    event_date TIMESTAMPTZ,
    
    -- Selection details
    selection TEXT NOT NULL, -- e.g., "Lakers -3.5"
    odds DECIMAL(10, 4) NOT NULL CHECK (odds > 0),
    
    -- Outcome
    outcome leg_outcome NOT NULL DEFAULT 'pending',
    
    -- Additional info
    league TEXT, -- e.g., "NBA"
    market_type TEXT, -- e.g., "Spread", "Moneyline", "Over/Under"
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for bet legs queries
CREATE INDEX idx_bet_legs_bet_id ON bet_legs(bet_id);
CREATE INDEX idx_bet_legs_sport_id ON bet_legs(sport_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bankrolls_updated_at
    BEFORE UPDATE ON bankrolls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at
    BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bet_legs_updated_at
    BEFORE UPDATE ON bet_legs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update bankroll capital when bet is settled
CREATE OR REPLACE FUNCTION update_bankroll_on_bet_settle()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if status changed to a settled state
    IF NEW.status != OLD.status AND NEW.status IN ('won', 'lost', 'void', 'cashout', 'half_won', 'half_lost') THEN
        UPDATE bankrolls
        SET current_capital = current_capital + NEW.actual_return - NEW.stake
        WHERE id = NEW.bankroll_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bet_settled
    AFTER UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_bankroll_on_bet_settle();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can only access their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- BANKROLLS: Users can only access their own bankrolls
CREATE POLICY "Users can view own bankrolls"
    ON bankrolls FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bankrolls"
    ON bankrolls FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bankrolls"
    ON bankrolls FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bankrolls"
    ON bankrolls FOR DELETE
    USING (auth.uid() = user_id);

-- BETS: Users can only access their own bets
CREATE POLICY "Users can view own bets"
    ON bets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bets"
    ON bets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bets"
    ON bets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bets"
    ON bets FOR DELETE
    USING (auth.uid() = user_id);

-- BET_LEGS: Users can access legs of their own bets
CREATE POLICY "Users can view own bet legs"
    ON bet_legs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = bet_legs.bet_id
            AND bets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create legs for own bets"
    ON bet_legs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = bet_legs.bet_id
            AND bets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update legs for own bets"
    ON bet_legs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = bet_legs.bet_id
            AND bets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete legs for own bets"
    ON bet_legs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bets
            WHERE bets.id = bet_legs.bet_id
            AND bets.user_id = auth.uid()
        )
    );

-- BOOKMAKERS: Users can view all defaults + their own custom
CREATE POLICY "Users can view bookmakers"
    ON bookmakers FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create own bookmakers"
    ON bookmakers FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can update own bookmakers"
    ON bookmakers FOR UPDATE
    USING (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can delete own bookmakers"
    ON bookmakers FOR DELETE
    USING (auth.uid() = user_id AND is_custom = true);

-- SPORTS: Everyone can view sports (read-only for users)
CREATE POLICY "Everyone can view sports"
    ON sports FOR SELECT
    USING (true);

-- ============================================
-- ANALYTICS RPC FUNCTIONS
-- ============================================

-- Function to get bankroll statistics
CREATE OR REPLACE FUNCTION get_bankroll_stats(p_bankroll_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_initial_capital DECIMAL(15,2);
BEGIN
    -- Get initial capital for ROC calculation
    SELECT initial_capital INTO v_initial_capital
    FROM bankrolls WHERE id = p_bankroll_id;

    SELECT json_build_object(
        'total_bets', COALESCE(COUNT(*), 0),
        'won_bets', COALESCE(COUNT(*) FILTER (WHERE status = 'won'), 0),
        'lost_bets', COALESCE(COUNT(*) FILTER (WHERE status = 'lost'), 0),
        'pending_bets', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0),
        'total_staked', COALESCE(SUM(stake) FILTER (WHERE status IN ('won', 'lost')), 0),
        'total_returns', COALESCE(SUM(actual_return) FILTER (WHERE status IN ('won', 'lost')), 0),
        'total_profit', COALESCE(SUM(profit_loss) FILTER (WHERE status IN ('won', 'lost')), 0),
        'win_rate', CASE 
            WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE status = 'won')::DECIMAL / 
                 COUNT(*) FILTER (WHERE status IN ('won', 'lost'))) * 100, 2)
            ELSE 0 
        END,
        'roi', CASE 
            WHEN COALESCE(SUM(stake) FILTER (WHERE status IN ('won', 'lost')), 0) > 0 
            THEN ROUND((COALESCE(SUM(profit_loss) FILTER (WHERE status IN ('won', 'lost')), 0) / 
                 SUM(stake) FILTER (WHERE status IN ('won', 'lost'))) * 100, 2)
            ELSE 0 
        END,
        'roc', CASE 
            WHEN v_initial_capital > 0 
            THEN ROUND((COALESCE(SUM(profit_loss) FILTER (WHERE status IN ('won', 'lost')), 0) / 
                 v_initial_capital) * 100, 2)
            ELSE 0 
        END,
        'avg_odds', COALESCE(ROUND(AVG(total_odds)::DECIMAL, 2), 0),
        'avg_stake', COALESCE(ROUND(AVG(stake)::DECIMAL, 2), 0)
    ) INTO result
    FROM bets
    WHERE bankroll_id = p_bankroll_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get balance history over time
CREATE OR REPLACE FUNCTION get_balance_history(p_bankroll_id UUID, p_days INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_initial_capital DECIMAL(15,2);
    v_start_date DATE;
BEGIN
    -- Get initial capital and start date
    SELECT initial_capital, created_at::DATE 
    INTO v_initial_capital, v_start_date
    FROM bankrolls WHERE id = p_bankroll_id;

    -- Calculate cumulative balance for each day with settled bets
    WITH daily_pnl AS (
        SELECT 
            DATE(settled_at) as bet_date,
            SUM(profit_loss) as daily_profit
        FROM bets
        WHERE bankroll_id = p_bankroll_id
          AND status IN ('won', 'lost', 'cashout', 'half_won', 'half_lost')
          AND settled_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY DATE(settled_at)
        ORDER BY DATE(settled_at)
    ),
    running_balance AS (
        SELECT 
            bet_date,
            v_initial_capital + SUM(daily_profit) OVER (ORDER BY bet_date) as balance
        FROM daily_pnl
    )
    SELECT json_agg(
        json_build_object(
            'date', bet_date,
            'balance', ROUND(balance::DECIMAL, 2)
        ) ORDER BY bet_date
    ) INTO result
    FROM running_balance;

    -- If no data, return initial point
    IF result IS NULL THEN
        result := json_build_array(
            json_build_object('date', CURRENT_DATE, 'balance', v_initial_capital)
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

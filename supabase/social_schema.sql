-- ============================================
-- BET-ANALYTIX SOCIAL FEATURES
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SCHEMA UPDATES
-- ============================================

-- Add username and bio to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS odds_format TEXT DEFAULT 'decimal';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add is_public to bankrolls
ALTER TABLE bankrolls ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- ============================================
-- 2. FOLLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- RLS for follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others" ON follows FOR INSERT 
    WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows FOR DELETE 
    USING (auth.uid() = follower_id);

-- ============================================
-- 3. PUBLIC PROFILE RPC
-- ============================================
CREATE OR REPLACE FUNCTION get_public_profile(p_username TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_user_id UUID;
    v_profile RECORD;
BEGIN
    -- Get user by username
    SELECT id, username, full_name, avatar_url, bio, is_public, created_at
    INTO v_profile
    FROM profiles
    WHERE username = p_username AND is_public = true;

    -- If profile not found or not public
    IF v_profile.id IS NULL THEN
        RETURN json_build_object('error', 'Profile not found or is private');
    END IF;

    v_user_id := v_profile.id;

    -- Build profile with aggregated stats from PUBLIC bankrolls only
    WITH public_stats AS (
        SELECT 
            COALESCE(COUNT(DISTINCT b.id), 0) as total_bets,
            COALESCE(COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'won'), 0) as won_bets,
            COALESCE(COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'lost'), 0) as lost_bets,
            COALESCE(SUM(b.profit_loss) FILTER (WHERE b.status IN ('won', 'lost')), 0) as total_profit
        FROM bankrolls br
        LEFT JOIN bets b ON b.bankroll_id = br.id
        WHERE br.user_id = v_user_id AND br.is_public = true
    ),
    follower_counts AS (
        SELECT 
            (SELECT COUNT(*) FROM follows WHERE following_id = v_user_id) as followers,
            (SELECT COUNT(*) FROM follows WHERE follower_id = v_user_id) as following
    )
    SELECT json_build_object(
        'id', v_profile.id,
        'username', v_profile.username,
        'full_name', v_profile.full_name,
        'avatar_url', v_profile.avatar_url,
        'bio', v_profile.bio,
        'created_at', v_profile.created_at,
        'stats', json_build_object(
            'total_bets', ps.total_bets,
            'won_bets', ps.won_bets,
            'lost_bets', ps.lost_bets,
            'total_profit', ps.total_profit,
            'win_rate', CASE 
                WHEN (ps.won_bets + ps.lost_bets) > 0 
                THEN ROUND((ps.won_bets::DECIMAL / (ps.won_bets + ps.lost_bets)) * 100, 2)
                ELSE 0 
            END
        ),
        'followers', fc.followers,
        'following', fc.following
    ) INTO result
    FROM public_stats ps, follower_counts fc;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. GET PUBLIC BANKROLLS
-- ============================================
CREATE OR REPLACE FUNCTION get_public_bankrolls(p_username TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_user_id UUID;
BEGIN
    -- Get user ID from username
    SELECT id INTO v_user_id
    FROM profiles
    WHERE username = p_username AND is_public = true;

    IF v_user_id IS NULL THEN
        RETURN '[]'::json;
    END IF;

    -- Get public bankrolls with stats
    SELECT json_agg(
        json_build_object(
            'id', br.id,
            'name', br.name,
            'currency', br.currency,
            'initial_capital', br.initial_capital,
            'current_capital', br.current_capital,
            'created_at', br.created_at,
            'profit', br.current_capital - br.initial_capital,
            'roi', CASE 
                WHEN br.initial_capital > 0 
                THEN ROUND(((br.current_capital - br.initial_capital) / br.initial_capital) * 100, 2)
                ELSE 0 
            END
        )
    ) INTO result
    FROM bankrolls br
    WHERE br.user_id = v_user_id AND br.is_public = true;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CHECK IF FOLLOWING
-- ============================================
CREATE OR REPLACE FUNCTION is_following(p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() 
        AND following_id = p_following_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

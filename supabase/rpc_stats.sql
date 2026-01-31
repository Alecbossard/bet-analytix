-- ============================================
-- BET-ANALYTIX RPC FUNCTIONS v2
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. GET BANKROLL STATS
-- ============================================
CREATE OR REPLACE FUNCTION get_bankroll_stats(p_bankroll_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_initial_capital DECIMAL(15,2);
    v_total_staked DECIMAL(15,2);
    v_total_profit DECIMAL(15,2);
    v_settled_count INT;
    v_won_count INT;
BEGIN
    -- Get initial capital
    SELECT COALESCE(initial_capital, 0) INTO v_initial_capital
    FROM bankrolls WHERE id = p_bankroll_id;

    -- Pre-calculate aggregates
    SELECT 
        COALESCE(SUM(stake) FILTER (WHERE status IN ('won', 'lost')), 0),
        COALESCE(SUM(profit_loss) FILTER (WHERE status IN ('won', 'lost')), 0),
        COALESCE(COUNT(*) FILTER (WHERE status IN ('won', 'lost')), 0),
        COALESCE(COUNT(*) FILTER (WHERE status = 'won'), 0)
    INTO v_total_staked, v_total_profit, v_settled_count, v_won_count
    FROM bets
    WHERE bankroll_id = p_bankroll_id;

    -- Build result JSON
    SELECT json_build_object(
        'total_bets', COALESCE(COUNT(*), 0),
        'won_bets', v_won_count,
        'lost_bets', COALESCE(COUNT(*) FILTER (WHERE status = 'lost'), 0),
        'pending_bets', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0),
        'total_staked', v_total_staked,
        'total_returns', COALESCE(SUM(actual_return) FILTER (WHERE status IN ('won', 'lost')), 0),
        'total_profit', v_total_profit,
        'win_rate', CASE 
            WHEN v_settled_count > 0 
            THEN ROUND((v_won_count::DECIMAL / v_settled_count) * 100, 2)
            ELSE 0.00 
        END,
        'roi', CASE 
            WHEN v_total_staked > 0 
            THEN ROUND((v_total_profit / v_total_staked) * 100, 2)
            ELSE 0.00 
        END,
        'roc', CASE 
            WHEN v_initial_capital > 0 
            THEN ROUND((v_total_profit / v_initial_capital) * 100, 2)
            ELSE 0.00 
        END,
        'avg_odds', COALESCE(ROUND(AVG(total_odds)::DECIMAL, 2), 0.00),
        'avg_stake', COALESCE(ROUND(AVG(stake)::DECIMAL, 2), 0.00)
    ) INTO result
    FROM bets
    WHERE bankroll_id = p_bankroll_id;

    IF result IS NULL THEN
        result := json_build_object(
            'total_bets', 0, 'won_bets', 0, 'lost_bets', 0, 'pending_bets', 0,
            'total_staked', 0, 'total_returns', 0, 'total_profit', 0,
            'win_rate', 0.00, 'roi', 0.00, 'roc', 0.00,
            'avg_odds', 0.00, 'avg_stake', 0.00
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 2. GET BALANCE HISTORY
-- Returns per-bet cumulative balance starting from INITIAL CAPITAL
-- ============================================
CREATE OR REPLACE FUNCTION get_balance_history(p_bankroll_id UUID, p_days INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_initial_capital DECIMAL(15,2) := 0;
    v_current_capital DECIMAL(15,2) := 0;
    v_created_at TIMESTAMPTZ := NOW();
    v_bankroll_exists BOOLEAN := FALSE;
BEGIN
    -- Get bankroll info
    SELECT 
        initial_capital,
        current_capital,
        created_at,
        TRUE
    INTO v_initial_capital, v_current_capital, v_created_at, v_bankroll_exists
    FROM bankrolls WHERE id = p_bankroll_id;

    -- Handle missing bankroll
    IF NOT v_bankroll_exists OR v_initial_capital IS NULL THEN
        RETURN json_build_array(
            json_build_object('date', NOW(), 'balance', 0)
        );
    END IF;

    -- Build per-bet cumulative balance history
    -- CRITICAL: Balance = initial_capital + cumulative profit/loss
    WITH 
    -- Point 0: Starting balance = initial capital
    start_point AS (
        SELECT 
            v_created_at AS event_time,
            v_initial_capital AS balance,
            0 AS seq
    ),
    -- Points 1..N: After each settled bet
    bet_points AS (
        SELECT 
            settled_at AS event_time,
            -- BALANCE = Initial Capital + Running Sum of all profit_loss up to this bet
            v_initial_capital + SUM(COALESCE(profit_loss, 0)) OVER (
                ORDER BY settled_at ASC, id ASC
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS balance,
            ROW_NUMBER() OVER (ORDER BY settled_at ASC, id ASC) AS seq
        FROM bets
        WHERE bankroll_id = p_bankroll_id
          AND status IN ('won', 'lost', 'cashout', 'half_won', 'half_lost')
          AND settled_at IS NOT NULL
          AND settled_at >= (NOW() - make_interval(days => p_days))
    ),
    -- Combine all points
    all_points AS (
        SELECT event_time, balance, seq FROM start_point
        UNION ALL
        SELECT event_time, balance, seq FROM bet_points
    )
    SELECT json_agg(
        json_build_object(
            'date', event_time,
            'balance', ROUND(balance::DECIMAL, 2)
        ) ORDER BY event_time ASC, seq ASC
    ) INTO result
    FROM all_points;

    -- Fallback: if no bets, show start → current
    IF result IS NULL OR json_array_length(result) < 2 THEN
        result := json_build_array(
            json_build_object('date', v_created_at, 'balance', ROUND(v_initial_capital::DECIMAL, 2)),
            json_build_object('date', NOW(), 'balance', ROUND(v_current_capital::DECIMAL, 2))
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION
 admin_monthly_report(p_month date default date_trunc('month', now())::date)
RETURNS table (
  month_start date,
  month_end date,
  users_created bigint,
  domains_created bigint,
  paid_orders_count bigint,
  paid_amount bigint,
  first_paid_at timestamptz,
  last_paid_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start timestamp := date_trunc('month', p_month);
  v_end   timestamp := (date_trunc('month', p_month) + interval '1 month');
BEGIN
  RETURN query
  with users_cte AS (
    select count(*)::bigint cnt
    from app_user
    WHERE created_at >= v_start and created_at < v_end
  ),
  domains_cte AS (
    select count(*)::bigint cnt
    from domain
    WHERE created_at >= v_start and created_at < v_end
  ),
  paid_orders AS (
    select o.id, o.total_amount, o.paid_at
    from app_order o
    WHERE o.paid_at is not null
      and o.paid_at >= v_start
      and o.paid_at <  v_end
      and o.status = 'paid'
  )
  select
    v_start::date                            AS month_start,
    (v_end - interval '1 day')::date         AS month_end,
    (select cnt from users_cte)              AS users_created,
    (select cnt from domains_cte)            AS domains_created,
    count(po.id)::bigint                     AS paid_orders_count,
    coalesce(sum(po.total_amount),0)::bigint AS paid_amount,
    min(po.paid_at)                          AS first_paid_at,
    max(po.paid_at)                          AS last_paid_at
  from paid_orders po;
END;
$$;
create or replace function admin_monthly_report(p_month date default date_trunc('month', now())::date)
returns table (
  month_start date,
  month_end date,
  users_created bigint,
  domains_created bigint,
  paid_orders_count bigint,
  paid_amount bigint,
  first_paid_at timestamptz,
  last_paid_at timestamptz
)
language plpgsql
as $$
declare
  v_start timestamp := date_trunc('month', p_month);
  v_end   timestamp := (date_trunc('month', p_month) + interval '1 month');
begin
  return query
  with users_cte as (
    select count(*)::bigint cnt
    from app_user
    where created_at >= v_start and created_at < v_end
  ),
  domains_cte as (
    select count(*)::bigint cnt
    from domain
    where created_at >= v_start and created_at < v_end
  ),
  paid_orders as (
    select o.id, o.total_amount, o.paid_at
    from app_order o
    where o.paid_at is not null
      and o.paid_at >= v_start
      and o.paid_at <  v_end
      and o.status = 'paid'
  )
  select
    v_start::date                                   as month_start,
    (v_end - interval '1 day')::date               as month_end,
    (select cnt from users_cte)                    as users_created,
    (select cnt from domains_cte)                  as domains_created,
    count(po.id)::bigint                           as paid_orders_count,
    coalesce(sum(po.total_amount),0)::bigint       as paid_amount,
    min(po.paid_at)                                as first_paid_at,
    max(po.paid_at)                                as last_paid_at
  from paid_orders po;
end;
$$;
create or replace function maintenance_delete_stale_orders()
returns bigint
language plpgsql
as $$
declare
  v_deleted bigint;
begin
  delete from app_order o
  where o.paid_at is null
    and now() - o.created_at >= interval '10 minutes'
    and o.status in ('created','pending_payment')
  returning 1 into v_deleted;

  return coalesce(v_deleted, 0);
end;
$$;
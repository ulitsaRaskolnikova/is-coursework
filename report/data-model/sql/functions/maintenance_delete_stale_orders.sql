CREATE OR REPLACE FUNCTION maintenance_delete_stale_orders()
RETURN BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted bigint;
BEGIN
  DELETE FROM app_order o
  WHERE o.paid_at IS NULL
    AND now() - o.created_at >= interval '10 minutes'
    AND o.status in ('created','pending_payment')
  returning COUNT(*) INTO v_deleted;

  RETURN coalesce(v_deleted, 0);
END;
$$;
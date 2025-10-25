CREATE OR REPLACE FUNCTION maintenance_delete_expired_email_tokens()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted bigint;
BEGIN
  DELETE FROM email_validation_token t
  WHERE t.expires_at < now()
  RETURNING count(*) INTO v_deleted;

  RETURN coalesce(v_deleted, 0);
END;
$$;
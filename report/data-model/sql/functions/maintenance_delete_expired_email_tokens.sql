create or replace function maintenance_delete_expired_email_tokens()
returns bigint
language plpgsql
as $$
declare
  v_deleted bigint;
begin
  delete from email_validation_token t
  where t.expires_at < now()
  returning 1 into v_deleted;

  return coalesce(v_deleted, 0);
end;
$$;
CREATE OR REPLACE FUNCTION
  get_expired_domains()
RETURNS table (
  domain_id uuid,
  fqdn text,
  created_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN query
  select d.id, d.fqdn, d.expires_at, d.activated_at, d.created_at
  from domain d
  WHERE d.expires_at < now()
  order by d.expires_at asc;
END;
$$;
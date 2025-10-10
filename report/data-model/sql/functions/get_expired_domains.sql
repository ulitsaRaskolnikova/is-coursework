create or replace function get_expired_domains()
returns table (
  domain_id uuid,
  fqdn text,
  expires_at timestamptz,
  zone2_id uuid,
  activated_at timestamptz,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select d.id, d.fqdn, d.expires_at, d.zone2_id, d.activated_at, d.created_at
  from domain d
  where d.expires_at < now()
  order by d.expires_at asc;
end;
$$;
create or replace function reminders_domains_due_today()
returns table (
  user_id uuid,
  domain_id uuid,
  fqdn text,
  expires_at timestamptz,
  days_before integer,
  effective_source text
)
language plpgsql
as $$
begin
  return query
  with owner_map as (
    -- Берём владельцев доменов (роль OWNER, если у вас возможны множественные участники)
    select dm.user_id, d.id as domain_id, d.fqdn, d.expires_at, d.activated_at
    from domain d
    join domain_member dm on dm.domain_id = d.id and dm.role = 'OWNER'
  ),
  user_has_prefs as (
    select user_id, bool_or(enabled) as any_enabled
    from expiry_email_pref
    group by user_id
  ),
  user_enabled_prefs as (
    select user_id, days_before
    from expiry_email_pref
    where enabled = true
  ),
  defaults as (
    -- дефолтные ступени оповещения
    select unnest(array[30,14,7,3,1])::int as days_before
  ),
  expanded as (
    -- Для каждого домена владельца берём его prefs, иначе дефолт
    select om.user_id,
           om.domain_id,
           om.fqdn,
           om.expires_at,
           p.days_before,
           'user_pref'::text as source
    from owner_map om
    join user_has_prefs uhp on uhp.user_id = om.user_id and uhp.any_enabled = true
    join user_enabled_prefs p on p.user_id = om.user_id

    union all

    select om.user_id,
           om.domain_id,
           om.fqdn,
           om.expires_at,
           d.days_before,
           'default'::text as source
    from owner_map om
    left join user_has_prefs uhp on uhp.user_id = om.user_id
    join defaults d on coalesce(uhp.any_enabled, false) = false
  )
  select e.user_id, e.domain_id, e.fqdn, e.expires_at, e.days_before, e.source
  from expanded e
  where (e.expires_at at time zone 'UTC')::date = current_date + e.days_before
    and exists (
      select 1 from domain d where d.id = e.domain_id and d.activated_at is not null
    )
  order by e.user_id, e.expires_at, e.fqdn;
end;
$$;
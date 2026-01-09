-- Уведомить с учётом персональных настроек "days_before"
WITH due AS (
  SELECT d.id, d.fqdn, d.expires_at, dm.user_id
  FROM domain d
  JOIN domain_member dm ON dm.domain_id = d.id
  WHERE d.expires_at::date = (now() + ($1 || ' days')::interval)::date
)
SELECT u.email, due.fqdn, due.expires_at
FROM due
JOIN expiry_email_pref p ON p.user_id = due.user_id
JOIN app_user u ON u.id = due.user_id
WHERE p.enabled = true AND p.days_before = $1;
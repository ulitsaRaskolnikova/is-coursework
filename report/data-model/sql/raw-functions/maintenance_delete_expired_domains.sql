-- домены, срок которых истёк
SELECT id, fqdn, expires_at
FROM domain
WHERE expires_at < now()
ORDER BY expires_at ASC
LIMIT 1000;
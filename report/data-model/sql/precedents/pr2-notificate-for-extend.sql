-- Рассылки о скором истечении: домены, истекающие в указанное окно
SELECT d.id, d.fqdn, d.expires_at
FROM domain AS d
WHERE d.expires_at >= $1
  AND d.expires_at < $2
ORDER BY d.expires_at;
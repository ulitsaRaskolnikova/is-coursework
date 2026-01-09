-- Список DNS-записей домена
SELECT id, type, name, value, ttl, updated_at
FROM dns_record
WHERE domain_id = $1
ORDER BY created_at;
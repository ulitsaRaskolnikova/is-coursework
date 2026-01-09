-- Аудит за временной интервал
SELECT at, actor_type, actor_id, action, resource, ip
FROM event
WHERE at >= $1 AND at < $2
ORDER BY at DESC
LIMIT 1000;
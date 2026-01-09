-- Аудит по актёру
SELECT at, actor_type, actor_id, action, resource, ip
FROM event
WHERE actor_type = $1
  AND actor_id = $2
ORDER BY at DESC
LIMIT 200;
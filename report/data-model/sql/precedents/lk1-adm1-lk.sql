-- Активные сессии пользователя
SELECT id, issued_at, expires_at, ip, user_agent, device, last_access_at
FROM user_session
WHERE user_id = $1
ORDER BY issued_at DESC;
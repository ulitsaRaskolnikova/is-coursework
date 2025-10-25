-- очистка просроченных сессий
DELETE FROM user_session
WHERE expires_at < now();
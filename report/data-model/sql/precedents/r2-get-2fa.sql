-- Получить 2FA-параметры
SELECT id, kind, public_data
FROM auth_factor
WHERE user_id = $1;
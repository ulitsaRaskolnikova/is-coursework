-- Ожидающие оплаты заказы пользователя за последние 24 часа
SELECT id, status, total_amount, created_at
FROM app_order
WHERE user_id = $1
  AND paid_at IS NULL
  AND created_at >= now() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
-- Получить историю возвратов заказа
SELECT provider_refund_id, amount, status, created_at
FROM refund
WHERE payment_operation_id = $1
ORDER BY created_at DESC;
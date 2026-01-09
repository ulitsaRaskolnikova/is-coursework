-- Получить историю статусов заказа
SELECT status_mapped, status_raw, created_at
FROM payment_status
WHERE payment_operation_id = $1
ORDER BY created_at DESC;
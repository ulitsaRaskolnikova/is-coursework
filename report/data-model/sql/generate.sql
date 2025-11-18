BEGIN;

CREATE OR REPLACE FUNCTION generate_ipv4()
	RETURNS text
	LANGUAGE plpgsql
AS $$
DECLARE
	ip text;
BEGIN
	SELECT (trunc(50+random()*200))::int || '.' || (trunc(1+random()*250))::int || '.' || (trunc(1+random()*250))::int || '.' || (trunc(1+random()*250))::int
	INTO ip;

	RETURN ip;
END $$;

DO $$
DECLARE
  users_cnt   int := 100_000;
  domains_cnt int := 1_000_000;
  carts_cnt   int := 42_000;
  orders_cnt  int := 1_100_000;
BEGIN

-- Зоны
INSERT INTO zone2(name, price)
SELECT name, price FROM (
  VALUES
    ('com',   150000),
    ('net',   130000),
    ('org',   120000),
    ('io',    390000),
    ('app',   250000),
    ('dev',   220000),
    ('ai',    590000),
    ('ru',     70000),
    ('by',     80000),
    ('site',  110000)
) AS t(name, price)
ORDER BY price DESC
ON CONFLICT DO NOTHING;

-- Пользователи
INSERT INTO app_user(email, password_hash, email_confirmed, is_admin, created_at)
SELECT
  'user' || gs || '@example.com',
  md5(random()::text),
  random() < 0.95,
  random() < 0.01,
  now() - random() * interval '120 days'
FROM generate_series(1, users_cnt) gs;

-- 2FA
INSERT INTO auth_factor(user_id, kind, public_data)
SELECT id, 'TOTP', '{"secret":"test"}'
FROM app_user
WHERE random() < 0.7;

-- Email tokens
INSERT INTO email_validation_token(token, user_id, created_at, expires_at, status)
SELECT
  md5(random()::text),
  id,
  now() - random() * interval '10 days',
  now() + (1 + random() * 10)::int * interval '1 day',
  (ARRAY['VERIFY_EMAIL','RESET_PASSWORD'])[1 + (random()*1)::int]::email_token_status
FROM app_user
WHERE random() < 0.3;

-- Зоны готовы, теперь домены
INSERT INTO domain(fqdn, zone2_id, activated_at, expires_at, created_at)
SELECT
  left(md5(random()::text), 8) || '.' || z.name,
  z.id,
  CASE WHEN random() < 0.95 THEN now() - random() * interval '90 days' END,
  now() + (10 + random() * 700)::int * interval '1 day',
  now() - random() * interval '200 days'
FROM zone2 z
CROSS JOIN generate_series(1, domains_cnt) gs
LIMIT domains_cnt
ON CONFLICT DO NOTHING;

-- DNS записи
INSERT INTO dns_record(domain_id, type, name, value, ttl)
SELECT
  d.id,
  'A',
  '@',
  generate_ipv4(),
  3600
FROM domain d
WHERE random() < 0.9;

-- NS
INSERT INTO ns_delegation(domain_id, ns_servers)
SELECT d.id,
       jsonb_build_array('ns1.example.net','ns2.example.net')
FROM domain d;

-- Корзины
INSERT INTO cart(user_id)
SELECT id FROM app_user ORDER BY random() LIMIT carts_cnt;

-- Товары в корзине
INSERT INTO cart_item(cart_id, action, term, fqdn, price)
SELECT
  c.id,
  (ARRAY['register','renew'])[1 + (random()*1)::int]::item_action,
  (ARRAY['monthly','yearly'])[1 + (random()*1)::int]::item_term,
  (SELECT fqdn FROM domain ORDER BY random() LIMIT 1),
  (10000 + (random()*600000))::bigint
FROM cart c
JOIN generate_series(1,2) g ON TRUE
ON CONFLICT DO NOTHING;

-- Заказы
INSERT INTO app_order(user_id, status, total_amount, created_at, paid_at)
SELECT
  id,
  (ARRAY['created','pending_payment','paid','cancelled','failed'])[1 + (random()*4)::int]::order_status,
  (100000 + random()*1000000)::bigint,
  now() - random() * interval '60 days',
  CASE WHEN random() < 0.5 THEN now() - random() * interval '30 days' END
FROM app_user
ORDER BY random()
LIMIT domains_cnt
ON CONFLICT DO NOTHING;

-- Позиции заказа
INSERT INTO app_order_item(order_id, action, term, domain_id)
SELECT
  o.id,
  (ARRAY['register','renew'])[1 + (random()*1)::int]::item_action,
  (ARRAY['monthly','yearly'])[1 + (random()*1)::int]::item_term,
  (SELECT id FROM domain ORDER BY random() LIMIT 1)
FROM app_order o
JOIN generate_series(1,2) g ON true;

-- Платёжные операции
INSERT INTO payment_operation(order_id, operation_id, payment_link, amount, status_raw, status_mapped, with_receipt)
SELECT
  o.id,
  'op_' || left(md5(random()::text), 8),
  'https://enter.tochka.com/'||o.id,
  o.total_amount,
  'CREATED',
  'CREATED',
  random() < 0.5
FROM app_order o
WHERE random() < 0.9
ON CONFLICT DO NOTHING;

-- Платёжные статусы
INSERT INTO payment_status(payment_operation_id, status_raw, status_mapped)
SELECT id, 'CREATED', 'CREATED' FROM payment_operation;

-- Возвраты
INSERT INTO refund(payment_operation_id, provider_refund_id, amount, status)
SELECT id, 'rf_'||left(md5(random()::text), 8), amount, 'SUCCESS'
FROM payment_operation
WHERE random() < 0.2;

-- Вебхуки
INSERT INTO webhook_event(payload_hash, raw_payload, webhook_type, amount, status_after)
SELECT
  md5(random()::text),
  'payload',
  'payment',
  100000 + random()*500000,
  'APPROVED'
FROM generate_series(1,orders_cnt*0.7);

-- Сессии
INSERT INTO user_session(user_id, jwt_id, access, refresh, issued_at, expires_at)
SELECT
  id,
  gen_random_uuid(),
  md5(random()::text),
  md5(random()::text),
  now() - random() * interval '10 days',
  now() + random() * interval '30 days'
FROM app_user;

INSERT INTO domain_member(user_id, domain_id, role, created_at)
SELECT
  u.id,
  d.id,
  'OWNER',
  now() - random() * interval '100 days'
FROM app_user u
JOIN domain d ON random() < 0.05
LIMIT users_cnt*0.8;

-- Запрещённые имена
INSERT INTO forbidden_name(label)
SELECT
  md5(random()::text)
FROM generate_series(1, 5000) g;

-- Зарезервированные имена
INSERT INTO reserved_name(label)
SELECT
  md5(random()::text)
FROM generate_series(1, 5000) g;

-- Настройки уведомлений о продлении доменов
INSERT INTO expiry_email_pref(user_id, days_before, enabled, created_at, updated_at)
SELECT
  id,
  (ARRAY[1, 3, 7, 14, 30])[1 + (random()*4)::int],
  random() < 0.9,
  now() - random() * interval '30 days',
  now() - random() * interval '10 days'
FROM app_user
WHERE random() < 0.3
ON CONFLICT (user_id, days_before) DO NOTHING;

-- email_validation_token
INSERT INTO email_validation_token(token, user_id, created_at, expires_at, status)
SELECT
  md5(random()::text),
  id,
  now() - random() * interval '5 days',
  now() + (1 + random() * 10) * interval '1 day',
  (ARRAY['VERIFY_EMAIL','RESET_PASSWORD'])[1 + (random()*1)::int]::email_token_status
FROM app_user
WHERE random() < 0.2
ON CONFLICT DO NOTHING;

BEGIN
  DECLARE
    uids uuid[];
  BEGIN
    SELECT array_agg(id) INTO uids FROM app_user;

    FOR months in 0..9 LOOP
      FOR seconds in 1..10000 LOOP
        INSERT INTO event(actor_type, actor_id, action, resource, ip, at)
        SELECT
          (ARRAY['user','admin','system'])[1 + (random()*2)::int],
          uids[months + seconds],
          (ARRAY['login', 'logout', 'create_payment', 'delete_dns_record'])[1 + (random()*3)::int],
          (ARRAY[uids[months + seconds]::text, 'example.com'])[1 + (random()*1)::int],
          generate_ipv4(),
          now() + seconds * '1 second'::interval + months * '1 month'::interval;
      END LOOP;
    END LOOP;
  END;
END;

END $$;

DROP FUNCTION IF EXISTS generate_ipv4;

COMMIT;

ANALYZE;

VACUUM;
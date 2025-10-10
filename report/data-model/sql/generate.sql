begin;

DO $conf$
BEGIN
  RAISE NOTICE 'Target counts: users=%, zones=%, domains=%, orders=%',
    200000, 200, 2000000, 2400000;
END
$conf$;

CREATE OR REPLACE FUNCTION _hi(start_ int, chunk int, total int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT LEAST(start_ + chunk - 1, total)
$$;

-- 1) ZONE2 (200)
DO $$
DECLARE
  total  int := 200;
  chunk  int := 100000; -- мало, но пусть унифицировано
  s      int;
  e      int;
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO zone2 (name, price, created_at, updated_at)
    SELECT
      format('zone-%s', g),
      (1000 + g * 100)::bigint,
      now() - (g || ' days')::interval,
      now() - (g || ' days')::interval
    FROM generate_series(s, e) g;
    s := e + 1;
  END LOOP;

  DROP TABLE IF EXISTS _z;
  CREATE TEMP TABLE _z AS
  SELECT id, row_number() OVER () AS rn
  FROM zone2;
END $$;

-- 2) USERS (200,000)
DO $$
DECLARE
  total  int := 200000;
  chunk  int := 100000;
  s      int;
  e      int;
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO app_user (email, password_hash, email_confirmed, is_admin, created_at, updated_at)
	SELECT
	  'user' || lpad(g::text, 6, '0') || '@example.com',
	  'hashed_pw_' || g::text,
	  (g % 5 = 0),
	  (g % 1000 = 0),
	  now() - (g % 365 || ' days')::interval,
	  now() - (g % 365 || ' days')::interval
	FROM generate_series(s, e) g;
    s := e + 1;
  END LOOP;

  DROP TABLE IF EXISTS _u;
  CREATE TEMP TABLE _u AS
  SELECT id, row_number() OVER () AS rn
  FROM app_user;
END $$;

-- 3) 2FA (40,000)
DO $$
DECLARE
  total  int := 40000;
  chunk  int := 100000;
  s      int;
  e      int;
  ucnt   int := (SELECT count(*) FROM _u);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO auth_factor (user_id, kind, public_data, created_at, updated_at)
    SELECT
      u.id,
      CASE WHEN g % 3 = 0 THEN 'WebAuthn'::auth_factor_kind ELSE 'TOTP'::auth_factor_kind END,
      jsonb_build_object('label', format('factor-%s', g)),
      now() - (g % 180 || ' days')::interval,
      now() - (g % 180 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g % ucnt) + 1;
    s := e + 1;
  END LOOP;
END $$;

-- 4) EMAIL TOKENS (20,000)
DO $$
DECLARE
  total  int := 20000;
  chunk  int := 100000;
  s      int;
  e      int;
  ucnt   int := (SELECT count(*) FROM _u);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO email_validation_token (token, user_id, created_at, expires_at, status)
    SELECT
      format('token-%08s', g),
      u.id,
      now() - (g % 20 || ' days')::interval,
      now() + ((g % 15) || ' days')::interval,
      CASE WHEN g % 2 = 0 THEN 'VERIFY_EMAIL'::email_token_status ELSE 'RESET_PASSWORD'::email_token_status END
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g % ucnt) + 1;
    s := e + 1;
  END LOOP;
END $$;

-- 5) EXPIRY EMAIL PREF (10,000)
DO $$
DECLARE
  total  int := 10000;
  chunk  int := 100000;
  s      int;
  e      int;
  ucnt   int := (SELECT count(*) FROM _u);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO expiry_email_pref (user_id, days_before, enabled, created_at, updated_at)
    SELECT DISTINCT
      u.id,
      (ARRAY[1,7,14,30,60,90])[1 + (g % 6)],
      (g % 10 <> 0),
      now() - (g % 90 || ' days')::interval,
      now() - (g % 90 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g % ucnt) + 1
    ON CONFLICT (user_id, days_before) DO NOTHING;
    s := e + 1;
  END LOOP;
END $$;

-- 6) DOMAINS (2,000,000)
DO $$
DECLARE
  total  int := 2000000;
  chunk  int := 100000;
  s      int;
  e      int;
  zcnt   int := (SELECT count(*) FROM _z);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO domain (fqdn, zone2_id, activated_at, expires_at, created_at, updated_at)
    SELECT
      ('d' || lpad(g::text, 7, '0') || '.example')::varchar(63),
      z.id,
      CASE WHEN g % 5 = 0 THEN NULL ELSE now() - (g % 40 || ' days')::interval END,
      now() + ((g % 365) || ' days')::interval,
      now() - (g % 400 || ' days')::interval,
      now() - (g % 400 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _z z ON z.rn = (g % zcnt) + 1;
    s := e + 1;
  END LOOP;

  DROP TABLE IF EXISTS _d;
  CREATE TEMP TABLE _d AS
  SELECT id, row_number() OVER () AS rn
  FROM domain;
END $$;

-- 7) NS DELEGATIONS (140,000)
DO $$
DECLARE
  total  int := 140000;
  chunk  int := 100000;
  s      int;
  e      int;
  dcnt   int := (SELECT count(*) FROM _d);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO ns_delegation (domain_id, ns_servers, applied_at, created_at, updated_at)
    SELECT
      d.id,
      jsonb_build_array(
        format('ns-%s.a.example.net', (g % 50)+1),
        format('ns-%s.b.example.net', (g % 50)+1)
      ),
      CASE WHEN g % 3 = 0 THEN NULL ELSE now() - (g % 30 || ' days')::interval END,
      now() - (g % 60 || ' days')::interval,
      now() - (g % 60 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _d d ON d.rn = (g * 13 % dcnt) + 1;
    s := e + 1;
  END LOOP;
END $$;

-- 8) CARTS (260,000) + CART ITEMS (540,000)
DO $$
DECLARE
  total_c int := 260000;
  total_i int := 540000;
  chunk   int := 100000;
  s       int;
  e       int;
  ucnt    int := (SELECT count(*) FROM _u);
BEGIN
  -- carts
  s := 1;
  WHILE s <= total_c LOOP
    e := _hi(s, chunk, total_c);
    INSERT INTO cart (user_id, created_at, updated_at)
    SELECT
      u.id,
      now() - (g % 120 || ' days')::interval,
      now() - (g % 120 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g * 17 % ucnt) + 1;
    s := e + 1;
  END LOOP;

  DROP TABLE IF EXISTS _c;
  CREATE TEMP TABLE _c AS
  SELECT id, row_number() OVER () AS rn
  FROM cart;

  -- cart items
  s := 1;
  WHILE s <= total_i LOOP
    e := _hi(s, chunk, total_i);
    INSERT INTO cart_item (cart_id, action, term, fqdn, price, created_at, updated_at)
    SELECT
      c.id,
      CASE WHEN g % 2 = 0 THEN 'register'::item_action ELSE 'renew'::item_action END,
      CASE WHEN g % 3 = 0 THEN 'yearly'::item_term ELSE 'monthly'::item_term END,
      format('cart-%08s.example', g),
      (1000 + (g % 200) * 10)::bigint,
      now() - (g % 60 || ' days')::interval,
      now() - (g % 60 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _c c ON c.rn = (g * 7 % (SELECT count(*) FROM _c)) + 1
    ON CONFLICT (cart_id, fqdn, action, term) DO NOTHING;
    s := e + 1;
  END LOOP;
END $$;

-- 9) RESERVED NAMES (1,000)
DO $$
DECLARE
  total  int := 1000;
  s      int := 1;
  e      int := total;
BEGIN
  INSERT INTO reserved_name (label, reason, created_at, updated_at)
  SELECT
    format('reserved-%04s', g),
    CASE WHEN g % 3 = 0 THEN 'brand' ELSE 'abuse' END,
    now() - (g || ' days')::interval,
    now() - (g || ' days')::interval
  FROM generate_series(s, e) g
  ON CONFLICT (label) DO NOTHING;
END $$;

-- 10) USER SESSIONS (1,000,000)
DO $$
DECLARE
  total  int := 1000000;
  chunk  int := 100000;
  s      int;
  e      int;
  ucnt   int := (SELECT count(*) FROM _u);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO user_session (user_id, jwt_id, access, refresh, ip, user_agent, device, issued_at, expires_at, last_access_at)
    SELECT
      u.id,
      gen_random_uuid(),
      format('access-%s', g),
      format('refresh-%s', g),
      format('192.0.2.%s', (g % 250) + 1),
      'Mozilla/5.0',
      CASE WHEN g % 2 = 0 THEN 'desktop' ELSE 'mobile' END,
      now() - (g % 30 || ' days')::interval,
      now() + (30 || ' days')::interval,
      CASE WHEN g % 5 = 0 THEN NULL ELSE now() - (g % 10 || ' days')::interval END
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g * 29 % ucnt) + 1;
    s := e + 1;
  END LOOP;
END $$;

-- 11) ORDERS (1,200,000), ORDER ITEMS (=1,200,000),
--     PAYMENT OPERATIONS (=1,200,000), PAYMENT STATUS (=1,200,000),
--     REFUNDS (~8%), WEBHOOK EVENTS (~33%)
DO $$
DECLARE
  total_o int := 1200000;
  chunk   int := 100000;
  s       int;
  e       int;
  ucnt    int := (SELECT count(*) FROM _u);
  dcnt    int := (SELECT count(*) FROM _d);
BEGIN
  -- orders
  s := 1;
  WHILE s <= total_o LOOP
    e := _hi(s, chunk, total_o);
    INSERT INTO app_order (user_id, status, total_amount, created_at, paid_at, updated_at)
    SELECT
      u.id,
      (ARRAY['created','pending_payment','paid','cancelled','failed'])[1 + (g % 5)]::order_status,
      (1000 + (g % 200) * 10)::bigint,
      now() - (g % 90 || ' days')::interval,
      CASE WHEN (g % 5) = 2 THEN now() - (g % 60 || ' days')::interval END,
      now() - (g % 90 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g * 11 % ucnt) + 1;
    s := e + 1;
  END LOOP;

  DROP TABLE IF EXISTS _o;
  CREATE TEMP TABLE _o AS
  SELECT id, total_amount, status, row_number() OVER () AS rn
  FROM app_order;

  -- order items (1 per order)
  INSERT INTO app_order_item (order_id, action, term, domain_id, created_at, updated_at)
  SELECT
    o.id,
    CASE WHEN o.rn % 2 = 0 THEN 'register'::item_action ELSE 'renew'::item_action END,
    CASE WHEN o.rn % 3 = 0 THEN 'yearly'::item_term ELSE 'monthly'::item_term END,
    d.id,
    now() - (o.rn % 90 || ' days')::interval,
    now() - (o.rn % 90 || ' days')::interval
  FROM _o o
  JOIN _d d ON d.rn = (o.rn * 23 % dcnt) + 1;

  -- payment_operation
  INSERT INTO payment_operation (
    order_id, operation_id, payment_link, amount, status_raw, status_mapped,
    approved_at, created_at, expires_at, updated_at, with_receipt, receipt_payload,
    customer_code, merchant_id, payment_type
  )
  SELECT
    o.id,
    format('op-%012s', o.rn),
    format('https://pay.example/op/%012s', o.rn),
    o.total_amount,
    (ARRAY['CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED'])[1 + (o.rn % 5)],
    (ARRAY['CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED'])[1 + (o.rn % 5)]::mapped_payment_status,
    CASE WHEN (o.rn % 5) = 1 THEN now() - (o.rn % 50 || ' days')::interval END,
    now() - (o.rn % 70 || ' days')::interval,
    now() + (7 || ' days')::interval,
    now(),
    (o.rn % 4 = 0),
    CASE WHEN o.rn % 4 = 0 THEN jsonb_build_object('fiscal','ok','seq',o.rn) END,
    format('cust-%06s', (o.rn % 40000)+1),
    format('mrc-%04s', (o.rn % 200)+1),
    (ARRAY['card','bank_transfer','wallet'])[1 + (o.rn % 3)]
  FROM _o o;

  DROP TABLE IF EXISTS _po;
  CREATE TEMP TABLE _po AS
  SELECT id, row_number() OVER () AS rn
  FROM payment_operation;

  -- payment_status (1 per op)
  INSERT INTO payment_status (payment_operation_id, status_raw, status_mapped, raw_payload, created_at)
  SELECT
    po.id,
    (ARRAY['CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED'])[1 + (po.rn % 5)],
    (ARRAY['CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED'])[1 + (po.rn % 5)]::mapped_payment_status,
    format('payload-%s', po.rn),
    now() - (po.rn % 30 || ' days')::interval
  FROM _po po;

  -- refunds (~8.3%)
  INSERT INTO refund (payment_operation_id, provider_refund_id, amount, status, created_at, updated_at)
  SELECT
    po.id,
    format('rf-%010s', po.rn),
    GREATEST(0, (po.rn % 5) * 1000)::bigint,
    (ARRAY['pending','succeeded','failed'])[1 + (po.rn % 3)],
    now() - (po.rn % 20 || ' days')::interval,
    now() - (po.rn % 20 || ' days')::interval
  FROM _po po
  WHERE po.rn % 12 = 0;

  -- webhook events (~33%)
  INSERT INTO webhook_event (
    payment_operation_id, payload_hash, raw_payload,
    webhook_type, operation_id, merchant_id, customer_code, payment_type, amount, status_after,
    created_at
  )
  SELECT
    po.id,
    format('wh-%012s', po.rn),
    format('raw-%s', po.rn),
    (ARRAY['status_update','refund_update'])[1 + (po.rn % 2)],
    format('op-%012s', po.rn),
    format('mrc-%04s', (po.rn % 200)+1),
    format('cust-%06s', (po.rn % 40000)+1),
    (ARRAY['card','bank_transfer','wallet'])[1 + (po.rn % 3)],
    ((po.rn % 200) * 10 + 1000)::bigint,
    (ARRAY['CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED'])[1 + (po.rn % 5)]::mapped_payment_status,
    now() - (po.rn % 10 || ' days')::interval
  FROM _po po
  WHERE po.rn % 3 = 0;
END $$;

-- 12) domain_member
DO $$
DECLARE
  total  int := 400000;
  chunk  int := 100000;
  s      int;
  e      int;
  ucnt   int := (SELECT count(*) FROM _u);
  dcnt   int := (SELECT count(*) FROM _d);
BEGIN
  s := 1;
  WHILE s <= total LOOP
    e := _hi(s, chunk, total);
    INSERT INTO domain_member (user_id, domain_id, role, created_at)
    SELECT
      u.id,
      d.id,
      CASE WHEN (g % 5 = 0) THEN 'OWNER'::domain_member_role ELSE 'USER'::domain_member_role END,
      now() - (g % 200 || ' days')::interval
    FROM generate_series(s, e) g
    JOIN _u u ON u.rn = (g * 19 % ucnt) + 1
    JOIN _d d ON d.rn = (g * 37 % dcnt) + 1
    ON CONFLICT DO NOTHING;
    s := e + 1;
  END LOOP;
END $$;

ANALYZE;

commit;
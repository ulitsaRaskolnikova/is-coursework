DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
	SELECT t.table_name
    FROM information_schema.tables  AS t
    JOIN information_schema.columns AS c
      ON c.table_schema = t.table_schema
      AND c.table_name = t.table_name
      AND c.column_name = 'updated_at'
    WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I;', r.table_name, r.table_name);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

DROP TABLE IF EXISTS
  user_session,
  domain_member,
  event,
  forbidden_name,
  reserved_name,
  webhook_event,
  refund,
  payment_status,
  payment_operation,
  app_order_item,
  app_order,
  cart_item,
  cart,
  ns_delegation,
  dns_record,
  domain,
  zone2,
  expiry_email_pref,
  email_validation_token,
  auth_factor,
  app_user
CASCADE;

DROP TYPE IF EXISTS
  domain_member_role,
  mapped_payment_status,
  order_status,
  item_term,
  item_action,
  domain_record_type,
  email_token_status,
  auth_factor_kind
CASCADE;
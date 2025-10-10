DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'app_user','auth_factor','expiry_email_pref','zone2','domain',
    'dns_record','ns_delegation','cart','cart_item','app_order',
    'app_order_item','payment_operation','payment_status','refund',
    'reserved_name','domain_member','user_session'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I;', t, t);
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
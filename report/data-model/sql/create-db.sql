CREATE TYPE auth_factor_kind AS ENUM ('TOTP', 'WebAuthn');

CREATE TYPE email_token_status AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

CREATE TYPE domain_record_type AS ENUM ('A','AAAA','CNAME','TXT','MX','SRV','CAA');

CREATE TYPE item_action AS ENUM ('register','renew');
CREATE TYPE item_term   AS ENUM ('monthly','yearly');

CREATE TYPE order_status AS ENUM ('created','pending_payment','paid','cancelled','failed');

CREATE TYPE mapped_payment_status AS ENUM ('CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED');

CREATE TYPE domain_member_role AS ENUM ('OWNER','USER');

CREATE TABLE app_user (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email           text NOT NULL UNIQUE,
    password_hash   text NOT NULL,
    email_confirmed boolean NOT NULL DEFAULT false,
    is_admin        boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_factor (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    kind        auth_factor_kind NOT NULL,
    public_data jsonb NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_factor_user_id_idx ON auth_factor(user_id);

CREATE TABLE email_validation_token (
    token      text PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    status     email_token_status NOT NULL
);
CREATE INDEX email_validation_token_expires_at_idx ON email_validation_token(expires_at);

CREATE TABLE expiry_email_pref (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    days_before integer NOT NULL CHECK (days_before >= 0),
    enabled     boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, days_before)
);

CREATE TABLE zone2 (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL UNIQUE,
    price      bigint NOT NULL CHECK (price >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE domain (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fqdn         varchar(63) NOT NULL UNIQUE,
    zone2_id     uuid NOT NULL REFERENCES zone2(id) ON DELETE RESTRICT,
    activated_at timestamptz,            -- NULL = не активирован
    expires_at   timestamptz NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX domain_expires_at_idx ON domain(expires_at);

CREATE TABLE domain_member (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    domain_id  uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
    role       domain_member_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, domain_id)
);

CREATE TABLE dns_record (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id  uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
    type       domain_record_type NOT NULL,
    name       varchar(255) NOT NULL,
    value      varchar(1024) NOT NULL,
    ttl        integer NOT NULL CHECK (ttl > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dns_record_domain_id_idx ON dns_record(domain_id);

CREATE TABLE ns_delegation (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id  uuid NOT NULL UNIQUE REFERENCES domain(id) ON DELETE CASCADE,
    ns_servers jsonb NOT NULL,
    applied_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cart (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cart_item (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id    uuid NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    action     item_action NOT NULL,
    term       item_term NOT NULL,
    fqdn       text NOT NULL,
    price      bigint NOT NULL CHECK (price >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (cart_id, fqdn, action, term)
);

CREATE TABLE app_order (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    status       order_status NOT NULL DEFAULT 'created',
    total_amount bigint NOT NULL CHECK (total_amount >= 0),
    created_at   timestamptz NOT NULL DEFAULT now(),
    paid_at      timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_order_user_id_idx ON app_order(user_id);
CREATE INDEX app_order_created_at_paid_at_idx ON app_order(created_at, paid_at) WHERE paid_at IS NULL;

CREATE TABLE app_order_item (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   uuid NOT NULL REFERENCES app_order(id) ON DELETE CASCADE,
    action     item_action NOT NULL,
    term       item_term   NOT NULL,
    domain_id  uuid NOT NULL REFERENCES domain(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_order_item_order_id_idx ON app_order_item(order_id);

CREATE TABLE payment_operation (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        uuid NOT NULL REFERENCES app_order(id) ON DELETE CASCADE,
    operation_id    varchar(255) UNIQUE,
    payment_link    varchar(255),
    amount          bigint NOT NULL CHECK (amount >= 0),
    status_raw      varchar(255) NOT NULL,
    status_mapped   mapped_payment_status NOT NULL,
    approved_at     timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    with_receipt    boolean NOT NULL DEFAULT false,
    receipt_payload jsonb,

    customer_code varchar(255),
    merchant_id   varchar(255),
    payment_type  varchar(255)
);
CREATE INDEX payment_operation_order_id_idx ON payment_operation(order_id);

CREATE TABLE payment_status (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_operation_id uuid NOT NULL REFERENCES payment_operation(id) ON DELETE CASCADE,
    status_raw           varchar(255) NOT NULL,
    status_mapped        mapped_payment_status NOT NULL,
    raw_payload          varchar(255),
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_status_op_id_idx ON payment_status(payment_operation_id);

CREATE TABLE refund (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_operation_id uuid NOT NULL REFERENCES payment_operation(id) ON DELETE CASCADE,
    provider_refund_id   varchar(255),
    amount               bigint NOT NULL CHECK (amount >= 0),
    status               varchar(255) NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refund_op_id_idx ON refund(payment_operation_id);

CREATE TABLE webhook_event (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_operation_id uuid REFERENCES payment_operation(id) ON DELETE SET NULL,
    payload_hash         varchar(255),
    raw_payload          varchar(255),

    webhook_type         varchar(255),
    operation_id         varchar(255),
    merchant_id          varchar(255),
    customer_code        varchar(255),
    payment_type         varchar(255),
    amount               bigint,
    status_after         mapped_payment_status,

    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reserved_name (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label      text NOT NULL UNIQUE,
    reason     text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE forbidden_name (
    id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label text NOT NULL UNIQUE
);

CREATE TABLE event (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type varchar(64) NOT NULL,  -- 'user' | 'admin' | 'system'
    actor_id   uuid,
    action     text NOT NULL,
    resource   text,
    ip         text,
    at         timestamptz NOT NULL
);
CREATE INDEX event_at_idx ON event USING BRIN(at);
CREATE INDEX event_actor_idx ON event(actor_type, actor_id);

CREATE TABLE user_session (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    jwt_id         uuid NOT NULL UNIQUE,  -- jti
    access         varchar(255) NOT NULL,
    refresh        varchar(255) NOT NULL,
    ip             varchar(40),
    user_agent     varchar(255),
    device         varchar(255),
    issued_at      timestamptz NOT NULL,
    expires_at     timestamptz NOT NULL,
    last_access_at timestamptz
);
CREATE INDEX user_session_user_id_idx ON user_session(user_id);
CREATE INDEX user_session_expires_at_idx ON user_session(expires_at);


CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
	t.table_name
    FROM information_schema.tables AS t
    JOIN information_schema.columns AS c
      ON c.table_schema = t.table_schema
        AND c.table_name = t.table_name
        AND c.column_name = 'updated_at'
    WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
	AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION set_updated_at()',
      r.table_name, r.table_name
    );
    END LOOP;
END $$;
CREATE TYPE auth_factor_kind AS ENUM ('TOTP', 'WebAuthn');

CREATE TYPE email_token_status AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

CREATE TYPE domain_record_type AS ENUM ('A','AAAA','CNAME','TXT','MX','SRV','CAA');

CREATE TYPE item_action AS ENUM ('register','renew');
CREATE TYPE item_term   AS ENUM ('monthly','yearly');

CREATE TYPE order_status AS ENUM ('created','pending_payment','paid','cancelled','failed');

CREATE TYPE mapped_payment_status AS ENUM ('CREATED','APPROVED','ON_REFUND','REFUNDED','EXPIRED');

CREATE TYPE domain_member_role AS ENUM ('OWNER','USER');

CREATE TABLE app_user (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email            text NOT NULL UNIQUE,
    password_hash    text NOT NULL,
    email_confirmed  boolean NOT NULL DEFAULT false,
    is_admin         boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE auth_factor (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    kind         auth_factor_kind NOT NULL,
    public_data  jsonb NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE email_validation_token (
    token        text PRIMARY KEY,
    user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL,
    status       email_token_status NOT NULL
);
CREATE INDEX email_validation_token_expires_at_idx ON email_validation_token(expires_at);

CREATE TABLE expiry_email_pref (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    days_before  integer NOT NULL CHECK (days_before >= 0),
    enabled      boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, days_before)
);

CREATE TABLE zone2 (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL UNIQUE,
    price       bigint NOT NULL CHECK (price >= 0),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE domain (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fqdn          varchar(63) NOT NULL UNIQUE,
    zone2_id      uuid NOT NULL REFERENCES zone2(id) ON DELETE RESTRICT,
    activated_at  timestamptz,            -- NULL = не активирован
    expires_at    timestamptz NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
create index domain_fqnd_idx on domain(fqdn);
CREATE INDEX domain_zone2_id_idx ON domain(zone2_id);
CREATE INDEX domain_expires_at_idx ON domain(expires_at);

CREATE TABLE dns_record (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id   uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
    type        domain_record_type NOT NULL,
    name        varchar(255) NOT NULL,
    value       varchar(1024) NOT NULL,
    ttl         integer NOT NULL CHECK (ttl > 0),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dns_record_domain_id_idx ON dns_record(domain_id);

CREATE TABLE ns_delegation (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id    uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
    ns_servers   jsonb NOT NULL,
    applied_at   timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ns_delegation_domain_id_idx ON ns_delegation(domain_id);

CREATE TABLE cart (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cart_user_id_idx ON cart(user_id);

CREATE TABLE cart_item (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id     uuid NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    action      item_action NOT NULL,
    term        item_term   NOT NULL,
    fqdn        text NOT NULL,
    price       bigint NOT NULL CHECK (price >= 0),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (cart_id, fqdn, action, term)
);
CREATE INDEX cart_item_cart_id_idx ON cart_item(cart_id);

CREATE TABLE app_order (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    status        order_status NOT NULL DEFAULT 'created',
    total_amount  bigint NOT NULL CHECK (total_amount >= 0),
    created_at    timestamptz NOT NULL DEFAULT now(),
    paid_at       timestamptz,
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_order_user_id_idx   ON app_order(user_id);
CREATE INDEX app_order_status_idx    ON app_order(status);
CREATE INDEX app_order_created_at_paid_at_idx ON app_order(created_at, paid_at);

CREATE TABLE app_order_item (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    uuid NOT NULL REFERENCES app_order(id) ON DELETE CASCADE,
    action      item_action NOT NULL,
    term        item_term   NOT NULL,
    domain_id   uuid NOT NULL REFERENCES domain(id) ON DELETE RESTRICT,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_order_item_order_id_idx ON app_order_item(order_id);
CREATE INDEX app_order_item_domain_id_idx ON app_order_item(domain_id);

CREATE TABLE payment_operation (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         uuid NOT NULL REFERENCES app_order(id) ON DELETE CASCADE,
    operation_id     varchar(255) UNIQUE,
    payment_link     varchar(255),
    amount           bigint NOT NULL CHECK (amount >= 0),
    status_raw       varchar(255) NOT NULL,
    status_mapped    mapped_payment_status NOT NULL,
    approved_at      timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    expires_at       timestamptz,
    updated_at       timestamptz NOT NULL DEFAULT now(),
    with_receipt     boolean NOT NULL DEFAULT false,
    receipt_payload  jsonb,

    customer_code    varchar(255),
    merchant_id      varchar(255),
    payment_type     varchar(255)
);
CREATE INDEX payment_operation_order_id_idx  ON payment_operation(order_id);
CREATE INDEX payment_operation_status_idx    ON payment_operation(status_mapped);
CREATE INDEX payment_operation_expires_idx   ON payment_operation(expires_at);

CREATE TABLE payment_status (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_operation_id  uuid NOT NULL REFERENCES payment_operation(id) ON DELETE CASCADE,
    status_raw            varchar(255) NOT NULL,
    status_mapped         mapped_payment_status NOT NULL,
    raw_payload           varchar(255),
    created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_status_op_id_idx ON payment_status(payment_operation_id);

CREATE TABLE refund (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_operation_id  uuid NOT NULL REFERENCES payment_operation(id) ON DELETE CASCADE,
    provider_refund_id    varchar(255),
    amount                bigint NOT NULL CHECK (amount >= 0),
    status                varchar(255) NOT NULL,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refund_op_id_idx ON refund(payment_operation_id);

CREATE TABLE webhook_event (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_operation_id  uuid REFERENCES payment_operation(id) ON DELETE SET NULL,
    payload_hash          varchar(255) UNIQUE,
    raw_payload           varchar(255),

    webhook_type          varchar(255),
    operation_id          varchar(255),
    merchant_id           varchar(255),
    customer_code         varchar(255),
    payment_type          varchar(255),
    amount                bigint,
    status_after          mapped_payment_status,

    created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webhook_event_created_at_idx ON webhook_event(created_at);

CREATE TABLE reserved_name (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label       text NOT NULL UNIQUE,
    reason      text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);
create index reserved_name_label_idx on reserved_name(label);

CREATE TABLE forbidden_name (
    id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label  text NOT NULL UNIQUE
);
create index forbidden_name_label_idx on forbidden_name(label);

CREATE TABLE event (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type  varchar(64) NOT NULL,  -- 'user' | 'admin' | 'system'
    actor_id    uuid,
    action      text NOT NULL,
    resource    text,
    ip          text,
    at          timestamptz NOT NULL
);
CREATE INDEX event_at_idx ON event(at);
CREATE INDEX event_actor_idx ON event(actor_type, actor_id);

CREATE TABLE domain_member (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    domain_id   uuid NOT NULL REFERENCES domain(id) ON DELETE CASCADE,
    role        domain_member_role NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, domain_id)
);
CREATE INDEX domain_member_domain_id_idx ON domain_member(domain_id);

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
CREATE INDEX user_session_user_id_idx    ON user_session(user_id);
CREATE INDEX user_session_expires_at_idx ON user_session(expires_at);


CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

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
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I_set_updated_at ON %I; CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;
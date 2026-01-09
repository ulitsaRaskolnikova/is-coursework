--liquibase formatted sql

--changeset system:004-create-function
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS '
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
' LANGUAGE plpgsql;

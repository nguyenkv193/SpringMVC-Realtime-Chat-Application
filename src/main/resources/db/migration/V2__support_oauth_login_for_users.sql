ALTER TABLE users
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN provider_id VARCHAR(255);

ALTER TABLE users
    ALTER COLUMN password DROP NOT NULL;

ALTER TABLE users
    ADD CONSTRAINT chk_users_auth_provider
        CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

CREATE UNIQUE INDEX uq_users_provider_account
    ON users (auth_provider, provider_id)
    WHERE provider_id IS NOT NULL;
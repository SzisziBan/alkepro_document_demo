CREATE SCHEMA descriptors;

CREATE TABLE descriptors.documents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    pdf_path TEXT NOT NULL,
    validFrom DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE descriptors.pages (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    num_order INTEGER NOT NULL,
    pdf_page INTEGER NOT NULL,
    children TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL,

    CONSTRAINT unique_document_id_version_order UNIQUE (document_id, version, num_order)
);

CREATE  TABLE descriptors.field_types (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL
);

CREATE TABLE descriptors.fields (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES descriptors.documents(id),
    key TEXT NOT NULL,
    type integer NOT NULL REFERENCES descriptors.field_types(id),
    name TEXT NOT NULL,
    children TEXT[],
    default_value TEXT,
    metadata jsonb NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_key_document_id_version UNIQUE (key, document_id, version)
);

CREATE TABLE descriptors.watches (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES descriptors.documents(id),
    version INTEGER NOT NULL,
    watch jsonb NOT NULL default '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_w_document_id_version UNIQUE (document_id, version)
);

CREATE TABLE descriptors.validators (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES descriptors.documents(id),
    version INTEGER NOT NULL,
    validator jsonb NOT NULL default '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_v_document_id_version UNIQUE (document_id, version)
)
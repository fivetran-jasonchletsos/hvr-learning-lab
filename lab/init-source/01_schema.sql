-- Seed schema for the HVR Learning Lab source location.
-- Deliberately small and boring: the point is to watch HVR replicate it, not to admire the data model.

CREATE TABLE customers (
    customer_id   INTEGER PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL,
    region        VARCHAR(40)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    order_id      INTEGER PRIMARY KEY,
    customer_id   INTEGER NOT NULL REFERENCES customers(customer_id),
    order_status  VARCHAR(20) NOT NULL,
    order_total   NUMERIC(10,2) NOT NULL,
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO customers (customer_id, full_name, email, region) VALUES
    (1, 'Ada Whitfield',   'ada.whitfield@example.com',   'NA'),
    (2, 'Marcus Chen',     'marcus.chen@example.com',     'APAC'),
    (3, 'Priya Raman',     'priya.raman@example.com',     'EMEA'),
    (4, 'Liam O''Connor',  'liam.oconnor@example.com',    'EMEA'),
    (5, 'Sofia Reyes',     'sofia.reyes@example.com',     'LATAM');

INSERT INTO orders (order_id, customer_id, order_status, order_total) VALUES
    (100, 1, 'SHIPPED',   129.99),
    (101, 2, 'PENDING',    54.50),
    (102, 3, 'SHIPPED',   899.00),
    (103, 1, 'CANCELLED',  19.99),
    (104, 4, 'PENDING',   210.25);

-- Logical replication requires a REPLICA IDENTITY for UPDATE/DELETE capture on tables without it implicitly covered by the primary key.
-- Primary keys already give us REPLICA IDENTITY DEFAULT, which is sufficient for this lab.

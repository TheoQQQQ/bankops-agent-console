-- ============================================================
-- V1 – Initial schema
-- Mimics a simplified legacy core-banking case management table.
-- ============================================================

CREATE TABLE customer_case (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    case_ref      VARCHAR(20)   NOT NULL,
    customer_id   VARCHAR(20)   NOT NULL,
    customer_name VARCHAR(120)  NOT NULL,
    case_type     VARCHAR(30)   NOT NULL,   -- FRAUD_ALERT | KYC_REVIEW | CREDIT_LIMIT | AML_FLAG
    status        VARCHAR(20)   NOT NULL,   -- PENDING | UNDER_REVIEW | APPROVED | REJECTED | ESCALATED
    risk_level    VARCHAR(10)   NOT NULL,   -- LOW | MEDIUM | HIGH | CRITICAL
    amount        DECIMAL(18,2),
    description   TEXT          NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_customer_case PRIMARY KEY (id),
    CONSTRAINT uq_case_ref      UNIQUE (case_ref)
);

CREATE TABLE audit_log (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    case_id       BIGINT,
    actor         VARCHAR(60)   NOT NULL,   -- "OPERATOR:<username>" | "AI_AGENT"
    action        VARCHAR(50)   NOT NULL,   -- VIEWED | AI_ANALYSED | APPROVED | REJECTED | ESCALATED | NOTE_ADDED
    detail        TEXT,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_audit_log PRIMARY KEY (id)
);

-- ============================================================
-- Seed data – realistic-looking synthetic cases
-- ============================================================
INSERT INTO customer_case (case_ref, customer_id, customer_name, case_type, status, risk_level, amount, description) VALUES
('CASE-2024-0001', 'CUST-44821', 'Matti Virtanen',     'FRAUD_ALERT',  'PENDING',      'HIGH',     4200.00,  'Multiple consecutive card-not-present transactions from three different countries within 40 minutes. Velocity threshold exceeded.'),
('CASE-2024-0002', 'CUST-39104', 'Liisa Korhonen',     'KYC_REVIEW',   'PENDING',      'MEDIUM',   NULL,     'Identity document expiry approaching. PEP screening returned one partial name match requiring manual confirmation.'),
('CASE-2024-0003', 'CUST-58720', 'Erik Johansson',     'CREDIT_LIMIT', 'PENDING',      'LOW',      15000.00, 'Customer requests credit limit increase from €15,000 to €30,000. Income verification documents uploaded. No adverse credit history.'),
('CASE-2024-0004', 'CUST-71293', 'Anna Müller',        'AML_FLAG',     'UNDER_REVIEW', 'CRITICAL', 87500.00, 'Structured deposits across six business days totalling €87,500 – pattern consistent with smurfing. STR filed automatically.'),
('CASE-2024-0005', 'CUST-20045', 'Juha Leinonen',      'FRAUD_ALERT',  'PENDING',      'HIGH',     1350.00,  'Chargeback dispute on three transactions. Merchant claims goods delivered; customer denies receipt. Device fingerprint mismatch.'),
('CASE-2024-0006', 'CUST-83471', 'Maria García',       'KYC_REVIEW',   'PENDING',      'MEDIUM',   NULL,     'New business account application. UBO declaration lists three beneficial owners. One owner nationality flagged by sanctions screening.'),
('CASE-2024-0007', 'CUST-62910', 'Pekka Mäkinen',     'CREDIT_LIMIT', 'APPROVED',     'LOW',      5000.00,  'Standard credit limit review, within automated approval parameters. No manual intervention required.'),
('CASE-2024-0008', 'CUST-91234', 'Sophie Dubois',      'AML_FLAG',     'PENDING',      'HIGH',     32000.00, 'Incoming wire from jurisdiction classified as high-risk by FATF. Customer relationship is 7 months old. Purpose of funds unclear.');

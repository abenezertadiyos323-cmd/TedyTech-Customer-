# DATABASE.MD — TedyTech Admin Mini App Database Specifications

> **USAGE NOTE**: This document contains all database schema, tables, relationships, and data requirements. For frontend UI specifications, see `FRONTEND.md`. For API and business logic, see `BACKEND.md`.

---

## TABLE OF CONTENTS

1. [Existing Tables (Frozen)](#existing-tables-frozen)
2. [New Tables to Create](#new-tables-to-create)
3. [Schema Modifications](#schema-modifications)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Indexes](#indexes)
6. [Data Validation Constraints](#data-validation-constraints)
7. [Seed Data Requirements](#seed-data-requirements)
8. [Migration Scripts](#migration-scripts)
9. [Query Examples](#query-examples)

---

## EXISTING TABLES (Frozen)

> **⚠️ WARNING**: These tables already exist. Do NOT modify their core structure. Only add new columns as specified below.

### Products Table (phones)

**Existing columns (DO NOT CHANGE):**
- id (PRIMARY KEY)
- brand (VARCHAR)
- model (VARCHAR)
- price (INTEGER) — in ETB
- storage (VARCHAR)
- color (VARCHAR)
- condition (VARCHAR)
- key_highlights (TEXT)
- in_stock (BOOLEAN)
- new_arrival (BOOLEAN)
- premium (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Accessories Table

**Existing columns (DO NOT CHANGE):**
- id (PRIMARY KEY)
- name (VARCHAR)
- model (VARCHAR)
- condition (VARCHAR)
- price (INTEGER)
- quantity (INTEGER)
- storage (VARCHAR)
- active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Deposits Table

**Existing columns (DO NOT CHANGE):**
- id (PRIMARY KEY)
- telegram_user (VARCHAR)
- item (VARCHAR)
- amount (INTEGER)
- status (VARCHAR) — Values: 'Active', 'Pending Receipt', 'Expired', 'Released'
- dates (JSONB or related fields)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Commissions Table

**Existing columns (DO NOT CHANGE):**
- id (PRIMARY KEY)
- status (VARCHAR) — Values: 'Pending', 'Paid'
- (other existing fields)

---

## NEW TABLES TO CREATE

### 1. admin_activity_log

**Purpose:** Track all admin actions for accountability and audit trail.

```sql
CREATE TABLE admin_activity_log (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| action_type | VARCHAR(50) | Event type (see below) |
| entity_type | VARCHAR(50) | 'phone', 'accessory', 'deposit', 'exchange', 'commission', 'lead' |
| entity_id | VARCHAR(100) | ID of the affected entity |
| admin_email | VARCHAR(255) | Email of admin who performed action |
| details | JSONB | Optional additional context (old/new values, etc.) |
| created_at | TIMESTAMP | When action occurred |

**Action Types:**
- `product_created`
- `product_edited`
- `product_deleted`
- `product_archived`
- `product_unarchived`
- `price_reduced`
- `product_featured`
- `stock_adjusted`
- `deposit_released`
- `deposit_expired`
- `exchange_quoted`
- `exchange_accepted`
- `exchange_rejected`
- `commission_paid`
- `lead_tag_updated`
- `lead_status_updated`

---

### 2. price_history

**Purpose:** Track price changes for products.

```sql
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL,
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| product_id | VARCHAR(100) | ID of the product |
| product_type | VARCHAR(20) | 'phone' or 'accessory' |
| old_price | INTEGER | Price before change (ETB) |
| new_price | INTEGER | Price after change (ETB) |
| changed_by | VARCHAR(255) | Admin email who made change |
| changed_at | TIMESTAMP | When change occurred |

**Business Rules:**
- Max 5 entries per product (oldest deleted when new added)
- Query: Latest 5 ordered by `changed_at DESC`

---

### 3. leads

**Purpose:** Track customer inquiries from Telegram bot.

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  telegram_user_id VARCHAR(100) NOT NULL,
  telegram_username VARCHAR(100),
  phone_number VARCHAR(20),
  product_id VARCHAR(100),
  phone_model_text VARCHAR(200),
  tag VARCHAR(20) DEFAULT 'cold',
  status VARCHAR(20) DEFAULT 'active',
  first_message_at TIMESTAMP NOT NULL,
  last_message_at TIMESTAMP NOT NULL,
  last_customer_message TEXT,
  admin_reply_count INTEGER DEFAULT 0,
  keywords_detected JSONB,
  budget_detected INTEGER,
  assigned_admin VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| telegram_user_id | VARCHAR(100) | Telegram unique ID |
| telegram_username | VARCHAR(100) | @username |
| phone_number | VARCHAR(20) | Customer phone if provided |
| product_id | VARCHAR(100) | Linked product (nullable) |
| phone_model_text | VARCHAR(200) | What they typed/asked about |
| tag | VARCHAR(20) | 'hot', 'warm', 'cold' |
| status | VARCHAR(20) | 'active', 'converted', 'lost' |
| first_message_at | TIMESTAMP | First contact |
| last_message_at | TIMESTAMP | Most recent message |
| last_customer_message | TEXT | Preview of last message |
| admin_reply_count | INTEGER | How many times admin replied |
| keywords_detected | JSONB | ['payment', 'location', etc.] |
| budget_detected | INTEGER | Extracted budget amount (ETB) |
| assigned_admin | VARCHAR(255) | Admin handling this lead |

---

### 4. conversation_messages

**Purpose:** Store raw conversation messages from Telegram.

```sql
CREATE TABLE conversation_messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  telegram_user_id VARCHAR(100) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  message_text TEXT NOT NULL,
  detected_keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment primary key |
| lead_id | INTEGER | Foreign key to leads table |
| telegram_user_id | VARCHAR(100) | Telegram unique ID |
| direction | VARCHAR(10) | 'inbound' (customer) or 'outbound' (admin/bot) |
| message_text | TEXT | Full message content |
| detected_keywords | JSONB | Keywords found in this message |
| created_at | TIMESTAMP | When message was sent |

---

### 5. exchanges

**Purpose:** Store trade-in evaluation requests.

```sql
CREATE TABLE exchanges (
  id SERIAL PRIMARY KEY,
  trade_in_id VARCHAR(50) UNIQUE NOT NULL,
  customer_telegram_id VARCHAR(100) NOT NULL,
  customer_username VARCHAR(100),

  -- Trade-in device info
  trade_device_brand VARCHAR(50),
  trade_device_model VARCHAR(100),
  trade_device_imei VARCHAR(20),
  trade_device_storage_gb INTEGER,

  -- Evidence
  photo_urls JSONB,
  photos_provided BOOLEAN DEFAULT false,
  battery_health_screenshot_url TEXT,
  battery_health_percent INTEGER,
  battery_proof_provided BOOLEAN DEFAULT false,

  -- Grading
  condition_grade VARCHAR(10),
  face_id_working BOOLEAN,
  true_tone_enabled BOOLEAN,
  original_screen BOOLEAN,
  icloud_signed_out BOOLEAN,
  physical_defects JSONB,

  -- IMEI Check
  imei_status VARCHAR(20),
  imei_checked_at TIMESTAMP,

  -- Valuation
  base_price_etb INTEGER,
  deductions_breakdown JSONB,
  total_deductions_etb INTEGER,
  trade_in_value_etb INTEGER,

  -- Customer wants
  desired_device_id VARCHAR(100),
  desired_device_price_etb INTEGER,
  customer_top_up_etb INTEGER,

  -- Status tracking
  status VARCHAR(30) DEFAULT 'pending_evaluation',
  quoted_at TIMESTAMP,
  responded_at TIMESTAMP,

  -- Admin tracking
  admin_assigned VARCHAR(100),
  evaluated_by VARCHAR(100),
  evaluation_notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Status Values:**
- `pending_evaluation` — Awaiting admin to start evaluation
- `awaiting_customer` — Waiting for customer to provide photos/info
- `quoted` — Quote sent, waiting for customer response
- `accepted` — Customer accepted quote
- `rejected` — Rejected (by admin or auto-rejected)
- `expired` — Customer didn't respond within 48h

**photo_urls JSONB Structure:**
```json
{
  "front": "https://storage.example.com/front.jpg",
  "back": "https://storage.example.com/back.jpg",
  "left": "https://storage.example.com/left.jpg",
  "right": "https://storage.example.com/right.jpg"
}
```

**deductions_breakdown JSONB Structure:**
```json
[
  { "reason": "No photos provided", "amount": 9750 },
  { "reason": "Grade C (Fair)", "amount": 9750 },
  { "reason": "Battery (assumed 75%)", "amount": 13000 }
]
```

**physical_defects JSONB:**
```json
["cracked_screen", "back_glass_cracked", "camera_lens_damaged", "dents"]
```

---

### 6. market_prices

**Purpose:** Store typical market prices for trade-in valuation.

```sql
CREATE TABLE market_prices (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  storage_gb INTEGER,
  typical_price_etb INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand, model, storage_gb)
);
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| brand | VARCHAR(50) | Apple, Samsung, Xiaomi, etc. |
| model | VARCHAR(100) | iPhone 13, Galaxy S23, etc. |
| storage_gb | INTEGER | 64, 128, 256, 512 |
| typical_price_etb | INTEGER | Current Addis Ababa market rate |
| last_updated | TIMESTAMP | When price was last updated |

---

### 7. repair_costs

**Purpose:** Store repair costs for valuation deductions.

```sql
CREATE TABLE repair_costs (
  id SERIAL PRIMARY KEY,
  model VARCHAR(100) NOT NULL,
  repair_type VARCHAR(50) NOT NULL,
  cost_etb INTEGER NOT NULL,
  UNIQUE(model, repair_type)
);
```

**Repair Types:**
- `screen` — Screen replacement cost
- `back_glass` — Back glass replacement
- `battery` — Battery replacement

---

### 8. daily_demand_stats

**Purpose:** Aggregate daily demand for performance queries.

```sql
CREATE TABLE daily_demand_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  phone_model VARCHAR(200) NOT NULL,
  inquiry_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  UNIQUE(date, phone_model)
);
```

---

### 9. question_stats

**Purpose:** Track question type frequency.

```sql
CREATE TABLE question_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(date, question_type)
);
```

**Question Types:**
- `availability` — "Is this available?"
- `price_negotiation` — "Can you reduce price?"
- `color_storage` — "Do you have in [color/storage]?"
- `payment` — Payment-related questions
- `location` — Location/meetup questions

---

### 10. quotes

**Purpose:** Store generated quotes for tracking.

```sql
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  model VARCHAR(200) NOT NULL,
  storage VARCHAR(50),
  condition VARCHAR(50),
  price_etb INTEGER NOT NULL,
  battery_health INTEGER,
  warranty_days INTEGER DEFAULT 30,
  valid_until TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 11. payments

**Purpose:** Track verified payments.

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  quote_id INTEGER REFERENCES quotes(id),
  transaction_id VARCHAR(100),
  amount_etb INTEGER NOT NULL,
  payment_method VARCHAR(50),
  screenshot_url TEXT,
  verified_by VARCHAR(255),
  amount_match BOOLEAN,
  verified_at TIMESTAMP DEFAULT NOW()
);
```

**Payment Methods:**
- `telebirr`
- `cbe_mobile`
- `bank_transfer`
- `cash`

---

### 12. meetups

**Purpose:** Track scheduled meetups.

```sql
CREATE TABLE meetups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  location VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 13. message_templates

**Purpose:** Store reusable message templates.

```sql
CREATE TABLE message_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(50) UNIQUE NOT NULL,
  language VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB
);
```

**Template Keys:**
- `request_trade_in_proof`
- `quote_message`
- `meetup_confirmation`
- `payment_verified`
- `rejection_message`
- `icloud_unlock_instructions`

---

## SCHEMA MODIFICATIONS

### Products Table — New Columns

```sql
ALTER TABLE products ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN archived_at TIMESTAMP;
ALTER TABLE products ADD COLUMN featured_type VARCHAR(20);
ALTER TABLE products ADD COLUMN featured_at TIMESTAMP;
ALTER TABLE products ADD COLUMN admin_note TEXT;
```

**Column Details:**

| Column | Type | Description |
|--------|------|-------------|
| archived | BOOLEAN | TRUE if archived/sold |
| archived_at | TIMESTAMP | When archived |
| featured_type | VARCHAR(20) | 'new_arrival', 'premium', or NULL |
| featured_at | TIMESTAMP | When featured (for sorting) |
| admin_note | TEXT | Internal admin notes (max 200 chars) |

---

### Accessories Table — New Columns

```sql
ALTER TABLE accessories ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE accessories ADD COLUMN archived_at TIMESTAMP;
```

---

## RELATIONSHIPS & FOREIGN KEYS

```
leads (1) ─────────────── (many) conversation_messages
  │
  ├──────────────────────── (many) quotes
  │
  ├──────────────────────── (many) payments
  │
  └──────────────────────── (many) meetups

products ──────────────── (many) price_history

exchanges ─────────────── (references) products (desired_device_id)
```

### Foreign Key Constraints

```sql
ALTER TABLE conversation_messages 
  ADD CONSTRAINT fk_conversation_lead 
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE quotes 
  ADD CONSTRAINT fk_quote_lead 
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE payments 
  ADD CONSTRAINT fk_payment_lead 
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE payments 
  ADD CONSTRAINT fk_payment_quote 
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

ALTER TABLE meetups 
  ADD CONSTRAINT fk_meetup_lead 
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
```

---

## INDEXES

### Performance Indexes

```sql
-- Activity Log
CREATE INDEX idx_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON admin_activity_log(entity_type, entity_id);

-- Price History
CREATE INDEX idx_price_history_product ON price_history(product_id, changed_at DESC);

-- Leads
CREATE INDEX idx_leads_tag ON leads(tag);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_last_message ON leads(last_message_at DESC);
CREATE INDEX idx_leads_telegram_user ON leads(telegram_user_id);

-- Conversation Messages
CREATE INDEX idx_messages_lead ON conversation_messages(lead_id, created_at DESC);
CREATE INDEX idx_messages_created ON conversation_messages(created_at DESC);

-- Exchanges
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_exchanges_customer ON exchanges(customer_telegram_id);

-- Products (new columns)
CREATE INDEX idx_products_archived ON products(archived);
CREATE INDEX idx_products_featured ON products(featured_type, featured_at DESC);

-- Daily Stats
CREATE INDEX idx_daily_demand_date ON daily_demand_stats(date);
CREATE INDEX idx_question_stats_date ON question_stats(date);
```

---

## DATA VALIDATION CONSTRAINTS

```sql
-- Leads
ALTER TABLE leads ADD CONSTRAINT chk_lead_tag 
  CHECK (tag IN ('hot', 'warm', 'cold'));

ALTER TABLE leads ADD CONSTRAINT chk_lead_status 
  CHECK (status IN ('active', 'converted', 'lost'));

-- Exchanges
ALTER TABLE exchanges ADD CONSTRAINT chk_exchange_status 
  CHECK (status IN ('pending_evaluation', 'awaiting_customer', 'quoted', 'accepted', 'rejected', 'expired'));

ALTER TABLE exchanges ADD CONSTRAINT chk_condition_grade 
  CHECK (condition_grade IN ('A', 'B', 'C'));

ALTER TABLE exchanges ADD CONSTRAINT chk_imei_status 
  CHECK (imei_status IN ('clean', 'blacklisted', 'unknown'));

-- Price History
ALTER TABLE price_history ADD CONSTRAINT chk_price_positive 
  CHECK (old_price > 0 AND new_price > 0);

-- Accessories
ALTER TABLE accessories ADD CONSTRAINT chk_quantity_range 
  CHECK (quantity >= 0 AND quantity <= 999);

-- Products admin_note length
-- (Enforce in application layer - max 200 characters)
```

---

## SEED DATA REQUIREMENTS

### Market Pricing Data

> **[NEEDS CLARIFICATION]**: Do you have current Addis Ababa prices for these models?

```sql
INSERT INTO market_prices (brand, model, storage_gb, typical_price_etb) VALUES
('Apple', 'iPhone 12', 64, 50000),
('Apple', 'iPhone 12', 128, 55000),
('Apple', 'iPhone 12 Pro', 128, 65000),
('Apple', 'iPhone 12 Pro', 256, 72000),
('Apple', 'iPhone 13', 128, 75000),
('Apple', 'iPhone 13', 256, 82000),
('Apple', 'iPhone 13 Pro', 128, 88000),
('Apple', 'iPhone 13 Pro', 256, 95000),
('Apple', 'iPhone 14', 128, 95000),
('Apple', 'iPhone 14 Pro', 128, 110000),
('Apple', 'iPhone 15', 128, 120000),
('Apple', 'iPhone 15 Pro', 256, 140000),
('Samsung', 'Galaxy S21', 128, 45000),
('Samsung', 'Galaxy S22', 128, 55000),
('Samsung', 'Galaxy S23', 128, 65000),
('Samsung', 'Galaxy S23 Ultra', 256, 85000);
```

---

### Screen Repair Costs

```sql
INSERT INTO repair_costs (model, repair_type, cost_etb) VALUES
('iPhone 12', 'screen', 7000),
('iPhone 12 Pro', 'screen', 8000),
('iPhone 13', 'screen', 9000),
('iPhone 13 Pro', 'screen', 10000),
('iPhone 14', 'screen', 11000),
('iPhone 14 Pro', 'screen', 12000),
('iPhone 15', 'screen', 13000),
('iPhone 15 Pro', 'screen', 15000),
('Galaxy S21', 'screen', 6000),
('Galaxy S22', 'screen', 7000),
('Galaxy S23', 'screen', 8000),
('Galaxy S23 Ultra', 'screen', 10000);
```

---

### Message Templates

```sql
INSERT INTO message_templates (template_key, language, content, variables) VALUES
('request_trade_in_proof', 'en', 
 E'📸 Trade-In Requirements\n\nPlease send:\n1. 4 photos (Front, Back, Sides)\n2. Battery Health screenshot\n   (Settings > Battery > Battery Health)\n3. IMEI number (Dial *#06#)\n\nOnce received, we''ll send your quote within 10 minutes.', 
 '{}'),

('request_trade_in_proof', 'am', 
 E'📸 የመለዋወጫ መስፈርቶች\n\nእባክዎ ይላኩ:\n1. 4 ፎቶዎች (ፊት፣ ኋላ፣ ጎኖች)\n2. የባትሪ ጤና ማያ ገጽ\n3. የIMEI ቁጥር (*#06# ደውሉ)\n\nከደረሰ በኋላ በ10 ደቂቃ ውስጥ ዋጋ እንልክልዎታለን።', 
 '{}'),

('icloud_unlock_instructions', 'en',
 E'⚠️ Action Required: Sign out of iCloud\n\nSteps:\n1. Settings > [Your Name] > Sign Out\n2. Enter Apple ID password\n3. Turn off "Find My iPhone"\n4. Confirm sign out\n\nOnce done, reply "Ready" to continue evaluation.',
 '{}');
```

---

## MIGRATION SCRIPTS

### Migration 001: Add Product Archive Columns

```sql
-- Migration: 001_add_product_archive_columns.sql
-- Date: 2026-02-02

BEGIN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_type VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS admin_note TEXT;

ALTER TABLE accessories ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured_type, featured_at DESC);

COMMIT;
```

---

### Migration 002: Create Activity Log

```sql
-- Migration: 002_create_activity_log.sql

BEGIN;

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON admin_activity_log(entity_type, entity_id);

COMMIT;
```

---

### Migration 003: Create Price History

```sql
-- Migration: 003_create_price_history.sql

BEGIN;

CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL,
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id, changed_at DESC);

COMMIT;
```

---

### Migration 004: Create Leads System

```sql
-- Migration: 004_create_leads_system.sql

BEGIN;

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  telegram_user_id VARCHAR(100) NOT NULL,
  telegram_username VARCHAR(100),
  phone_number VARCHAR(20),
  product_id VARCHAR(100),
  phone_model_text VARCHAR(200),
  tag VARCHAR(20) DEFAULT 'cold',
  status VARCHAR(20) DEFAULT 'active',
  first_message_at TIMESTAMP NOT NULL,
  last_message_at TIMESTAMP NOT NULL,
  last_customer_message TEXT,
  admin_reply_count INTEGER DEFAULT 0,
  keywords_detected JSONB,
  budget_detected INTEGER,
  assigned_admin VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  telegram_user_id VARCHAR(100) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  message_text TEXT NOT NULL,
  detected_keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_tag ON leads(tag);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_last_message ON leads(last_message_at DESC);
CREATE INDEX idx_messages_lead ON conversation_messages(lead_id, created_at DESC);

COMMIT;
```

---

### Migration 005: Create Exchanges System

```sql
-- Migration: 005_create_exchanges_system.sql

BEGIN;

CREATE TABLE IF NOT EXISTS exchanges (
  id SERIAL PRIMARY KEY,
  trade_in_id VARCHAR(50) UNIQUE NOT NULL,
  customer_telegram_id VARCHAR(100) NOT NULL,
  customer_username VARCHAR(100),
  trade_device_brand VARCHAR(50),
  trade_device_model VARCHAR(100),
  trade_device_imei VARCHAR(20),
  trade_device_storage_gb INTEGER,
  photo_urls JSONB,
  photos_provided BOOLEAN DEFAULT false,
  battery_health_screenshot_url TEXT,
  battery_health_percent INTEGER,
  battery_proof_provided BOOLEAN DEFAULT false,
  condition_grade VARCHAR(10),
  face_id_working BOOLEAN,
  true_tone_enabled BOOLEAN,
  original_screen BOOLEAN,
  icloud_signed_out BOOLEAN,
  physical_defects JSONB,
  imei_status VARCHAR(20),
  imei_checked_at TIMESTAMP,
  base_price_etb INTEGER,
  deductions_breakdown JSONB,
  total_deductions_etb INTEGER,
  trade_in_value_etb INTEGER,
  desired_device_id VARCHAR(100),
  desired_device_price_etb INTEGER,
  customer_top_up_etb INTEGER,
  status VARCHAR(30) DEFAULT 'pending_evaluation',
  quoted_at TIMESTAMP,
  responded_at TIMESTAMP,
  admin_assigned VARCHAR(100),
  evaluated_by VARCHAR(100),
  evaluation_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_prices (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  storage_gb INTEGER,
  typical_price_etb INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand, model, storage_gb)
);

CREATE TABLE IF NOT EXISTS repair_costs (
  id SERIAL PRIMARY KEY,
  model VARCHAR(100) NOT NULL,
  repair_type VARCHAR(50) NOT NULL,
  cost_etb INTEGER NOT NULL,
  UNIQUE(model, repair_type)
);

CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_exchanges_customer ON exchanges(customer_telegram_id);

COMMIT;
```

---

## QUERY EXAMPLES

### Get Last 5 Price Changes for Product

```sql
SELECT old_price, new_price, changed_by, changed_at
FROM price_history
WHERE product_id = 'prod_123'
ORDER BY changed_at DESC
LIMIT 5;
```

### Get Dashboard Stats

```sql
-- Products In Stock
SELECT COUNT(*) AS products_in_stock
FROM products
WHERE in_stock = true AND archived = false;

-- Active Deposits
SELECT COUNT(*) AS active_deposits
FROM deposits
WHERE status = 'Active';

-- Pending Exchanges
SELECT COUNT(*) AS pending_exchanges
FROM exchanges
WHERE status IN ('pending_evaluation', 'quoted');

-- Unpaid Commissions
SELECT COUNT(*) AS unpaid_commissions
FROM commissions
WHERE status != 'Paid';
```

### Get Hot Leads

```sql
SELECT l.*, 
       COUNT(cm.id) as message_count
FROM leads l
LEFT JOIN conversation_messages cm ON l.id = cm.lead_id
WHERE l.tag = 'hot' AND l.status = 'active'
GROUP BY l.id
ORDER BY l.last_message_at DESC
LIMIT 20;
```

### Get Inventory with Health Status

```sql
SELECT p.*,
       CASE 
         WHEN p.archived = true THEN 'inactive'
         WHEN NOT p.in_stock THEN 'inactive'
         WHEN p.in_stock AND COALESCE(inquiry_count, 0) >= 1 THEN 'healthy'
         WHEN COALESCE(inquiry_count, 0) = 0 AND 
              p.created_at > NOW() - INTERVAL '30 days' THEN 'needs_attention'
         ELSE 'problem'
       END as health_status
FROM products p
LEFT JOIN (
  SELECT phone_model_text, COUNT(*) as inquiry_count
  FROM leads
  WHERE last_message_at > NOW() - INTERVAL '7 days'
  GROUP BY phone_model_text
) l ON p.model ILIKE '%' || l.phone_model_text || '%'
WHERE p.archived = false
ORDER BY p.created_at DESC;
```

### Calculate Exchange Success Rate

```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status IN ('quoted', 'accepted', 'rejected')) as total_quoted,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'accepted') / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('quoted', 'accepted', 'rejected')), 0),
    0
  ) as success_rate_percent
FROM exchanges
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Get Scams Prevented Count

```sql
SELECT COUNT(*) as scams_prevented
FROM exchanges
WHERE imei_status = 'blacklisted' 
   OR icloud_signed_out = false;
```

---

## TESTING REQUIREMENTS

Before marking complete, verify:

- [ ] All new tables created successfully
- [ ] All ALTER TABLE statements executed
- [ ] All indexes created
- [ ] Seed data inserted (market_prices, repair_costs, message_templates)
- [ ] Foreign key constraints work correctly
- [ ] Check constraints validate data properly
- [ ] Query examples return expected results
- [ ] Activity log captures all specified events
- [ ] Price history limited to 5 entries per product

---

## OPEN QUESTIONS

> **[NEEDS CLARIFICATION]**: 

1. **Market pricing data**: Do you have current Addis Ababa prices for iPhone 12-15 and Samsung S21-S24 models, or should we use placeholder values?

2. **IMEI API**: Should we integrate CheckMEND (~$0.15/check) or wait for Ethiopian carrier API access?

3. **Telegram image sync**: Is bot → Convex image upload already working?

4. **Storage preference**: Use Convex only or also Cloudflare R2 for videos?

---

**END OF DATABASE SPECIFICATIONS**

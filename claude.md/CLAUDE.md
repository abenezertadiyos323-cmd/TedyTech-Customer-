# CLAUDE.md — TedyTech Admin Mini App Additions

## EXECUTION CONTRACT

You are implementing admin-only additions to the TedyTech Admin Mini App.
This document defines what you MUST do, what you MUST NOT do, and the exact scope of each addition.

---

## FROZEN FEATURES — DO NOT CHANGE

The following features ALREADY EXIST and must NOT be modified, redesigned, or removed:

### Navigation

- Bottom nav: Home, Inventory, Deposits, Inbox
- Top bar: "TedyTech Admin" title, Logout icon
- Floating Action Button (+) with Quick Actions sheet

### Screens

- Dashboard (Home): Keep all existing content
- Inventory: Keep tabs (All Products, New Arrivals, Premium, Accessories)
- Deposits: Keep table with columns (Telegram User, Item, Amount, Dates, Status)
- Inbox: Keep tabs (Exchange, Affiliates)
- Create Phone: Keep all form fields and validation
- Create Accessory: Keep all form fields and validation
- Login: Keep email/password flow, saved account feature

### Data Models

- Phone fields: Brand, Model, Price, Storage, Color, Condition, Key Highlights, In Stock, New Arrival, Premium Pick
- Accessory fields: Name/Model, Condition, Price, Quantity, Storage, Active
- Deposit statuses: Active, Pending Receipt, Expired, Released
- Exchange statuses: New, Quoted, Accepted, Rejected
- Commission statuses: (existing, likely Pending, Paid)

### Automation Hooks

- Category auto-creation for Phones/Accessories
- Quick Action pre-fill for New Arrival tag
- Login persistence via localStorage
- Access control redirects

### API Endpoints

- All existing /api/admin/\* endpoints must remain functional
- Do not rename or restructure existing endpoints

---

## ADDITIONS TO IMPLEMENT

### 1. Product Edit & Delete Actions

**Location:** Inventory screen, per product row
**Add:**

- "Edit" icon → navigates to /admin/edit-phone/:id or /admin/edit-accessory/:id (same form as create, pre-filled)
- "Delete" icon → confirmation dialog → DELETE from DB

**Rules:**

- Edit form must use existing field structure
- Delete must require confirmation ("Delete this iPhone 13? This cannot be undone.")
- After delete, return to Inventory with item removed

---

### 2. Deposit Action Buttons

**Location:** Deposits screen, per deposit row
**Add buttons:**

- "Release Hold" → status = Released, item returns to stock
- "Mark as Paid" → status = Released (or Completed if adding new status)
- "Expire Now" → status = Expired, item returns to stock

**Rules:**

- Each action updates DB immediately
- Log admin action with timestamp (for future audit trail)
- Refresh row after action

---

### 3. Exchange Request Actions

**Location:** Inbox > Exchange tab, per request row
**Add buttons:**

- "Send Quote" → opens modal/input for quote amount (ETB) → saves to exchange record → status = Quoted
- "Approve" → status = Accepted
- "Reject" → status = Rejected

**Rules:**

- Quote amount is required before approval
- Rejected exchanges cannot be re-quoted (final)
- Status badge updates after action

---

### 4. Sold / Archive Toggle

**Location:** Inventory screen, per product row
**Add:**

- "Archive" / "Mark as Sold" button
- Archived products: hidden from customer queries, visible in admin "Archived" tab

**Rules:**

- Add "Archived" tab to Inventory tabs
- Archived items can be restored (unarchived)
- Do not delete data; set status flag

---

### 5. Inline Stock Count Adjustment (Accessories Only)

**Location:** Inventory screen, accessory rows
**Add:**

- +/- stepper buttons next to Quantity value
- Tap + → quantity +1 → save to DB
- Tap - → quantity -1 (minimum 0) → save to DB

**Rules:**

- Only for accessories (phones have no quantity field)
- Debounce or immediate save (immediate preferred)
- Visual feedback: number updates on screen

---

### 6. Commission Payout Action

**Location:** Inbox > Affiliates tab > Commissions table, per row
**Add:**

- "Mark as Paid" button

**Rules:**

- Updates status to Paid with timestamp
- No financial processing (tracking only)
- Disable button if already Paid

---

### 7. Activity Log

**Location:** New tab "Activity" in bottom nav OR section on Dashboard
**Display:**

- Table/list of recent admin actions
- Columns: Action, Item, Admin, Timestamp
- Show last 50 entries, newest first

**Log these events:**

- Product created
- Product edited
- Product deleted
- Product archived/unarchived
- Deposit status changed
- Exchange quoted/approved/rejected
- Commission marked as paid

**Rules:**

- Read-only (no editing/deleting logs)
- Include admin identifier (email or ID)
- Timestamp in local timezone

---

### 8. Duplicate Product Warning

**Location:** Create Phone form, on submit
**Logic:**

- Before saving, check DB for existing product with same: Brand + Model + Storage + Color + Condition
- If match found: show warning dialog with options "Add Anyway" or "Cancel"
- If no match: proceed normally

**Rules:**

- Warning only (not blocking)
- Do not apply to accessories (less risk)
- Match must be exact on all 5 fields

---

### 9. Price Change History

**Location:** Edit Phone/Accessory screen
**Add:**

- Section showing last 5 price changes: Old Price → New Price, Date

**Logic:**

- On product edit (price changed), log: product_id, old_price, new_price, timestamp, admin
- Store in new table: price_history

**Rules:**

- Display only (no editing history)
- Max 5 entries per product (oldest deleted when new added)
- Show "No price changes yet" if empty

---

### 10. Dashboard Quick Stats

**Location:** Dashboard screen, top section
**Add 4 stat cards:**

1. "Products In Stock" → count of products where in_stock = true
2. "Active Deposits" → count of deposits where status = Active
3. "Pending Exchanges" → count of exchanges where status = New or Quoted
4. "Unpaid Commissions" → count of commissions where status ≠ Paid

**Rules:**

- Tapping a card navigates to relevant section
- Fetch counts from existing data (no new models)
- Update on Dashboard load

---

---

## 11. Inventory Screen Enhancements

**Location:** Inventory screen (all tabs: All Products, New Arrivals, Premium, Accessories)

### Visual Status Indicators (Per Product Row)

**Add status badges/icons:**

- 🔥 **HOT** badge if: inquiries in last 7 days ≥ 5
- ⚠️ **COLD** badge if: 0 inquiries in last 14 days
- 📦 **LOW STOCK** badge if: stock < 2 units (phones) OR quantity < 5 (accessories)
- 💰 **PRICE DROPPED** badge if: price reduced in last 7 days
- ⏰ **AGING** badge if: added to inventory > 30 days ago AND 0 sales

**Display per row:**

```
iPhone 13 Pro - 256GB - Excellent
92,000 ETB | Stock: 3 | 🔥 HOT | Added: 3 days ago
[Edit] [Delete] [Archive] [Feature]
```

**Rules:**

- Multiple badges can show simultaneously
- Badges update on page load (no real-time refresh needed)
- Badge data pulled from leads/conversation_messages tables (Hot/Cold) + inventory timestamps

---

### Inline Quick Actions (Per Product Row)

**Add action buttons:**

1. **[-5%]** button
   - Action: Reduce price by 5%, save immediately
   - Log price change to price_history table
   - Show toast: "Price reduced to [new_price] ETB"

2. **[-10%]** button
   - Same as -5% but 10% reduction

3. **[Feature]** button (replaces current implementation if exists)
   - Action: Toggle featured status (new_arrival OR premium)
   - If clicked on All Products tab → modal asks "Feature as: [New Arrival] [Premium Pick]"
   - Featured items auto-pin to top of their respective tabs
   - Badge shows: ⭐ FEATURED

4. **[Duplicate]** button
   - Action: Opens Create Phone/Accessory form pre-filled with all data from this item
   - Only change required: admin manually adjusts fields that differ (e.g., storage, color)
   - Saves time when adding similar models

**Button layout:**

```
Quick: [-5%] [-10%] [Feature] [Duplicate]
```

**Rules:**

- Price reduction buttons only visible if price > 10,000 ETB (prevent reducing low-value items to 0)
- All actions log to admin_activity_log
- Duplicate button copies everything except: ID, created_at, archived status

---

### Performance Metrics Panel (Expandable Per Product)

**Add:** Small "📊 Stats" link/button on each product row

**When clicked, expands inline to show:**

```
┌─────────────────────────────────────────────────┐
│ 📊 Performance (Last 30 Days)                   │
├─────────────────────────────────────────────────┤
│ • Views: 47 (from customer queries)             │
│ • Inquiries: 12 (unique users asked about it)   │
│ • Avg negotiation: -8,000 ETB                   │
│ • Days in inventory: 18                         │
│ • Last inquiry: 2 days ago                      │
│ • Conversion: 0 sales (if tracking exists)      │
└─────────────────────────────────────────────────┘
```

**Data sources:**

- Views/Inquiries: Count from leads table where phone_model_text matches this product
- Avg negotiation: If price history shows reductions, calculate average
- Days in inventory: created_at vs current date
- Last inquiry: latest lead.last_message_at for this model

**Rules:**

- Panel toggles on/off (click to expand, click again to collapse)
- If no inquiry data exists: Show "No customer inquiries yet"
- Only visible to admin (not customer-facing)

---

### Smart Sorting Options

**Add sort dropdown at top of Inventory screen:**

```
Sort by: [Recently Added ▼]
```

**Options:**

- Recently Added (default, newest first)
- Price: High → Low
- Price: Low → High
- Stock: Low → High (surfaces items about to run out)
- Days in Inventory: Old → New (finds slow movers)
- Most Inquiries (requires leads data, Hot → Cold)
- Least Inquiries (finds dead inventory)

**Rules:**

- Sort persists during session (localStorage)
- Default resets on page reload
- Sort applies to current tab only (All Products, New Arrivals, etc.)

---

### Color-Coded Row Backgrounds

**Apply background colors to rows based on health status:**

- 🟢 **GREEN tint**: Stock ≥ 3 AND inquiries in last 7 days ≥ 1 (Healthy)
- 🟡 **YELLOW tint**: Stock < 3 OR (0 inquiries in last 14 days AND inventory age < 30 days) (Needs Attention)
- 🔴 **RED tint**: Stock < 2 AND 0 inquiries in last 14 days (Problem)
- ⚫ **GRAY**: Archived OR out of stock (Inactive)

**Rules:**

- Colors are subtle background tints, not solid blocks
- Text remains readable (ensure contrast)
- Priority: Red > Yellow > Green (if multiple conditions apply, show worst status)

---

### Accessory Stock Stepper (Accessories Tab Only)

**For accessory rows, add +/- buttons next to Quantity:**

```
Quantity: 12  [−] [+]
```

**Actions:**

- Tap **[+]** → quantity +1 → save to DB immediately
- Tap **[−]** → quantity -1 (minimum 0) → save to DB immediately
- If quantity reaches 0 → show "Out of Stock" badge, keep item visible

**Rules:**

- Only on Accessories tab (phones don't have quantity field)
- No debounce needed (immediate save per click is fine)
- Log to admin_activity_log: "Stock adjusted: [product_name] [old_qty] → [new_qty]"

---

### Notes/Tags System (Optional - Low Priority)

**Add per product:**

- Small text link: "Add note" (if no note exists) OR shows first 30 chars of existing note
- Click → opens modal with textarea
- Saves to products table: `admin_note` TEXT field

**Example notes:**

- "Battery health 89% - price negotiable"
- "VIP customer reserved until Friday"
- "Screen has minor scratch - disclosed to customers"

**Rules:**

- Notes visible only to admin (never shown to customers)
- Max 200 characters
- Optional field (not required)

---

## DATABASE ADDITIONS FOR INVENTORY ENHANCEMENTS

### New Columns on Products Table

```sql
ALTER TABLE products ADD COLUMN featured_type VARCHAR(20);  -- 'new_arrival', 'premium', or NULL
ALTER TABLE products ADD COLUMN featured_at TIMESTAMP;
ALTER TABLE products ADD COLUMN admin_note TEXT;
```

**Logic:**

- When admin clicks [Feature] → set featured_type and featured_at
- Sort: Featured items (featured_at DESC) appear first in their tab
- Auto-unfeature after 7 days (optional): WHERE featured_at < NOW() - INTERVAL '7 days'

---

## NEW API ENDPOINTS FOR INVENTORY ENHANCEMENTS

```
PATCH /api/admin/products/:id/price-adjust
  → Body: { reduction_percent: 5 | 10 }
  → Calculates new price, updates DB, logs to price_history

PATCH /api/admin/products/:id/feature
  → Body: { featured_type: 'new_arrival' | 'premium' | null }
  → Updates featured_type and featured_at

POST /api/admin/products/:id/duplicate
  → Body: (none, copies all fields from source product)
  → Returns new product ID for redirect to edit form

GET /api/admin/products/:id/performance
  → Returns: views, inquiries, avg_negotiation, days_in_inventory, last_inquiry_at
  → Queries leads table + price_history

PATCH /api/admin/accessories/:id/quantity
  → Body: { quantity: number }
  → Updates accessory quantity (immediate save)

PATCH /api/admin/products/:id/note
  → Body: { note: string }
  → Updates admin_note field
```

---

## IMPLEMENTATION RULES FOR INVENTORY SCREEN

### DO

- Add all visual indicators (badges, colors) to existing product rows
- Implement inline quick actions without redesigning layout
- Add performance metrics as collapsible panel per row
- Use existing component styles for consistency
- Log all price changes and featured toggles to activity log

### DO NOT

- Change existing tab structure (All Products, New Arrivals, Premium, Accessories)
- Modify Create Phone/Accessory forms (except pre-filling for Duplicate action)
- Remove existing Edit/Delete buttons (already implemented in core additions)
- Change product card layout drastically (augment, don't rebuild)
- Make inventory metrics customer-facing (admin-only data)

---

## EDGE CASES FOR INVENTORY ENHANCEMENTS

### Price Reduction

- If product price < 10,000 ETB: Hide [-5%] and [-10%] buttons (show message: "Manual edit required for low-price items")
- If 5% reduction would make price < 5,000 ETB: Block action, show warning
- Log includes both old and new price for audit

### Featured Toggle

- If product already featured as "New Arrival" and admin clicks [Feature] again → modal asks "Switch to Premium Pick?" or "Unfeature"
- Only 1 featured type per product at a time
- Featured items auto-expire after 7 days (optional setting)

### Duplicate Action

- Warn if duplicate will create 6th identical product (Brand + Model + Storage + Condition match)
- Pre-fill form but require admin to manually submit (no auto-save)

### Performance Metrics

- If no leads data exists yet: Show "Lead tracking not active - metrics unavailable"
- If phone model text in leads doesn't exactly match product: Use fuzzy matching (e.g., "iphone 13" matches "iPhone 13 Pro")

### Stock Stepper (Accessories)

- If quantity already 0 and admin clicks [-]: Do nothing (minimum is 0)
- If quantity > 999: Disable [+] button (max inventory limit)

---

## TESTING REQUIREMENTS FOR INVENTORY SCREEN

Before marking complete, verify:

- [ ] All status badges (🔥📦⚠️💰⏰) appear correctly based on rules
- [ ] Price reduction buttons calculate correctly and log to price_history
- [ ] Feature toggle updates DB and moves item to top of relevant tab
- [ ] Duplicate action pre-fills form with all source data
- [ ] Performance metrics panel shows/hides on click
- [ ] Sort dropdown reorders products correctly
- [ ] Color-coded rows match health status logic
- [ ] Accessory stepper increments/decrements immediately
- [ ] Notes save and display correctly (admin-only)
- [ ] No UI breaks on mobile view (responsive design intact)

---

## PRIORITY ORDER FOR INVENTORY SCREEN

Implement in this order:

1. **Visual Status Indicators** (immediate visibility into inventory health)
2. **Inline Quick Actions** ([-5%], [-10%], [Feature], [Duplicate] - saves massive time)
3. **Smart Sorting** (find problems fast)
4. **Color-Coded Rows** (instant visual triage)
5. **Accessory Stock Stepper** (efficiency for high-volume items)
6. **Performance Metrics Panel** (data-driven decisions)
7. **Notes/Tags** (context retention)

---

**End of Inventory Screen Additions**

---

## IMPLEMENTATION BOUNDARIES

### DO

- Add UI elements to existing screens
- Create new API endpoints for new actions
- Add new DB columns/tables for: archive status, activity logs, price history
- Use existing component styles
- Handle errors gracefully (show toast/message)

### DO NOT

- Change existing navigation structure
- Rename existing screens or routes
- Modify existing form fields
- Change existing status values or workflows
- Add customer-facing features
- Redesign UI layout or styling
- Remove any existing feature
- Touch authentication/login flow
- Change existing API endpoint contracts

---

## DATABASE ADDITIONS REQUIRED

### New Tables

```sql
-- Activity Log
CREATE TABLE admin_activity_log (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,  -- 'product_created', 'deposit_released', etc.
  entity_type VARCHAR(50) NOT NULL,  -- 'phone', 'accessory', 'deposit', 'exchange', 'commission'
  entity_id VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  details JSONB,  -- optional additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Price History
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL,  -- 'phone' or 'accessory'
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

### New Columns on Existing Tables

```sql
-- Products table (phones)
ALTER TABLE products ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN archived_at TIMESTAMP;

-- Accessories table (if separate)
ALTER TABLE accessories ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE accessories ADD COLUMN archived_at TIMESTAMP;
```

---

## NEW API ENDPOINTS REQUIRED

### Products

- `PUT /api/admin/products/:id` — Edit product
- `DELETE /api/admin/products/:id` — Delete product
- `PATCH /api/admin/products/:id/archive` — Archive/unarchive product
- `GET /api/admin/products/check-duplicate` — Check for duplicate before create

### Deposits

- `PATCH /api/admin/deposits/:id/status` — Update deposit status (body: { status: 'Released' | 'Expired' })

### Exchanges

- `PATCH /api/admin/exchanges/:id/quote` — Send quote (body: { quote_amount: number })
- `PATCH /api/admin/exchanges/:id/status` — Approve/reject (body: { status: 'Accepted' | 'Rejected' })

### Commissions

- `PATCH /api/admin/commissions/:id/paid` — Mark as paid

### Activity Log

- `GET /api/admin/activity` — Get recent activity (query: limit=50)

### Dashboard Stats

- `GET /api/admin/stats` — Get counts for dashboard cards

---

## TESTING REQUIREMENTS

Before marking complete, verify:

- [ ] All frozen features still work exactly as before
- [ ] Each addition functions as specified
- [ ] No console errors on any screen
- [ ] Actions update DB correctly
- [ ] Activity log captures all specified events
- [ ] Dashboard stats show correct counts
- [ ] Duplicate warning triggers on exact match only
- [ ] Archived products hidden from customer queries (verify API filter)

---

## PRIORITY ORDER

Implement in this order (highest value first):

1. Product Edit & Delete (unblocks inventory management)
2. Deposit Action Buttons (unblocks deposit resolution)
3. Exchange Request Actions (unblocks trade-in workflow)
4. Dashboard Quick Stats (immediate visibility)
5. Sold/Archive Toggle (inventory hygiene)
6. Inline Stock Adjustment (accessory efficiency)
7. Activity Log (accountability)
8. Commission Payout Action (affiliate management)
9. Duplicate Product Warning (error prevention)
10. Price Change History (nice to have)

---

## EDGE CASES TO HANDLE

### Product Delete

- If product has active deposit: Block delete, show "Cannot delete: item has active deposit"
- If product has pending exchange: Block delete, show "Cannot delete: item has pending exchange"

### Deposit Actions

- If item already sold/archived when releasing: Show warning, allow release anyway
- If deposit already expired: Hide "Expire Now" button

### Exchange Actions

- If exchange phone no longer in inventory: Still allow quoting (trade-in can proceed)
- If quote already sent: Show "Update Quote" instead of "Send Quote"

### Archive

- If archived product has active deposit: Block archive, show "Cannot archive: item has active deposit"
- Archived items must not appear in customer mini app product listings

### Stock Adjustment

- If quantity goes to 0: Keep item visible, just show "Out of Stock"
- Negative quantity: Prevent (minimum 0)

---

## SUCCESS CRITERIA

The implementation is complete when:

1. Admin can fully manage product lifecycle (create → edit → archive/delete)
2. Admin can resolve deposits without external tools
3. Admin can quote and process exchanges without Telegram manual messages
4. Admin has instant visibility into operational status via Dashboard
5. All admin actions are logged for accountability
6. No existing functionality is broken

---

## SALES INTELLIGENCE LAYER — Future Phase

This section defines the next evolution of the Admin Mini App: turning the home screen into a real-time sales decision dashboard powered by Telegram bot conversation data.

**Implementation Phase:** After core additions (1-10) are complete
**Dependency:** Requires Telegram bot to log conversation data with metadata

---

### PURPOSE

Transform the Dashboard from a static overview into an actionable sales cockpit that answers: **"What should I do right now to make a sale?"**

---

### HOME SCREEN REDESIGN

#### Section A: Today's Numbers (Top Strip)

**Purpose:** Instant pulse check. Glanceable, no tapping required.

| Stat               | What it shows                            | Why it matters                |
| ------------------ | ---------------------------------------- | ----------------------------- |
| **Active Chats**   | Conversations with messages in last 24h  | How busy is the bot right now |
| **Hot Leads**      | Count of leads tagged "Hot"              | Immediate sales opportunities |
| **Deposits Today** | Number + total ETB collected             | Cash secured today            |
| **Replies Needed** | Conversations waiting for admin response | Don't lose warm leads         |

**Layout:** 4 cards in a row, tappable to jump to relevant section.

---

#### Section B: Action Queue (Primary Focus Area)

**Purpose:** Admin's auto-generated to-do list from bot activity.

**Header:** "Needs Your Attention"

Each item is a card showing:

- Customer name (Telegram username)
- Phone they asked about
- Lead tag (Hot / Warm / Cold)
- Last message preview
- Time since last message

**Sort order:** Hot leads first, then by wait time (longest waiting at top)

**Business value:**

- Admin doesn't hunt for opportunities—they're surfaced automatically
- Hot leads don't get buried under casual browsers
- Response time drops, conversion goes up

---

#### Section C: Today's Demand Signals (Middle Section)

**Purpose:** Show what customers are actually looking for—drives inventory and TikTok content decisions.

**C1: Most Asked Phone Models (Top 5)**

| Rank | Model           | Inquiries Today |
| ---- | --------------- | --------------- |
| 1    | iPhone 13 128GB | 12              |
| 2    | Samsung S23     | 8               |
| 3    | iPhone 12 64GB  | 6               |
| 4    | Tecno Spark 10  | 5               |
| 5    | iPhone 14 Pro   | 4               |

**Admin insight:** "iPhone 13 is hot today—do I have stock? Should I post about it?"

**C2: Top Customer Questions (Top 3)**

| Question Type                     | Count |
| --------------------------------- | ----- |
| "Is this available?"              | 23    |
| "Can you reduce price?"           | 14    |
| "Do you have [model] in [color]?" | 9     |

**Admin insight:** "Lots of price negotiation today—maybe revisit margins or bundle offers."

**C3: Peak Inquiry Time**

Simple bar/indicator showing when most messages came in (e.g., "Most active: 6PM - 9PM")

**Admin insight:** "Be online and ready to close during peak hours."

---

#### Section D: Inventory Alerts (Bottom Section)

**Purpose:** Connect demand to supply—flag mismatches.

| Alert Type                    | Example                                            |
| ----------------------------- | -------------------------------------------------- |
| **High Demand, Low Stock**    | "iPhone 13 128GB: 12 inquiries, only 1 in stock"   |
| **No Inquiries This Week**    | "Samsung A14: 0 inquiries in 7 days"               |
| **Price Resistance Detected** | "iPhone 12: 8 'too expensive' responses this week" |

**Admin insight:** Know what to restock, what to discount, what to stop buying.

---

### LEAD INTELLIGENCE SYSTEM

#### What is a "Lead"?

A lead is any Telegram user who has messaged the bot about a specific phone. One user can have multiple leads (asked about multiple phones).

#### Lead Tags

| Tag         | Meaning                                 | Visual       |
| ----------- | --------------------------------------- | ------------ |
| 🔥 **Hot**  | Ready to buy—needs admin to close       | Red badge    |
| 🟡 **Warm** | Interested but hesitant—needs nurturing | Yellow badge |
| ⚪ **Cold** | Just browsing or price checking         | Gray badge   |

---

#### Lead Tagging Rules (Plain English)

**Tag as 🔥 HOT if ANY of these are true:**

1. Customer asked "How do I pay?" or "Where is your shop?"
2. Customer asked about warranty or return policy
3. Customer said "I want this one" or "I'll take it"
4. Customer asked "Is this still available?" more than once for same phone
5. Customer asked about meeting up or delivery
6. Customer sent screenshot of CBE/Telebirr (payment intent)

**Why:** These indicate buying intent—customer is solving logistics, not gathering information.

**Tag as 🟡 WARM if ANY of these are true:**

1. Customer asked for lower price or said "last price?"
2. Customer compared two phones ("which is better, X or Y?")
3. Customer asked about trade-in / exchange value
4. Customer asked "Do you have this in [different color/storage]?"
5. Customer has been in conversation for 2+ days without buying or leaving
6. Customer said "let me think" or "I'll get back to you"

**Why:** Real interest but unresolved hesitation—needs a nudge, not a hard close.

**Tag as ⚪ COLD if:**

1. Customer only asked "How much is [phone]?" and nothing else
2. Customer hasn't replied in 3+ days after receiving price
3. Customer said "just checking" or "maybe later"
4. Customer asked about 5+ different phones without depth on any

**Why:** Window shoppers. Don't ignore, but don't prioritize over hot leads.

---

#### Lead Lifecycle Flow

```
Customer sends first message
        ↓
    [Tagged COLD by default]
        ↓
Customer asks follow-up about same phone
        ↓
    [Upgraded to WARM]
        ↓
Customer asks about payment/location/availability
        ↓
    [Upgraded to HOT]
        ↓
Admin closes sale → Lead marked CONVERTED
        or
No reply for 7 days → Lead marked LOST
```

---

#### Lead Card Display (in Action Queue)

```
┌─────────────────────────────────────┐
│ 🔥 HOT                    2h ago   │
│ @customer_handle                    │
│ iPhone 13 128GB - Black             │
│ "Where is your shop located?"       │
│                                     │
│ [Reply Now]  [View Full Chat]       │
└─────────────────────────────────────┘
```

---

### DATA REQUIREMENTS FROM TELEGRAM BOT

#### What the bot must log for each conversation:

| Data Point                 | Purpose                    |
| -------------------------- | -------------------------- |
| **telegram_user_id**       | Unique identifier          |
| **telegram_username**      | Display name for admin     |
| **messages** (timestamped) | Conversation history       |
| **phone_models_mentioned** | What they're interested in |
| **keywords_detected**      | For lead tagging           |
| **first_message_at**       | Lead age                   |
| **last_message_at**        | Response urgency           |
| **admin_reply_count**      | Engagement level           |

#### Keyword Detection Patterns

**Hot keywords:**

- "available", "in stock", "still have"
- "pay", "payment", "CBE", "Telebirr", "transfer"
- "location", "shop", "where", "meet", "delivery"
- "I want", "I'll take", "reserve", "hold"
- "warranty", "guarantee", "return"

**Warm keywords:**

- "last price", "best price", "discount", "reduce"
- "compare", "which is better", "difference"
- "trade", "exchange", "my old phone"
- "think about", "get back", "let me check"
- "other color", "other storage", "different"

**Cold signals:**

- "just checking", "just asking", "maybe later"
- "how much" (if only message in conversation)
- No reply after 72 hours

---

### DATABASE ADDITIONS FOR SALES INTELLIGENCE

```sql
-- Leads table
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  telegram_user_id VARCHAR(100) NOT NULL,
  telegram_username VARCHAR(100),
  product_id VARCHAR(100),  -- nullable, may ask generally
  phone_model_text VARCHAR(200),  -- what they typed
  tag VARCHAR(20) DEFAULT 'cold',  -- 'hot', 'warm', 'cold'
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'converted', 'lost'
  first_message_at TIMESTAMP NOT NULL,
  last_message_at TIMESTAMP NOT NULL,
  last_customer_message TEXT,
  admin_reply_count INTEGER DEFAULT 0,
  keywords_detected JSONB,  -- ['payment', 'location', etc.]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation logs (raw messages)
CREATE TABLE conversation_messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  telegram_user_id VARCHAR(100) NOT NULL,
  direction VARCHAR(10) NOT NULL,  -- 'inbound' or 'outbound'
  message_text TEXT NOT NULL,
  detected_keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily demand aggregation (for performance)
CREATE TABLE daily_demand_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  phone_model VARCHAR(200) NOT NULL,
  inquiry_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  UNIQUE(date, phone_model)
);

-- Question type tracking
CREATE TABLE question_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  question_type VARCHAR(50) NOT NULL,  -- 'availability', 'price_negotiation', 'color_storage', 'payment', 'location'
  count INTEGER DEFAULT 0,
  UNIQUE(date, question_type)
);
```

---

### NEW API ENDPOINTS FOR SALES INTELLIGENCE

```
GET /api/admin/dashboard/stats
  → Returns: active_chats, hot_leads_count, deposits_today, replies_needed

GET /api/admin/leads?tag=hot&status=active&limit=20
  → Returns: Lead cards sorted by priority

GET /api/admin/leads/:id
  → Returns: Full lead detail with conversation history

PATCH /api/admin/leads/:id/tag
  → Body: { tag: 'hot' | 'warm' | 'cold' }
  → Manual override of auto-tag

PATCH /api/admin/leads/:id/status
  → Body: { status: 'converted' | 'lost' }
  → Close out a lead

GET /api/admin/demand/models?date=today
  → Returns: Top phone models by inquiry count

GET /api/admin/demand/questions?date=today
  → Returns: Top question types by count

GET /api/admin/demand/peak-hours?date=today
  → Returns: Hourly message distribution

GET /api/admin/inventory/alerts
  → Returns: High demand + low stock mismatches, stale inventory, price resistance flags
```

---

### IMPLEMENTATION BOUNDARIES FOR SALES INTELLIGENCE

#### DO

- Add new Dashboard sections as specified
- Create leads management infrastructure
- Log all Telegram conversations with metadata
- Implement keyword detection (simple pattern matching)
- Build aggregation queries for demand signals

#### DO NOT

- Require AI/ML for lead tagging (use rule-based logic)
- Change customer-facing bot responses
- Auto-reply to customers (admin always replies manually)
- Remove existing Dashboard content—augment it

#### WHAT STAYS MANUAL

- Admin still replies to customers directly in Telegram
- Admin makes final pricing decisions
- Admin decides what to restock
- Admin can override auto-assigned lead tags

---

### CONVERSION IMPACT ESTIMATE

| Metric                           | Before                    | After                     | Impact             |
| -------------------------------- | ------------------------- | ------------------------- | ------------------ |
| Avg response time to hot lead    | Unknown (buried in queue) | < 1 hour (surfaced first) | Faster closes      |
| Leads forgotten/lost             | ~20% (no tracking)        | < 5% (action queue)       | Fewer missed sales |
| Inventory-demand alignment       | Guesswork                 | Data-driven               | Stock what sells   |
| Admin time finding opportunities | High (manual scanning)    | Zero (auto-surfaced)      | More time selling  |

**Conservative estimate:** 5-10% conversion rate improvement from same inquiry volume.

---

### PRIORITY ORDER FOR SALES INTELLIGENCE

Implement in this order:

1. Lead tagging system + leads table (foundation)
2. Action Queue on Dashboard (immediate value)
3. Today's Numbers stat cards (visibility)
4. Demand Signals - Most Asked Models (inventory intelligence)
5. Inventory Alerts (demand-supply matching)
6. Question type tracking (negotiation patterns)
7. Peak hours display (timing optimization)

---

### SUCCESS CRITERIA FOR SALES INTELLIGENCE

The implementation is complete when:

1. Every Telegram inquiry creates or updates a lead record
2. Leads are auto-tagged based on keyword rules
3. Dashboard shows Action Queue with hot leads surfaced first
4. Admin can see today's most-asked phone models
5. Inventory alerts flag demand-supply mismatches
6. Admin can manually override lead tags
7. Admin can mark leads as converted or lost

---

# Exchanges Module - Trade-In Evaluation System

## OVERVIEW

Replace the "Deposits" navigation button with "Exchanges" to create a dedicated trade-in evaluation workflow. Legacy deposit data remains accessible but is deprioritized in favor of the new phone exchange system.

---

## NAVIGATION UPDATE

### Bottom Navigation Change

**BEFORE:**

```
Home | Inventory | Deposits | Inbox
```

**AFTER:**

```
Home | Inventory | Exchanges | Inbox
```

### Legacy Deposits Access

- Existing deposit records preserved in database (no data deletion)
- Add "View Deposits (Legacy)" link in Settings menu or as collapsed section on Exchanges screen
- All deposit-related API endpoints remain functional for historical data access

---

## EXCHANGES SCREEN STRUCTURE

### Main Layout

```
┌─────────────────────────────────────────────┐
│ EXCHANGES                        [+ New]    │
├─────────────────────────────────────────────┤
│ Tabs: [ Active ] [ Quoted ] [ Completed ]  │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ Trade-In #1247                      │    │
│ │ Customer: @biruk_addis              │    │
│ │ Device: iPhone 12 Pro 128GB         │    │
│ │ Status: Awaiting Evaluation         │    │
│ │ Submitted: 2h ago                   │    │
│ │ [Start Evaluation]                  │    │
│ └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### Tab Definitions

| Tab           | Purpose                   | Statuses Included                         |
| ------------- | ------------------------- | ----------------------------------------- |
| **Active**    | Pending admin action      | `pending_evaluation`, `awaiting_customer` |
| **Quoted**    | Waiting customer decision | `quoted`                                  |
| **Completed** | Closed deals              | `accepted`, `rejected`, `expired`         |

---

## EVALUATION WORKFLOW

### Entry Point

Admin clicks **[Start Evaluation]** on any Active trade-in request → Opens full-screen evaluation view.

---

### SECTION A: Evidence Review Dashboard

```
┌─────────────────────────────────────────────────┐
│ EVIDENCE REVIEW                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Customer Media:                                 │
│                                                 │
│ Photos (Optional):                              │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│ │Front│ │Back│ │Left│ │Right│                  │
│ └────┘ └────┘ └────┘ └────┘                   │
│                                                 │
│ Status: ✅ 4 photos provided                   │
│         ⚠️  No photos (Grade C assumed)        │
│                                                 │
│ [View Fullscreen Gallery]                       │
│                                                 │
│ ──────────────────────────────────────          │
│                                                 │
│ Battery Health (Optional):                      │
│                                                 │
│ iPhone: Settings > Battery screenshot           │
│ ┌──────────────────────────────┐               │
│ │ [Image] Reading: 87%         │ ✅ Above 80%  │
│ └──────────────────────────────┘               │
│                                                 │
│ Samsung/Android: Battery code screenshot        │
│ (*#0228# or battery app)                       │
│                                                 │
│ Status: ✅ Battery: 87%                        │
│         ⚠️  Not provided (75% assumed)         │
│                                                 │
│ ──────────────────────────────────────          │
│                                                 │
│ IMEI Pre-Check:                                 │
│ IMEI: 356789012345678                           │
│ [Run IMEI Check] ← External API                │
│                                                 │
│ Result: 🟢 CLEAN                               │
│         🔴 BLACKLISTED (Auto-reject)           │
│         ⚪ CANNOT VERIFY (Proceed w/ caution)  │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Business Rules - Evidence

**Photos (Optional but Recommended):**

- If customer provides 4-angle photos → Admin grades based on visible condition
- If customer provides NO photos → Auto-assign **Grade C (Fair)** + apply 15% deduction
- Bot message to customer: "Send photos for accurate quote - no photos = lower estimate"

**Battery Health (Optional but Recommended):**

- **iPhone**: Require Settings > Battery > Battery Health screenshot
- **Samsung/Android**: Accept battery code screenshot (`*#0228#`) or battery health app
- If customer provides battery proof → Use actual percentage in deduction calculation
- If customer provides NO battery proof → Assume **75% health** + apply 20% deduction

**IMEI Check (Mandatory):**

- Admin clicks [Run IMEI Check] → Queries external API (e.g., CheckMEND)
- **CLEAN**: Proceed with evaluation
- **BLACKLISTED**: Auto-reject trade-in, show reason: "Device reported stolen/lost"
- **CANNOT VERIFY**: Admin sees warning, can proceed with caution (document in notes)

---

### SECTION B: Structured Grading Checklist

```
┌─────────────────────────────────────────────────┐
│ GRADING RUBRIC (Required fields)               │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. Overall Condition Grade:                     │
│    ○ Grade A (Excellent) - No visible damage   │
│    ○ Grade B (Good) - Minor scratches only     │
│    ○ Grade C (Fair) - Visible wear/damage      │
│    [Auto-selected if no photos provided]       │
│                                                 │
│ 2. Functional Checks:                           │
│    Face ID Working?        [Yes ✓] [No ✗]      │
│    True Tone Enabled?      [Yes ✓] [No ✗]      │
│    Original Screen?        [Yes ✓] [No ✗]      │
│                                                 │
│ 3. Software Status (CRITICAL):                  │
│    iCloud/FRP Signed Out?  [Yes ✓] [No ✗]      │
│    ⚠️  If NO: CANNOT PROCEED                   │
│                                                 │
│ 4. Physical Defects (Optional checks):          │
│    □ Cracked/Damaged Screen                     │
│    □ Back Glass Cracked                         │
│    □ Camera Lens Damaged                        │
│    □ Dents/Deep Scratches                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Validation Rules

- **Condition Grade**: Required selection, cannot proceed without choosing A/B/C
- **iCloud/FRP Status**: If "No" selected → Show blocking error:

```
  ❌ Trade-in rejected: Device must be unlocked from iCloud/Google account
  Cannot proceed with evaluation.
```

- **Functional Checks**: All must be answered (Yes/No toggle)
- **Physical Defects**: Optional checkboxes, used for documentation

---

### SECTION C: Automated Valuation Engine

```
┌─────────────────────────────────────────────────┐
│ VALUATION CALCULATOR                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Device: iPhone 12 Pro 128GB                     │
│ Market Base Price: 65,000 ETB ← from DB        │
│                                                 │
│ ──────────────────────────────────────          │
│ DEDUCTIONS:                                     │
│ ──────────────────────────────────────          │
│                                                 │
│ No photos provided:            -9,750 ETB (15%)│
│ Battery (assumed 75%):         -13,000 ETB (20%)│
│ Grade C (Fair):                -9,750 ETB (15%)│
│ Face ID Not Working:           -13,000 ETB (20%)│
│ Non-Original Screen:           -7,000 ETB      │
│                                                 │
│ ──────────────────────────────────────          │
│ TOTAL DEDUCTIONS:             -52,500 ETB      │
│ ──────────────────────────────────────          │
│                                                 │
│ 📊 TRADE-IN VALUE: 12,500 ETB                  │
│                                                 │
│ Customer wants: iPhone 14 (95,000 ETB)         │
│                                                 │
│ 💰 CUSTOMER TOP-UP: 82,500 ETB                 │
│                                                 │
│ ─────────────────────────────────────           │
│ Admin Notes (Optional):                         │
│ [Text area for additional context]              │
│                                                 │
│ [Send Quote to Customer]                        │
│ [Reject Trade-In] [Save as Draft]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Deduction Logic (Locked Rules)

```javascript
// Base price from market_prices table
let basePrice = getMarketPrice(brand, model, storage);
let deductions = 0;
let deductionsList = [];

// 1. No Photos Penalty
if (!photosProvided) {
  const penalty = basePrice * 0.15;
  deductions += penalty;
  deductionsList.push({ reason: "No photos provided", amount: penalty });
}

// 2. Condition Grade
if (grade === "B") {
  const penalty = basePrice * 0.08;
  deductions += penalty;
  deductionsList.push({ reason: "Grade B (Good)", amount: penalty });
}
if (grade === "C") {
  const penalty = basePrice * 0.15;
  deductions += penalty;
  deductionsList.push({ reason: "Grade C (Fair)", amount: penalty });
}

// 3. Battery Health
if (!batteryProofProvided) {
  // Assume 75% health
  const penalty = basePrice * 0.2;
  deductions += penalty;
  deductionsList.push({ reason: "Battery (assumed 75%)", amount: penalty });
} else {
  if (batteryHealth < 85 && batteryHealth >= 80) {
    const penalty = basePrice * 0.15;
    deductions += penalty;
    deductionsList.push({
      reason: `Battery ${batteryHealth}%`,
      amount: penalty,
    });
  }
  if (batteryHealth < 80) {
    const penalty = basePrice * 0.25;
    deductions += penalty;
    deductionsList.push({
      reason: `Battery ${batteryHealth}%`,
      amount: penalty,
    });
  }
}

// 4. Face ID (iPhone only)
if (isIPhone && !faceIdWorking) {
  const penalty = basePrice * 0.2;
  deductions += penalty;
  deductionsList.push({ reason: "Face ID not working", amount: penalty });
}

// 5. Screen Issues
if (!originalScreen) {
  const repairCost = getScreenReplacementCost(model);
  deductions += repairCost;
  deductionsList.push({ reason: "Non-original screen", amount: repairCost });
}
if (crackedScreen) {
  const repairCost = getScreenReplacementCost(model);
  deductions += repairCost;
  deductionsList.push({ reason: "Cracked screen", amount: repairCost });
}

// 6. Blocking Conditions
if (!iCloudSignedOut) {
  return {
    rejected: true,
    reason: "iCloud/FRP not signed out - device is locked",
  };
}

if (imeiStatus === "blacklisted") {
  return {
    rejected: true,
    reason: "IMEI blacklisted - device reported stolen/lost",
  };
}

// Calculate final value
let finalValue = Math.max(0, basePrice - deductions);

return {
  tradeInValue: finalValue,
  deductions: deductionsList,
  basePrice: basePrice,
  totalDeductions: deductions,
};
```

#### Deduction Summary Table

| Condition           | Deduction    | Applied When                                 |
| ------------------- | ------------ | -------------------------------------------- |
| No photos provided  | -15% of base | Customer doesn't send photos                 |
| No battery proof    | -20% of base | Customer doesn't send battery screenshot     |
| Grade B (Good)      | -8% of base  | Minor scratches visible                      |
| Grade C (Fair)      | -15% of base | Visible wear/damage                          |
| Battery 80-84%      | -15% of base | Battery health screenshot shows 80-84%       |
| Battery <80%        | -25% of base | Battery health screenshot shows <80%         |
| Face ID broken      | -20% of base | Face ID not working (iPhone only)            |
| Non-original screen | Fixed amount | Screen repair cost from `repair_costs` table |
| Cracked screen      | Fixed amount | Screen repair cost from `repair_costs` table |

**Blocking Conditions (Cannot Quote):**

- iCloud/FRP not signed out → Evaluation stops, rejection message sent
- IMEI blacklisted → Evaluation stops, rejection message sent

---

### Quote Message to Customer

When admin clicks **[Send Quote to Customer]**, bot sends this message via Telegram:

```
📱 Trade-In Quote for iPhone 12 Pro 128GB

Base value: 65,000 ETB
Deductions:
  • No photos: -9,750 ETB
  • Battery (assumed 75%): -13,000 ETB
  • Fair condition: -9,750 ETB
  • Face ID not working: -13,000 ETB
  • Non-original screen: -7,000 ETB

Your trade-in value: 12,500 ETB

iPhone 14 you want: 95,000 ETB
💰 You pay: 82,500 ETB

✅ Send photos + battery screenshot for better quote
⏰ Valid for 48 hours

Reply "Accept" to proceed or "Reject" to cancel.
```

---

## DATABASE SCHEMA

### New Table: exchanges

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
  photo_urls JSONB,  -- {front: "url", back: "url", left: "url", right: "url"}
  photos_provided BOOLEAN DEFAULT false,
  battery_health_screenshot_url TEXT,
  battery_health_percent INTEGER,
  battery_proof_provided BOOLEAN DEFAULT false,

  -- Grading
  condition_grade VARCHAR(10),  -- 'A', 'B', 'C'
  face_id_working BOOLEAN,
  true_tone_enabled BOOLEAN,
  original_screen BOOLEAN,
  icloud_signed_out BOOLEAN,
  physical_defects JSONB,  -- ['cracked_screen', 'back_glass_cracked', ...]

  -- IMEI Check
  imei_status VARCHAR(20),  -- 'clean', 'blacklisted', 'unknown'
  imei_checked_at TIMESTAMP,

  -- Valuation
  base_price_etb INTEGER,
  deductions_breakdown JSONB,  -- [{reason: "...", amount: ...}, ...]
  total_deductions_etb INTEGER,
  trade_in_value_etb INTEGER,

  -- Customer wants
  desired_device_id VARCHAR(100),
  desired_device_price_etb INTEGER,
  customer_top_up_etb INTEGER,

  -- Status tracking
  status VARCHAR(30) DEFAULT 'pending_evaluation',
  -- Values: 'pending_evaluation', 'quoted', 'accepted', 'rejected', 'expired'
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

### New Table: market_prices

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

### New Table: repair_costs

```sql
CREATE TABLE repair_costs (
  id SERIAL PRIMARY KEY,
  model VARCHAR(100) NOT NULL,
  repair_type VARCHAR(50) NOT NULL,  -- 'screen', 'back_glass', 'battery'
  cost_etb INTEGER NOT NULL,
  UNIQUE(model, repair_type)
);
```

---

## API ENDPOINTS

### Exchanges Management

```
GET /api/admin/exchanges
  Query params: ?status=active&limit=20
  Returns: List of exchange requests filtered by status

GET /api/admin/exchanges/:id
  Returns: Full exchange detail with all evidence and grading data

POST /api/admin/exchanges/:id/evaluate
  Body: {
    condition_grade: 'A' | 'B' | 'C',
    face_id_working: boolean,
    true_tone_enabled: boolean,
    original_screen: boolean,
    icloud_signed_out: boolean,
    physical_defects: string[],
    evaluation_notes: string
  }
  Returns: Calculated valuation { tradeInValue, deductions, customerTopUp }

POST /api/admin/exchanges/:id/imei-check
  Body: { imei: string }
  Action: Calls external IMEI API, logs result to DB
  Returns: { status: 'clean' | 'blacklisted' | 'unknown' }

POST /api/admin/exchanges/:id/send-quote
  Body: {
    trade_in_value: number,
    customer_top_up: number,
    notes: string
  }
  Action: Sends quote to customer via Telegram bot, updates status to 'quoted'

PATCH /api/admin/exchanges/:id/reject
  Body: { rejection_reason: string }
  Action: Updates status to 'rejected', notifies customer

GET /api/admin/market-prices
  Returns: List of current market prices for all models

POST /api/admin/market-prices
  Body: { brand, model, storage_gb, typical_price_etb }
  Action: Add or update market price (admin can manually adjust pricing)

GET /api/admin/repair-costs
  Returns: List of repair costs by model and repair type

POST /api/admin/repair-costs
  Body: { model, repair_type, cost_etb }
  Action: Add or update repair cost
```

---

## HOME DASHBOARD KPI WIDGETS (OPTIONAL)

### Add Exchanges Performance Section

```
┌─────────────────────────────────────────────────┐
│ EXCHANGE PERFORMANCE (Last 30 Days)            │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────┐ ┌──────────────┐             │
│ │ 🚫 Scams     │ │ ✅ Success   │             │
│ │  Prevented   │ │    Rate      │             │
│ │              │ │              │             │
│ │     17       │ │     73%      │             │
│ └──────────────┘ └──────────────┘             │
│                                                 │
│ Scams = Blacklisted IMEIs + iCloud-locked      │
│ Success = Accepted / Total Quotes               │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Calculation Logic

```javascript
// Scams Prevented
const scamsPrevented = await db.exchanges.count({
  where: {
    OR: [{ imei_status: "blacklisted" }, { icloud_signed_out: false }],
  },
});

// Success Rate
const totalQuotes = await db.exchanges.count({
  where: { status: { in: ["quoted", "accepted", "rejected"] } },
});

const acceptedQuotes = await db.exchanges.count({
  where: { status: "accepted" },
});

const successRate =
  totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(0) : 0;
```

---

## EDGE CASES & BUSINESS RULES

### 1. Customer Provides Partial Evidence

**Scenario**: Customer sends 2 photos instead of 4, or only battery screenshot without photos.

**Rule**:

- If photos < 4 → Flag as "⚠️ Partial photos" → Admin still assigns Grade based on what's visible
- If only battery provided, no photos → Apply Grade C assumption + 15% deduction
- Admin can always request more photos via Telegram before quoting

---

### 2. IMEI API is Down or Unavailable

**Scenario**: External IMEI check service returns error or times out.

**Rule**:

- Show status: "⚪ CANNOT VERIFY - API unavailable"
- Admin sees warning: "Proceed with caution - IMEI not verified"
- Admin can choose to:
  - Continue evaluation (risky)
  - Wait and retry later
  - Ask customer to provide purchase receipt
- Document in evaluation notes: "IMEI check failed, proceeded without verification"

---

### 3. Customer Claims Photo/Battery Upload Failed

**Scenario**: Customer says "I sent photos but you didn't receive them."

**Rule**:

- Admin checks Telegram conversation logs (synced to Convex)
- If truly not received → Bot re-asks: "Please resend photos"
- If customer still can't send → Quote proceeds with Grade C assumption
- Transparency message: "Your quote assumes Fair condition - send photos within 24h to get revised quote"

---

### 4. Conflicting Evidence at Physical Meetup

**Scenario**: Admin quotes 45K based on photos, but at meetup phone condition is worse (e.g., hidden screen damage).

**Rule**:

- Admin has right to adjust quote on-site OR reject trade-in
- New quote calculated using same deduction rules
- Customer shown before/after comparison:

```
  Original quote: 45,000 ETB (based on photos)
  Revised quote: 32,000 ETB (actual condition)
  Difference: Hidden screen crack (-13,000 ETB)
```

- Customer can accept revised or walk away (no obligation)

---

### 5. Customer Accepts Quote, Then Changes Mind

**Scenario**: Customer replies "Accept" in Telegram, then disappears or says "I changed my mind."

**Rule**:

- Exchange status remains `accepted` for 48 hours
- If customer doesn't schedule meetup within 48h → Status auto-changes to `expired`
- Admin can manually mark as `expired` earlier if customer explicitly cancels
- Quote slot reopens (customer can re-request evaluation later with new photos)

---

### 6. Multiple Admins Evaluating Same Request

**Scenario**: Two admins open same exchange request simultaneously.

**Rule**:

- First admin to click [Start Evaluation] gets assigned (`admin_assigned` field set)
- If second admin tries to open → Show warning: "Currently being evaluated by [admin_name]"
- Exception: If evaluation idle for >20 minutes → Lock expires, new admin can take over

---

### 7. Customer Tries to Trade Blacklisted Phone

**Scenario**: IMEI check returns "blacklisted" status.

**Rule**:

- Evaluation immediately stops (cannot proceed to grading)
- Status auto-set to `rejected`
- Bot sends message:

```
  ❌ Trade-In Rejected

  Reason: This device is reported as stolen, lost, or insurance-claimed.
  IMEI: 356789012345678

  We cannot accept blacklisted devices.
  If you believe this is an error, contact your carrier.
```

- Exchange record logged with rejection reason for admin records

---

### 8. iPhone with iCloud Not Signed Out

**Scenario**: Customer claims iCloud is off, but admin checkbox shows "No."

**Rule**:

- Evaluation stops (cannot calculate quote)
- Bot sends message:

```
  ⚠️ Action Required: Sign out of iCloud

  Steps:
  1. Settings > [Your Name] > Sign Out
  2. Enter Apple ID password
  3. Turn off "Find My iPhone"
  4. Confirm sign out

  Once done, reply "Ready" to continue evaluation.
```

- Exchange status remains `pending_evaluation` until customer confirms
- Admin can re-check iCloud status when customer replies

---

### 9. Samsung/Android Battery Health Unavailable

**Scenario**: Customer has Android phone, battery code doesn't work or no battery app installed.

**Rule**:

- Assume 75% battery health (20% deduction applied)
- Quote message explains:

```
  Battery: 75% assumed (no proof provided) → -20%

  To improve quote, install battery health app and send screenshot.
```

- Customer can provide battery proof later for revised quote

---

### 10. Admin Wants to Override Deduction Rules

**Scenario**: Admin thinks 20% deduction for Face ID is too harsh for this specific case.

**Rule**:

- **NOT ALLOWED** - Deduction rules are locked for consistency
- Admin can add notes explaining context: "Customer is loyal, consider future discount"
- Admin CAN adjust final quote if customer negotiates AFTER receiving it
- All adjustments logged in evaluation notes for transparency

---

## DATA REQUIREMENTS CHECKLIST

### Market Pricing Data Needed

To enable valuation engine, seed `market_prices` table with:

**Example entries:**

```sql
INSERT INTO market_prices (brand, model, storage_gb, typical_price_etb) VALUES
('Apple', 'iPhone 12', 64, 50000),
('Apple', 'iPhone 12', 128, 55000),
('Apple', 'iPhone 12 Pro', 128, 65000),
('Apple', 'iPhone 13', 128, 75000),
('Apple', 'iPhone 14', 128, 95000),
('Samsung', 'Galaxy S21', 128, 45000),
('Samsung', 'Galaxy S22', 128, 55000),
('Samsung', 'Galaxy S23', 128, 65000);
```

**Required fields:**

- Brand (e.g., Apple, Samsung, Xiaomi)
- Model (e.g., iPhone 12 Pro, Galaxy S23)
- Storage in GB (e.g., 64, 128, 256)
- Typical price in ETB (current Addis Ababa market rate)

**Admin update interface needed?** YES - Add screen under Settings to manage market prices.

---

### Screen Repair Costs Data Needed

Seed `repair_costs` table with:

**Example entries:**

```sql
INSERT INTO repair_costs (model, repair_type, cost_etb) VALUES
('iPhone 12', 'screen', 7000),
('iPhone 12 Pro', 'screen', 8000),
('iPhone 13', 'screen', 9000),
('iPhone 14', 'screen', 11000),
('Galaxy S21', 'screen', 6000),
('Galaxy S22', 'screen', 7000),
('Galaxy S23', 'screen', 8000);
```

**Required fields:**

- Model (exact model name matching market_prices table)
- Repair type (screen, back_glass, battery)
- Cost in ETB (typical repair cost in Addis Ababa)

---

### IMEI Check API Integration

**Recommended API**: CheckMEND (https://www.checkmend.com/api)

**Cost**: ~$0.10-0.20 per check (bulk pricing available)

**Integration details needed:**

- API key (sign up required)
- Endpoint: `POST https://api.checkmend.com/v1/imei-check`
- Request body: `{ imei: "356789012345678" }`
- Response: `{ status: "clean" | "blacklisted", reason: "..." }`

**Alternative**: Ethiopian carrier APIs (Ethio Telecom) - cost TBD, may be free but limited to local blacklist.

**Question for you**: Do you have an existing IMEI check service or should we set up CheckMEND?

---

### Telegram Bot Image Sync to Convex

**Current assumption**: When customer sends image in Telegram, bot saves to Convex storage.

**Required implementation**:

1. Bot receives image from Telegram API
2. Bot uploads image to Convex file storage
3. Bot saves image URL to `exchanges.photo_urls` JSONB field
4. Admin mini app fetches image URLs from `exchanges` table
5. Admin sees images in Evidence Review Dashboard

**Question for you**: Is Telegram → Convex image pipeline already built, or does this need implementation?

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Foundation (Week 1)

1. Replace Deposits nav button with Exchanges
2. Create `exchanges`, `market_prices`, `repair_costs` tables
3. Build Active/Quoted/Completed tabs layout
4. Display list of exchange requests (read-only)

### Phase 2: Evaluation Workflow (Week 2)

5. Evidence Review Dashboard (display photos, battery, IMEI input)
6. Structured Grading Checklist UI (form with validation)
7. Automated Valuation Engine (deduction calculation logic)
8. Send Quote button (creates Telegram message)

### Phase 3: IMEI Integration (Week 3)

9. Integrate CheckMEND IMEI API
10. Handle blacklisted/clean/unknown statuses
11. Block evaluation if blacklisted

### Phase 4: Edge Cases & Polish (Week 4)

12. No photos/battery penalty logic
13. iCloud lockout blocking
14. Admin notes field
15. Legacy Deposits access link

### Phase 5: Analytics (Optional)

16. Home Dashboard KPI widgets (Scams Prevented, Success Rate)

---

## TESTING REQUIREMENTS

Before marking complete, verify:

- [ ] Bottom nav shows "Exchanges" instead of "Deposits"
- [ ] Legacy deposits accessible via Settings link
- [ ] Active/Quoted/Completed tabs filter correctly
- [ ] Admin can view customer photos/battery screenshots
- [ ] IMEI check blocks blacklisted devices
- [ ] iCloud lockout prevents quote generation
- [ ] No photos = Grade C + 15% deduction applied
- [ ] No battery = 75% assumption + 20% deduction applied
- [ ] Valuation engine calculates correctly for all grade combinations
- [ ] Quote message sent to customer via Telegram bot
- [ ] Exchange status updates from pending → quoted → accepted
- [ ] Admin cannot override locked deduction rules
- [ ] Evaluation notes save correctly

---

## QUESTIONS FOR IMPLEMENTATION

1. **Market pricing data**: Do you have current Addis Ababa prices for iPhone 12-14 and Samsung S21-S23 models, or should we use placeholder values?

2. **IMEI API**: Should we integrate CheckMEND (~$0.15/check) or wait for Ethiopian carrier API access?

3. **Telegram image sync**: Is bot → Convex image upload already working, or does this need to be built?

4. **Storage preference**: You mentioned Convex for storage - should we also use Cloudflare R2 for videos (handoff videos in future phase)?

5. **Admin override**: Confirm deduction rules are 100% locked (no manual adjustment), or should we allow admin to add manual adjustment with required justification note?

---

**END OF EXCHANGES MODULE DOCUMENTATION**

---

## END OF CONTRACT

---

_Module Exchanges successfully added on February 2, 2026_

# Inbox Module - Lead Command Center

## OVERVIEW

Transform the Inbox from a basic message list into an intelligent Lead Command Center that prioritizes conversations, prevents lead leakage, and reduces admin response time from 12 hours to <10 minutes. The system centralizes all Telegram conversations with automatic lead scoring, customer intelligence, and one-click admin actions.

---

## NAVIGATION CONTEXT

### Bottom Navigation (Unchanged)

```
Home | Inventory | Exchanges | Inbox
```

**Inbox Purpose:** Manage all incoming customer conversations from Telegram bot with prioritization and automation.

---

## INBOX SCREEN STRUCTURE

### Main Layout - Priority List View

```
┌─────────────────────────────────────────────────┐
│ INBOX                    [Filters ▼] [Sort ▼]  │
├─────────────────────────────────────────────────┤
│ Tabs: [ All ] [ Hot ] [ Warm ] [ Cold ]        │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 🔥 @biruk_addis | 091-123-4567          │    │
│ │ "Want iPhone 15 Pro Max 256GB"          │    │
│ │ Budget: 120,000 ETB | Inquiry           │    │
│ │ 8 min ago ⏰                             │    │
│ │ [Open Chat]                              │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 🔥 @sara_eth | 091-987-6543             │    │
│ │ "Can I come today?"                      │    │
│ │ Payment Pending | 15 min ago ⏰         │    │
│ │ [Open Chat]                              │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 🟡 @yonas22 | 091-555-1234              │    │
│ │ "Trade-in quote for Galaxy S21?"         │    │
│ │ Quoted | 45 min ago 🟡                  │    │
│ │ [Open Chat]                              │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ ❄️ @random_user | Phone not shared     │    │
│ │ "How much iPhone 12?"                    │    │
│ │ Inquiry | 2 hrs ago                     │    │
│ │ [Open Chat]                              │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Conversation Card Components

Each card displays:

| Element            | Data Shown                                              | Source                           |
| ------------------ | ------------------------------------------------------- | -------------------------------- |
| **Priority Badge** | 🔥 Hot / 🟡 Warm / ❄️ Cold                              | AI lead scoring                  |
| **Customer ID**    | @username \| Phone number                               | Telegram data + customer profile |
| **Intent Summary** | "Want iPhone 15 Pro Max 256GB"                          | AI-extracted from conversation   |
| **Context Tags**   | Budget: 120,000 ETB                                     | AI-detected keywords             |
| **Status Badge**   | Inquiry / Quoted / Payment Pending / Booked / Escalated | Workflow state                   |
| **SLA Timer**      | "8 min ago" with color coding                           | Time since last customer message |
| **Action Button**  | [Open Chat]                                             | Navigate to detail view          |

### SLA Timer Color Coding

```javascript
const getSLAColor = (minutesSinceLastMessage) => {
  if (minutesSinceLastMessage < 15) return "green"; // 🟢 Good
  if (minutesSinceLastMessage < 30) return "yellow"; // 🟡 Getting slow
  return "red"; // 🔴 Too slow - urgent
};
```

**Business hours:** 9 AM - 9 PM EAT (Ethiopian time)

- Outside business hours: Timer shows duration but no color urgency

---

## LEAD SCORING SYSTEM

### AI Priority Classification

#### 🔥 HOT Lead Criteria (Immediate Priority)

**Keyword triggers:**

- High-value models: "iPhone 15", "iPhone 16", "Pro Max", "Galaxy S23 Ultra", "Galaxy S24"
- Budget indicators: "budget is [amount]", "have [100K+ ETB]", "can pay [amount]"
- Buying intent: "buy now", "want to buy", "ready to pay", "can I come today", "I'll take it"
- Urgency: "today", "now", "immediately", "waiting"

**Behavioral triggers:**

- Transaction value > 100,000 ETB
- Mentioned specific storage/color (detail = serious)
- Asked about payment methods
- Asked about meetup location

**Scoring logic:**

```javascript
function calculateLeadScore(conversation) {
  let score = 0;
  const lastMessages = conversation.messages.slice(-5); // Last 5 messages
  const fullText = lastMessages.map((m) => m.text.toLowerCase()).join(" ");

  // High-value model mentions
  const highValueModels = [
    "iphone 15",
    "iphone 16",
    "pro max",
    "s23 ultra",
    "s24",
  ];
  if (highValueModels.some((model) => fullText.includes(model))) score += 30;

  // Budget indicators
  if (/\d{6,}/.test(fullText)) score += 25; // 6+ digit number (budget)
  if (fullText.includes("budget")) score += 20;

  // Buying intent keywords
  const buyingKeywords = [
    "buy now",
    "want to buy",
    "ready to pay",
    "take it",
    "come today",
  ];
  if (buyingKeywords.some((kw) => fullText.includes(kw))) score += 35;

  // Payment/logistics questions
  if (
    fullText.includes("payment") ||
    fullText.includes("pay") ||
    fullText.includes("location") ||
    fullText.includes("meetup")
  )
    score += 20;

  // Assign priority
  if (score >= 50) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}
```

---

#### 🟡 WARM Lead Criteria (Medium Priority)

**Keyword triggers:**

- Trade-in interest: "trade-in", "exchange", "my old phone", "swap"
- Comparison questions: "which is better", "difference between", "compare"
- Specification questions: "battery health", "storage", "color options", "warranty"
- Negotiation: "last price", "best price", "discount", "can you reduce"

**Behavioral triggers:**

- Asked follow-up questions (engaged but hesitant)
- Conversation span > 2 days (still interested, not ready)
- Mentioned budget under 70,000 ETB (price-sensitive)

---

#### ❄️ COLD Lead Criteria (Low Priority)

**Keyword triggers:**

- Simple price check: "how much", "price", "cost" (with no follow-up)
- Browsing language: "just checking", "just looking", "maybe later"
- Generic inquiry: No specific model mentioned

**Behavioral triggers:**

- Only 1-2 messages in conversation
- No reply for 3+ days after receiving price
- Asked about 5+ different models (unfocused)

---

### Lead Re-Scoring

Conversations are re-scored when:

- New message received from customer
- Admin changes status (e.g., Inquiry → Quoted)
- 24 hours pass (time decay)

**Example of score change:**

```
Initial: Customer asks "How much iPhone 13?" → ❄️ Cold (score: 10)
Follow-up: Customer replies "I have 75K budget, can I come tomorrow?" → 🔥 Hot (score: 65)
```

---

## STATUS WORKFLOW STATES

### Status Badge Definitions

| Status              | Color  | Meaning                                | Admin Action Required             |
| ------------------- | ------ | -------------------------------------- | --------------------------------- |
| **Inquiry**         | Blue   | First contact, awaiting response       | Send quote or answer question     |
| **Quoted**          | Purple | Price sent, awaiting customer decision | Wait 24-48h, then follow up       |
| **Payment Pending** | Orange | Customer claims payment sent           | Verify payment screenshot         |
| **Booked**          | Green  | Meetup scheduled                       | Prepare inventory, go to location |
| **Escalated**       | Red    | High-value deal or complaint           | Owner intervention needed         |
| **Converted**       | Gray   | Sale completed                         | Archive conversation              |
| **Lost**            | Gray   | Customer ghosted or rejected           | Archive conversation              |

### Status Transitions

```
Inquiry → Quoted → Payment Pending → Booked → Converted
   ↓         ↓           ↓              ↓
 Lost      Lost        Lost          Lost
```

**Auto-transitions:**

- Inquiry → Lost: No customer reply for 7 days
- Quoted → Lost: No customer reply for 48 hours after quote sent
- Payment Pending → Booked: Admin verifies payment
- Any status → Escalated: Triggered by escalation rules

---

## CHAT DETAIL VIEW

### Split-Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Inbox        @biruk_addis                    🔥 HOT  │
├─────────────────────────┬───────────────────────────────────────┤
│                         │                                       │
│  CONVERSATION HISTORY   │   CUSTOMER INTELLIGENCE PANEL        │
│                         │                                       │
│  Customer:              │  ┌─────────────────────────────────┐ │
│  How much iPhone 15     │  │ CUSTOMER PROFILE                │ │
│  Pro Max 256GB?         │  ├─────────────────────────────────┤ │
│  [2:30 PM]              │  │ Name: Biruk                     │ │
│                         │  │ Phone: 091-123-4567             │ │
│  Admin:                 │  │ Telegram: @biruk_addis          │ │
│  115,000 ETB. Excellent │  │                                 │ │
│  condition, 95% battery │  │ Purchase History:               │ │
│  [2:32 PM]              │  │ • None (First-time customer)    │ │
│                         │  │                                 │ │
│  Customer:              │  │ Reliability: New customer       │ │
│  Can you do 110K? I     │  │ No-shows: 0                     │ │
│  have budget ready      │  └─────────────────────────────────┘ │
│  [2:35 PM]              │                                       │
│                         │  ┌─────────────────────────────────┐ │
│  [Typing area...]       │  │ CURRENT INTEREST                │ │
│                         │  ├─────────────────────────────────┤ │
│                         │  │ Wants: iPhone 15 Pro Max 256GB  │ │
│                         │  │ Budget: ~110,000 ETB            │ │
│                         │  │ Negotiating: Yes (-5,000 ETB)   │ │
│                         │  │                                 │ │
│                         │  │ AI Confidence: 🔥 HIGH          │ │
│                         │  │ (Budget stated + specific model)│ │
│                         │  └─────────────────────────────────┘ │
│                         │                                       │
├─────────────────────────┴───────────────────────────────────────┤
│ QUICK ACTION BAR                                                │
│ [Generate Quote] [Request Proof] [Verify Payment] [Schedule]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## QUICK ACTION BAR FEATURES

### 1. Generate Quote Action

**Trigger:** Admin clicks **[Generate Quote]** button

**Modal UI:**

```
┌─────────────────────────────────────────┐
│ GENERATE QUOTE                          │
├─────────────────────────────────────────┤
│                                         │
│ Model: [iPhone 15 Pro Max ▼]          │
│ Storage: [256GB ▼]                     │
│ Condition: [Excellent ▼]               │
│                                         │
│ Base Price: 120,000 ETB                │
│ Your Price: [115,000] ETB              │
│                                         │
│ Battery Health: [95%]                  │
│ Warranty: [30 days ▼]                 │
│                                         │
│ Valid Duration: [48 hours ▼]          │
│                                         │
│ ─────────────────────────────            │
│ Preview Message:                        │
│ ─────────────────────────────            │
│                                         │
│ 📱 iPhone 15 Pro Max 256GB Quote       │
│                                         │
│ Price: 115,000 ETB                     │
│ Condition: Excellent                   │
│ Battery: 95%                           │
│ Warranty: 30 days                      │
│                                         │
│ ✅ Stock available                     │
│ ⏰ Valid until: Feb 5, 3:00 PM         │
│                                         │
│ Reply "Buy" to proceed                 │
│                                         │
│ [Send Quote] [Cancel]                  │
└─────────────────────────────────────────┘
```

**Backend logic:**

```javascript
async function sendQuote(leadId, quoteData) {
  // 1. Create quote record
  const quote = await db.quotes.create({
    lead_id: leadId,
    model: quoteData.model,
    storage: quoteData.storage,
    price_etb: quoteData.price,
    valid_until: new Date(Date.now() + quoteData.validHours * 60 * 60 * 1000),
    created_by: adminId,
  });

  // 2. Send formatted message via Telegram bot
  await sendTelegramMessage(customer.telegram_id, formatQuoteMessage(quote));

  // 3. Update lead status
  await db.leads.update(leadId, {
    status: "quoted",
    last_quote_sent_at: new Date(),
  });

  // 4. Log activity
  await logActivity("quote_sent", leadId, quoteData);
}
```

---

### 2. Request Proof Action

**Trigger:** Admin clicks **[Request Proof]** button

**Modal UI:**

```
┌─────────────────────────────────────────┐
│ REQUEST PROOF                           │
├─────────────────────────────────────────┤
│                                         │
│ Request Type:                           │
│ ☐ Trade-in photos (4 angles)          │
│ ☐ Battery Health screenshot           │
│ ☐ IMEI number                          │
│ ☐ Purchase receipt                     │
│                                         │
│ Language:                               │
│ ○ English                               │
│ ○ Amharic (አማርኛ)                      │
│                                         │
│ ─────────────────────────────            │
│ Preview Message:                        │
│ ─────────────────────────────            │
│                                         │
│ 📸 Trade-In Requirements                │
│                                         │
│ Please send:                            │
│ 1. 4 photos (Front, Back, Sides)      │
│ 2. Battery Health screenshot           │
│    (Settings > Battery > Battery Health)│
│ 3. IMEI number (Dial *#06#)            │
│                                         │
│ Once received, we'll send your quote   │
│ within 10 minutes.                     │
│                                         │
│ [Send Request] [Cancel]                │
└─────────────────────────────────────────┘
```

**Message templates stored in DB:**

```sql
CREATE TABLE message_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(50) UNIQUE NOT NULL,
  language VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB  -- Placeholder variables like {customer_name}
);

-- Example data
INSERT INTO message_templates VALUES
(1, 'request_trade_in_proof', 'en', '📸 Trade-In Requirements\n\nPlease send:\n1. 4 photos (Front, Back, Sides)\n2. Battery Health screenshot\n   (Settings > Battery > Battery Health)\n3. IMEI number (Dial *#06#)\n\nOnce received, we'll send your quote within 10 minutes.', '{}'),
(2, 'request_trade_in_proof', 'am', '📸 የመለዋወጫ መስፈርቶች\n\nእባክዎ ይላኩ:\n1. 4 ፎቶዎች (ፊት፣ ኋላ፣ ጎኖች)\n2. የባትሪ ጤና ማያ ገጽ\n3. የIMEI ቁጥር (*#06# ደውሉ)\n\nከደረሰ በኋላ በ10 ደቂቃ ውስጥ ዋጋ እንልክልዎታለን።', '{}');
```

---

### 3. Verify Payment Action

**Trigger:** Admin clicks **[Verify Payment]** button

**Modal UI:**

```
┌─────────────────────────────────────────┐
│ VERIFY PAYMENT                          │
├─────────────────────────────────────────┤
│                                         │
│ Expected Amount: 115,000 ETB           │
│                                         │
│ Payment Method:                         │
│ ○ Telebirr                              │
│ ○ CBE Mobile Banking                   │
│ ○ Bank Transfer                        │
│ ○ Cash (In-person)                     │
│                                         │
│ Upload Payment Screenshot:              │
│ [Drag & Drop or Click to Upload]       │
│                                         │
│ ─── OR ───                              │
│                                         │
│ Manual Entry:                           │
│ Transaction ID: [____________]         │
│ Amount Received: [____________] ETB    │
│                                         │
│ [Verify & Update Status]               │
└─────────────────────────────────────────┘
```

**Backend logic with OCR:**

```javascript
async function verifyPayment(leadId, paymentData) {
  // 1. If screenshot provided, extract text via OCR
  if (paymentData.screenshot) {
    const ocrResult = await extractTextFromImage(paymentData.screenshot);

    // Look for transaction ID pattern
    const transactionId = ocrResult.match(/TXN[A-Z0-9]{10,}/)?.[0];

    // Look for amount (ETB or Birr)
    const amount = ocrResult.match(
      /(\d{1,3}(,\d{3})*(\.\d{2})?)\s*(ETB|Birr)/,
    )?.[1];

    paymentData.extracted_transaction_id = transactionId;
    paymentData.extracted_amount = parseFloat(amount?.replace(/,/g, ""));
  }

  // 2. Validate amount matches quote
  const quote = await db.quotes.findOne({ lead_id: leadId });
  const amountMatch =
    Math.abs(paymentData.extracted_amount - quote.price_etb) < 100;

  // 3. Create payment record
  await db.payments.create({
    lead_id: leadId,
    quote_id: quote.id,
    transaction_id:
      paymentData.extracted_transaction_id || paymentData.manual_transaction_id,
    amount_etb: paymentData.extracted_amount || paymentData.manual_amount,
    payment_method: paymentData.method,
    screenshot_url: paymentData.screenshot,
    verified_by: adminId,
    amount_match: amountMatch,
    verified_at: new Date(),
  });

  // 4. Update lead status
  if (amountMatch) {
    await db.leads.update(leadId, { status: "booked" });
    await sendTelegramMessage(
      customer.telegram_id,
      "✅ Payment verified! When would you like to pick up your phone?",
    );
  } else {
    // Flag mismatch for manual review
    await db.leads.update(leadId, { status: "payment_pending" });
    await notifyAdmin("Payment amount mismatch - manual review needed");
  }
}
```

---

### 4. Schedule Meetup Action

**Trigger:** Admin clicks **[Schedule Meetup]** button

**Modal UI:**

```
┌─────────────────────────────────────────┐
│ SCHEDULE MEETUP                         │
├─────────────────────────────────────────┤
│                                         │
│ Safe Zone Location:                     │
│ ○ Bole Alemnesh Plaza (Main Entrance)  │
│ ○ Merkato - Near Dashen Bank           │
│ ○ Piazza - Adwa Bridge                 │
│ ○ Custom Location: [_______________]   │
│                                         │
│ Date: [Feb 5, 2026 ▼]                  │
│ Time: [3:00 PM ▼]                      │
│                                         │
│ ─────────────────────────────            │
│ Customer will receive:                  │
│ ─────────────────────────────            │
│                                         │
│ 📍 Meetup Confirmed                    │
│                                         │
│ Location: Bole Alemnesh Plaza          │
│           (Main Entrance)               │
│ Date: Feb 5, 2026                      │
│ Time: 3:00 PM                          │
│                                         │
│ What to bring:                          │
│ • Payment (115,000 ETB)                │
│ • Your ID                               │
│                                         │
│ See you there! 📱                      │
│                                         │
│ [Confirm & Send] [Cancel]              │
└─────────────────────────────────────────┘
```

**Backend logic:**

```javascript
async function scheduleMeetup(leadId, meetupData) {
  // 1. Create meetup record
  const meetup = await db.meetups.create({
    lead_id: leadId,
    location: meetupData.location,
    scheduled_at: new Date(meetupData.datetime),
    created_by: adminId,
  });

  // 2. Send confirmation message
  await sendTelegramMessage(customer.telegram_id, formatMeetupMessage(meetup));

  // 3. Update lead status
  await db.leads.update(leadId, {
    status: "booked",
    meetup_scheduled_at: meetupData.datetime,
  });

  // 4. Set reminder notification (1 hour before)
  await scheduleNotification({
    type: "meetup_reminder",
    send_at: new Date(meetupData.datetime - 60 * 60 * 1000),
    recipient: adminId,
    message: `Reminder: Meetup with ${customer.name} in 1 hour at ${meetupData.location}`,
  });
}
```

---

## CONVERSATION ASSIGNMENT SYSTEM

### Assignment States

| State                 | Icon | Meaning                      | Admin Action             |
| --------------------- | ---- | ---------------------------- | ------------------------ |
| **Unassigned**        | ⚪   | No admin claimed this chat   | Available to take        |
| **Assigned to Me**    | ✅   | Current admin owns this chat | Can reply/manage         |
| **Assigned to Other** | 🔒   | Another admin owns this chat | Cannot reply (view-only) |
| **Escalated**         | 🚨   | Owner must handle            | Owner can reassign       |

|

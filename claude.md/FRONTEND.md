# FRONTEND.MD — TedyTech Admin Mini App Frontend Specifications

> **USAGE NOTE**: This document contains all frontend, UI/UX, and user interaction specifications for the TedyTech Admin Mini App. Use this as the primary reference for implementing user interfaces, components, styling, and navigation. For backend API specifications, see `BACKEND.md`. For database schema details, see `DATABASE.md`.

---

## TABLE OF CONTENTS

1. [Frozen Features (DO NOT CHANGE)](#frozen-features--do-not-change)
2. [Navigation Structure](#navigation-structure)
3. [Dashboard / Home Screen](#dashboard--home-screen)
4. [Inventory Screen](#inventory-screen)
5. [Deposits Screen (Legacy)](#deposits-screen-legacy)
6. [Exchanges Screen](#exchanges-screen)
7. [Inbox Screen](#inbox-screen)
8. [Product Forms (Create/Edit)](#product-forms-createedit)
9. [Modals & Dialogs](#modals--dialogs)
10. [Quick Actions](#quick-actions)
11. [Styling & Design System](#styling--design-system)
12. [Responsive Design & Accessibility](#responsive-design--accessibility)
13. [Integration Points (Backend APIs)](#integration-points-backend-apis)
14. [Testing Requirements](#testing-requirements)

---

## FROZEN FEATURES — DO NOT CHANGE

> **⚠️ WARNING**: The following features ALREADY EXIST and must NOT be modified, redesigned, or removed.

### Navigation (Frozen)

- Bottom nav: Home, Inventory, Deposits, Inbox
- Top bar: "TedyTech Admin" title, Logout icon
- Floating Action Button (+) with Quick Actions sheet

### Screens (Frozen)

- Dashboard (Home): Keep all existing content
- Inventory: Keep tabs (All Products, New Arrivals, Premium, Accessories)
- Deposits: Keep table with columns (Telegram User, Item, Amount, Dates, Status)
- Inbox: Keep tabs (Exchange, Affiliates)
- Create Phone: Keep all form fields and validation
- Create Accessory: Keep all form fields and validation
- Login: Keep email/password flow, saved account feature

### Data Models (Frozen)

- Phone fields: Brand, Model, Price, Storage, Color, Condition, Key Highlights, In Stock, New Arrival, Premium Pick
- Accessory fields: Name/Model, Condition, Price, Quantity, Storage, Active
- Deposit statuses: Active, Pending Receipt, Expired, Released
- Exchange statuses: New, Quoted, Accepted, Rejected
- Commission statuses: (existing, likely Pending, Paid)

### Automation Hooks (Frozen)

- Category auto-creation for Phones/Accessories
- Quick Action pre-fill for New Arrival tag
- Login persistence via localStorage
- Access control redirects

---

## NAVIGATION STRUCTURE

### Bottom Navigation Bar

**BEFORE (Legacy):**
```
Home | Inventory | Deposits | Inbox
```

**AFTER (Updated):**
```
Home | Inventory | Exchanges | Inbox
```

### Navigation Update Rules

1. Replace "Deposits" button with "Exchanges"
2. Add "View Deposits (Legacy)" link in Settings menu OR as collapsed section on Exchanges screen
3. Existing deposit records remain accessible but are deprioritized

### Top Bar Components

| Element | Position | Behavior |
|---------|----------|----------|
| "TedyTech Admin" Title | Center | Static text |
| Logout Icon | Right | Clears session, redirects to Login |

### Floating Action Button (+)

- **Position:** Bottom-right corner, above nav bar
- **Action:** Opens Quick Actions bottom sheet
- **Contents:** Pre-defined actions (Create Phone, Create Accessory, etc.)

---

## DASHBOARD / HOME SCREEN

### Section A: Quick Stats (Top Strip)

**Display 4 stat cards in a row:**

| Card | Data | Tap Action |
|------|------|------------|
| "Products In Stock" | Count where `in_stock = true` | Navigate to Inventory |
| "Active Deposits" | Count where `status = Active` | Navigate to Deposits (Legacy) |
| "Pending Exchanges" | Count where `status = New OR Quoted` | Navigate to Exchanges |
| "Unpaid Commissions" | Count where `status ≠ Paid` | Navigate to Affiliates tab |

**UI Layout:**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Products    │ │   Active     │ │   Pending    │ │   Unpaid     │
│  In Stock    │ │   Deposits   │ │  Exchanges   │ │ Commissions  │
│     127      │ │      8       │ │      5       │ │      12      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**API Integration:** `GET /api/admin/stats`

---

### Section B: Today's Numbers (Future Phase - Sales Intelligence)

> **[NEEDS CLARIFICATION]**: Confirm if this should be implemented now or deferred to Phase 2.

**Purpose:** Instant pulse check. Glanceable, no tapping required.

| Stat | What it shows | Why it matters |
|------|---------------|----------------|
| **Active Chats** | Conversations with messages in last 24h | How busy is the bot right now |
| **Hot Leads** | Count of leads tagged "Hot" | Immediate sales opportunities |
| **Deposits Today** | Number + total ETB collected | Cash secured today |
| **Replies Needed** | Conversations waiting for admin response | Don't lose warm leads |

**Layout:** 4 cards in a row, tappable to jump to relevant section.

---

### Section C: Action Queue (Future Phase - Sales Intelligence)

**Purpose:** Admin's auto-generated to-do list from bot activity.

**Header:** "Needs Your Attention"

**Card Display:**
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

**Sort Order:** Hot leads first, then by wait time (longest waiting at top)

---

### Section D: Today's Demand Signals (Future Phase)

**C1: Most Asked Phone Models (Top 5)**

| Rank | Model | Inquiries Today |
|------|-------|-----------------|
| 1 | iPhone 13 128GB | 12 |
| 2 | Samsung S23 | 8 |
| 3 | iPhone 12 64GB | 6 |
| 4 | Tecno Spark 10 | 5 |
| 5 | iPhone 14 Pro | 4 |

**C2: Top Customer Questions (Top 3)**

| Question Type | Count |
|---------------|-------|
| "Is this available?" | 23 |
| "Can you reduce price?" | 14 |
| "Do you have [model] in [color]?" | 9 |

**C3: Peak Inquiry Time**

Simple bar/indicator showing when most messages came in (e.g., "Most active: 6PM - 9PM")

---

### Section E: Inventory Alerts

**Purpose:** Connect demand to supply—flag mismatches.

| Alert Type | Example |
|------------|---------|
| **High Demand, Low Stock** | "iPhone 13 128GB: 12 inquiries, only 1 in stock" |
| **No Inquiries This Week** | "Samsung A14: 0 inquiries in 7 days" |
| **Price Resistance Detected** | "iPhone 12: 8 'too expensive' responses this week" |

---

### Section F: Exchange Performance (Optional KPI Widgets)

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

---

## INVENTORY SCREEN

### Tab Structure

**Existing Tabs (Frozen):**
- All Products
- New Arrivals  
- Premium
- Accessories

**New Tab to Add:**
- **Archived** — Shows archived products (hidden from customer queries, visible to admin)

---

### Product Row Components

**Display per row:**
```
iPhone 13 Pro - 256GB - Excellent
92,000 ETB | Stock: 3 | 🔥 HOT | Added: 3 days ago
[Edit] [Delete] [Archive] [Feature]
```

---

### Visual Status Indicators (Per Product Row)

**Add status badges/icons:**

| Badge | Condition | Display |
|-------|-----------|---------|
| 🔥 **HOT** | Inquiries in last 7 days ≥ 5 | Red badge |
| ⚠️ **COLD** | 0 inquiries in last 14 days | Gray badge |
| 📦 **LOW STOCK** | Stock < 2 units (phones) OR quantity < 5 (accessories) | Orange badge |
| 💰 **PRICE DROPPED** | Price reduced in last 7 days | Green badge |
| ⏰ **AGING** | Added > 30 days ago AND 0 sales | Yellow badge |
| ⭐ **FEATURED** | Product is marked as new_arrival OR premium | Gold badge |

**Rules:**
- Multiple badges can show simultaneously
- Badges update on page load (no real-time refresh needed)
- Badge data pulled from leads/conversation_messages tables (Hot/Cold) + inventory timestamps

---

### Inline Quick Actions (Per Product Row)

**Add action buttons:**

```
Quick: [-5%] [-10%] [Feature] [Duplicate]
```

| Button | Action | Notes |
|--------|--------|-------|
| **[-5%]** | Reduce price by 5%, save immediately, log to price_history | Show toast: "Price reduced to [new_price] ETB" |
| **[-10%]** | Reduce price by 10%, save immediately, log to price_history | Same behavior as -5% |
| **[Feature]** | Toggle featured status (new_arrival OR premium) | If on All Products tab → modal asks "Feature as: [New Arrival] [Premium Pick]" |
| **[Duplicate]** | Opens Create form pre-filled with all data from this item | Only change required: admin manually adjusts differing fields |

**Visibility Rules:**
- Price reduction buttons only visible if price > 10,000 ETB
- If product price < 10,000 ETB: Hide [-5%] and [-10%] buttons, show message: "Manual edit required for low-price items"
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

**Toggle Behavior:** Click to expand, click again to collapse

**Empty State:** If no inquiry data exists: Show "No customer inquiries yet"

**API Integration:** `GET /api/admin/products/:id/performance`

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

**Persistence:**
- Sort persists during session (localStorage)
- Default resets on page reload
- Sort applies to current tab only

---

### Color-Coded Row Backgrounds

**Apply background colors to rows based on health status:**

| Color | Condition | Status |
|-------|-----------|--------|
| 🟢 **GREEN tint** | Stock ≥ 3 AND inquiries in last 7 days ≥ 1 | Healthy |
| 🟡 **YELLOW tint** | Stock < 3 OR (0 inquiries in last 14 days AND inventory age < 30 days) | Needs Attention |
| 🔴 **RED tint** | Stock < 2 AND 0 inquiries in last 14 days | Problem |
| ⚫ **GRAY** | Archived OR out of stock | Inactive |

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
| Button | Action | Notes |
|--------|--------|-------|
| **[+]** | quantity +1 → save to DB immediately | No upper limit message unless > 999 |
| **[−]** | quantity -1 (minimum 0) → save to DB immediately | If quantity reaches 0 → show "Out of Stock" badge |

**Rules:**
- Only on Accessories tab (phones don't have quantity field)
- Log to admin_activity_log: "Stock adjusted: [product_name] [old_qty] → [new_qty]"
- If quantity already 0 and admin clicks [-]: Do nothing (minimum is 0)
- If quantity > 999: Disable [+] button (max inventory limit)

**API Integration:** `PATCH /api/admin/accessories/:id/quantity`

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

**API Integration:** `PATCH /api/admin/products/:id/note`

---

### Edit & Delete Actions (Per Product Row)

**Add to each product row:**

| Action | Icon | Behavior |
|--------|------|----------|
| **Edit** | ✏️ | Navigate to `/admin/edit-phone/:id` or `/admin/edit-accessory/:id` (same form as create, pre-filled) |
| **Delete** | 🗑️ | Show confirmation dialog → DELETE from DB |

**Delete Confirmation Dialog:**
```
┌─────────────────────────────────────┐
│ Delete this iPhone 13?              │
│                                     │
│ This cannot be undone.              │
│                                     │
│ [Cancel]  [Delete]                  │
└─────────────────────────────────────┘
```

**Delete Rules:**
- If product has active deposit: Block delete, show "Cannot delete: item has active deposit"
- If product has pending exchange: Block delete, show "Cannot delete: item has pending exchange"
- After delete, return to Inventory with item removed

---

### Archive / Mark as Sold Toggle

**Add per product row:**
- "Archive" / "Mark as Sold" button

**Behavior:**
- Archived products: hidden from customer queries, visible in admin "Archived" tab
- Archived items can be restored (unarchived)
- Do not delete data; set status flag

**Rules:**
- If archived product has active deposit: Block archive, show "Cannot archive: item has active deposit"
- Archived items must not appear in customer mini app product listings

**API Integration:** `PATCH /api/admin/products/:id/archive`

---

## DEPOSITS SCREEN (Legacy)

> **Note:** This screen is being replaced by Exchanges but remains accessible for historical data.

### Access Methods
1. "View Deposits (Legacy)" link in Settings menu
2. Collapsed section on Exchanges screen

### Deposit Row Actions

**Add buttons per deposit row:**

| Button | Action | Status Change |
|--------|--------|---------------|
| **Release Hold** | status = Released, item returns to stock | Released |
| **Mark as Paid** | status = Released (or Completed) | Released/Completed |
| **Expire Now** | status = Expired, item returns to stock | Expired |

**Rules:**
- Each action updates DB immediately
- Log admin action with timestamp (for future audit trail)
- Refresh row after action
- If deposit already expired: Hide "Expire Now" button
- If item already sold/archived when releasing: Show warning, allow release anyway

**API Integration:** `PATCH /api/admin/deposits/:id/status`

---

## EXCHANGES SCREEN

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

| Tab | Purpose | Statuses Included |
|-----|---------|-------------------|
| **Active** | Pending admin action | `pending_evaluation`, `awaiting_customer` |
| **Quoted** | Waiting customer decision | `quoted` |
| **Completed** | Closed deals | `accepted`, `rejected`, `expired` |

---

### Evaluation Workflow Entry

Admin clicks **[Start Evaluation]** on any Active trade-in request → Opens full-screen evaluation view.

---

### Section A: Evidence Review Dashboard

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

**Photo Status Indicators:**
- ✅ 4 photos provided → Admin grades based on visible condition
- ⚠️ No photos → Auto-assign **Grade C (Fair)** + apply 15% deduction

**Battery Status Indicators:**
- ✅ Battery: XX% → Use actual percentage in deduction calculation
- ⚠️ Not provided → Assume **75% health** + apply 20% deduction

---

### Section B: Structured Grading Checklist

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

**Validation Rules:**
- **Condition Grade**: Required selection, cannot proceed without choosing A/B/C
- **iCloud/FRP Status**: If "No" selected → Show blocking error:
  ```
  ❌ Trade-in rejected: Device must be unlocked from iCloud/Google account
  Cannot proceed with evaluation.
  ```
- **Functional Checks**: All must be answered (Yes/No toggle)
- **Physical Defects**: Optional checkboxes, used for documentation

---

### Section C: Valuation Calculator Display

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

---

### Exchange Request Actions (Inbox > Exchange tab — if still using old location)

**Add buttons per request row:**

| Button | Action | Status Change |
|--------|--------|---------------|
| **Send Quote** | Opens modal/input for quote amount (ETB) | status = Quoted |
| **Approve** | Mark as accepted | status = Accepted |
| **Reject** | Mark as rejected | status = Rejected |

**Rules:**
- Quote amount is required before approval
- Rejected exchanges cannot be re-quoted (final)
- Status badge updates after action
- If quote already sent: Show "Update Quote" instead of "Send Quote"

---

## INBOX SCREEN

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

---

### Conversation Card Components

| Element | Data Shown | Source |
|---------|------------|--------|
| **Priority Badge** | 🔥 Hot / 🟡 Warm / ❄️ Cold | AI lead scoring |
| **Customer ID** | @username \| Phone number | Telegram data + customer profile |
| **Intent Summary** | "Want iPhone 15 Pro Max 256GB" | AI-extracted from conversation |
| **Context Tags** | Budget: 120,000 ETB | AI-detected keywords |
| **Status Badge** | Inquiry / Quoted / Payment Pending / Booked / Escalated | Workflow state |
| **SLA Timer** | "8 min ago" with color coding | Time since last customer message |
| **Action Button** | [Open Chat] | Navigate to detail view |

---

### SLA Timer Color Coding

| Time Range | Color | Status |
|------------|-------|--------|
| < 15 minutes | 🟢 Green | Good |
| 15-30 minutes | 🟡 Yellow | Getting slow |
| > 30 minutes | 🔴 Red | Too slow - urgent |

**Business Hours:** 9 AM - 9 PM EAT (Ethiopian time)
- Outside business hours: Timer shows duration but no color urgency

---

### Lead Priority Badges

| Tag | Meaning | Visual |
|-----|---------|--------|
| 🔥 **Hot** | Ready to buy—needs admin to close | Red badge |
| 🟡 **Warm** | Interested but hesitant—needs nurturing | Yellow badge |
| ❄️ **Cold** | Just browsing or price checking | Gray/Blue badge |

---

### Status Badge Definitions

| Status | Color | Meaning | Admin Action Required |
|--------|-------|---------|----------------------|
| **Inquiry** | Blue | First contact, awaiting response | Send quote or answer question |
| **Quoted** | Purple | Price sent, awaiting customer decision | Wait 24-48h, then follow up |
| **Payment Pending** | Orange | Customer claims payment sent | Verify payment screenshot |
| **Booked** | Green | Meetup scheduled | Prepare inventory, go to location |
| **Escalated** | Red | High-value deal or complaint | Owner intervention needed |
| **Converted** | Gray | Sale completed | Archive conversation |
| **Lost** | Gray | Customer ghosted or rejected | Archive conversation |

---

### Chat Detail View - Split-Screen Layout

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

### Conversation Assignment States

| State | Icon | Meaning | Admin Action |
|-------|------|---------|--------------|
| **Unassigned** | ⚪ | No admin claimed this chat | Available to take |
| **Assigned to Me** | ✅ | Current admin owns this chat | Can reply/manage |
| **Assigned to Other** | 🔒 | Another admin owns this chat | Cannot reply (view-only) |
| **Escalated** | 🚨 | Owner must handle | Owner can reassign |

---

## PRODUCT FORMS (Create/Edit)

### Create Phone Form

> **Note:** Keep all existing form fields and validation (Frozen)

**Fields:** Brand, Model, Price, Storage, Color, Condition, Key Highlights, In Stock, New Arrival, Premium Pick

### Edit Phone Form

- Same form as Create Phone, pre-filled with existing data
- Navigate to `/admin/edit-phone/:id`
- **Add:** Price Change History section (shows last 5 price changes)

### Create Accessory Form

> **Note:** Keep all existing form fields and validation (Frozen)

**Fields:** Name/Model, Condition, Price, Quantity, Storage, Active

### Edit Accessory Form

- Same form as Create Accessory, pre-filled with existing data
- Navigate to `/admin/edit-accessory/:id`
- **Add:** Price Change History section

---

### Price Change History Section (Edit Forms)

**Display in Edit Phone/Accessory screen:**

```
┌─────────────────────────────────────────────────┐
│ 📊 PRICE HISTORY (Last 5 Changes)              │
├─────────────────────────────────────────────────┤
│                                                 │
│ 95,000 → 92,000 ETB | Jan 28, 2026 | @admin1   │
│ 98,000 → 95,000 ETB | Jan 25, 2026 | @admin1   │
│ 100,000 → 98,000 ETB | Jan 20, 2026 | @admin2  │
│                                                 │
│ [No price changes yet] (if empty)              │
└─────────────────────────────────────────────────┘
```

**Rules:**
- Display only (no editing history)
- Max 5 entries per product (oldest deleted when new added)
- Show "No price changes yet" if empty

---

### Duplicate Product Warning (Create Phone Form)

**Location:** Create Phone form, on submit

**Trigger:** Before saving, check DB for existing product with same: Brand + Model + Storage + Color + Condition

**Dialog:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Duplicate Warning                   │
│                                         │
│ A product with these exact specs        │
│ already exists:                         │
│                                         │
│ iPhone 13 Pro - 256GB - Black           │
│ Excellent Condition                     │
│                                         │
│ [Cancel]  [Add Anyway]                  │
└─────────────────────────────────────────┘
```

**Rules:**
- Warning only (not blocking)
- Do not apply to accessories (less risk)
- Match must be exact on all 5 fields
- Warn if duplicate will create 6th identical product

---

## MODALS & DIALOGS

### Generate Quote Modal

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

---

### Request Proof Modal

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

---

### Verify Payment Modal

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

---

### Schedule Meetup Modal

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

---

### Feature Toggle Modal

```
┌─────────────────────────────────────────┐
│ FEATURE PRODUCT                         │
├─────────────────────────────────────────┤
│                                         │
│ Feature as:                             │
│                                         │
│ ○ New Arrival (appears in New Arrivals) │
│ ○ Premium Pick (appears in Premium)     │
│ ○ Remove Feature                        │
│                                         │
│ Featured items appear first in their    │
│ respective tabs.                        │
│                                         │
│ [Save] [Cancel]                        │
└─────────────────────────────────────────┘
```

**Rules:**
- If product already featured as "New Arrival" and admin clicks [Feature] again → modal asks "Switch to Premium Pick?" or "Unfeature"
- Only 1 featured type per product at a time
- Featured items auto-expire after 7 days (optional setting)

---

## QUICK ACTIONS

### Activity Log Display

**Location:** New tab "Activity" in bottom nav OR section on Dashboard

**Display:**
```
┌─────────────────────────────────────────────────┐
│ ACTIVITY LOG                                   │
├─────────────────────────────────────────────────┤
│ Action        │ Item           │ Admin  │ Time │
├───────────────┼────────────────┼────────┼──────┤
│ Product Edit  │ iPhone 13 Pro  │ admin1 │ 2h   │
│ Quote Sent    │ @biruk_addis   │ admin1 │ 3h   │
│ Price Reduced │ Samsung S23    │ admin2 │ 4h   │
│ Deposit Rel.  │ #DEP-1234      │ admin1 │ 5h   │
│ ...           │ ...            │ ...    │ ...  │
└─────────────────────────────────────────────────┘
```

**Show:** Last 50 entries, newest first

**Log these events:**
- Product created
- Product edited
- Product deleted
- Product archived/unarchived
- Deposit status changed
- Exchange quoted/approved/rejected
- Commission marked as paid
- Price change (via quick buttons or edit)
- Stock adjustment

**Rules:**
- Read-only (no editing/deleting logs)
- Include admin identifier (email or ID)
- Timestamp in local timezone

---

### Commission Payout Action (Affiliates Tab)

**Location:** Inbox > Affiliates tab > Commissions table, per row

**Add:**
- "Mark as Paid" button

**Rules:**
- Updates status to Paid with timestamp
- No financial processing (tracking only)
- Disable button if already Paid

---

## STYLING & DESIGN SYSTEM

### Color Palette

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary | TedyTech Brand Color | Headers, primary buttons |
| Success | Green | Confirmed actions, healthy status |
| Warning | Yellow/Orange | Needs attention, pending |
| Danger | Red | Delete, urgent, problems |
| Info | Blue | Informational, inquiry status |
| Muted | Gray | Inactive, archived, disabled |

### Status Badge Colors

| Status | Background | Text |
|--------|------------|------|
| 🔥 Hot | `#FF4444` | White |
| 🟡 Warm | `#FFB347` | Dark |
| ❄️ Cold | `#87CEEB` | Dark |
| Active | Green | White |
| Pending | Orange | Dark |
| Expired | Gray | White |
| Rejected | Red | White |

### Row Background Tints

| Status | Background Color | Opacity |
|--------|------------------|---------|
| Healthy (Green) | `#E8F5E9` | 100% |
| Needs Attention (Yellow) | `#FFF8E1` | 100% |
| Problem (Red) | `#FFEBEE` | 100% |
| Inactive (Gray) | `#F5F5F5` | 100% |

### Typography

- **Headers:** Bold, larger size
- **Body:** Regular weight
- **Prices:** Bold, slightly larger
- **Status badges:** Small caps, bold
- **Timestamps:** Small, muted color

### Spacing

- Card padding: 16px
- Row gaps: 8px
- Section margins: 24px
- Button padding: 12px horizontal, 8px vertical

---

## RESPONSIVE DESIGN & ACCESSIBILITY

### Mobile-First Layout

- Bottom navigation fixed at bottom
- Cards stack vertically
- Modals become full-screen on mobile
- Touch targets minimum 44x44px

### Desktop Adaptations

- Split-screen chat view (conversation + intelligence panel)
- Multi-column stat cards
- Side-by-side forms

### Accessibility Requirements

- All interactive elements have unique, descriptive IDs for testing
- Color is not the only indicator (use icons + text)
- Sufficient color contrast for all text
- Form labels properly associated with inputs
- Error messages clearly displayed

### Testing Checkpoints

- [ ] No UI breaks on mobile view (responsive design intact)
- [ ] All buttons and links are tappable on mobile
- [ ] Modals close properly on all devices
- [ ] Forms validate correctly
- [ ] Error states display properly

---

## INTEGRATION POINTS (Backend APIs)

### Dashboard Stats
- `GET /api/admin/stats` → Returns counts for dashboard cards

### Inventory
- `GET /api/admin/products` → List products with filters
- `PUT /api/admin/products/:id` → Edit product
- `DELETE /api/admin/products/:id` → Delete product
- `PATCH /api/admin/products/:id/archive` → Archive/unarchive
- `PATCH /api/admin/products/:id/price-adjust` → Quick price reduction
- `PATCH /api/admin/products/:id/feature` → Toggle featured status
- `POST /api/admin/products/:id/duplicate` → Duplicate product
- `GET /api/admin/products/:id/performance` → Performance metrics
- `PATCH /api/admin/products/:id/note` → Update admin note
- `GET /api/admin/products/check-duplicate` → Check for duplicate

### Accessories
- `PATCH /api/admin/accessories/:id/quantity` → Update quantity

### Deposits (Legacy)
- `PATCH /api/admin/deposits/:id/status` → Update status

### Exchanges
- `GET /api/admin/exchanges` → List exchanges
- `GET /api/admin/exchanges/:id` → Get exchange detail
- `POST /api/admin/exchanges/:id/evaluate` → Submit evaluation
- `POST /api/admin/exchanges/:id/imei-check` → Run IMEI check
- `POST /api/admin/exchanges/:id/send-quote` → Send quote
- `PATCH /api/admin/exchanges/:id/reject` → Reject trade-in

### Leads/Inbox
- `GET /api/admin/leads` → List leads with filters
- `GET /api/admin/leads/:id` → Get lead detail
- `PATCH /api/admin/leads/:id/tag` → Update tag
- `PATCH /api/admin/leads/:id/status` → Update status

### Activity Log
- `GET /api/admin/activity` → Get recent activity

### Commissions
- `PATCH /api/admin/commissions/:id/paid` → Mark as paid

---

## TESTING REQUIREMENTS

### Before marking complete, verify:

**Frozen Features:**
- [ ] All frozen features still work exactly as before
- [ ] Navigation structure unchanged (except Deposits → Exchanges)
- [ ] Login flow unchanged
- [ ] Create forms unchanged

**Inventory Screen:**
- [ ] All status badges (🔥📦⚠️💰⏰) appear correctly based on rules
- [ ] Price reduction buttons calculate correctly
- [ ] Feature toggle updates DB and moves item to top of relevant tab
- [ ] Duplicate action pre-fills form with all source data
- [ ] Performance metrics panel shows/hides on click
- [ ] Sort dropdown reorders products correctly
- [ ] Color-coded rows match health status logic
- [ ] Accessory stepper increments/decrements immediately
- [ ] Notes save and display correctly (admin-only)

**Exchanges Screen:**
- [ ] Bottom nav shows "Exchanges" instead of "Deposits"
- [ ] Legacy deposits accessible via Settings link
- [ ] Active/Quoted/Completed tabs filter correctly
- [ ] Admin can view customer photos/battery screenshots
- [ ] Evaluation form validates correctly
- [ ] Quote preview shows accurate calculations

**Inbox Screen:**
- [ ] Lead cards display all required information
- [ ] SLA timer colors correctly
- [ ] Tab filters work (All, Hot, Warm, Cold)
- [ ] Chat detail view loads conversation history
- [ ] Quick actions in chat view work

**General:**
- [ ] No console errors on any screen
- [ ] Dashboard stats show correct counts
- [ ] Activity log captures all specified events
- [ ] All modals open and close correctly
- [ ] No UI breaks on mobile view (responsive design intact)

---

## IMPLEMENTATION PRIORITY

**Phase 1: Core Additions**
1. Product Edit & Delete (unblocks inventory management)
2. Deposit Action Buttons (unblocks deposit resolution)
3. Exchange Request Actions (unblocks trade-in workflow)
4. Dashboard Quick Stats (immediate visibility)

**Phase 2: Efficiency Features**
5. Sold/Archive Toggle (inventory hygiene)
6. Inline Stock Adjustment (accessory efficiency)
7. Activity Log (accountability)
8. Commission Payout Action (affiliate management)

**Phase 3: Smart Features**
9. Duplicate Product Warning (error prevention)
10. Price Change History (nice to have)
11. Visual Status Indicators
12. Inline Quick Actions
13. Smart Sorting
14. Color-Coded Rows
15. Performance Metrics Panel

**Phase 4: Sales Intelligence (Future)**
16. Lead Scoring System
17. Action Queue on Dashboard
18. Demand Signals
19. Inventory Alerts

---

**END OF FRONTEND SPECIFICATIONS**

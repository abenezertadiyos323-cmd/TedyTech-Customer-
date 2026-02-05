# BACKEND.MD — TedyTech Admin Mini App Backend Specifications

> **USAGE NOTE**: This document contains all API endpoints, business logic, validation rules, and backend requirements. For frontend UI specifications, see `FRONTEND.md`. For database schema, see `DATABASE.md`.

---

## TABLE OF CONTENTS

1. [Execution Contract](#execution-contract)
2. [Frozen API Endpoints](#frozen-api-endpoints)
3. [Products API](#products-api)
4. [Deposits API](#deposits-api)
5. [Exchanges API](#exchanges-api)
6. [Leads/Inbox API](#leadsinbox-api)
7. [Dashboard API](#dashboard-api)
8. [Activity Log API](#activity-log-api)
9. [Commissions API](#commissions-api)
10. [Market Pricing API](#market-pricing-api)
11. [Telegram Integration](#telegram-integration)
12. [Lead Scoring Logic](#lead-scoring-logic)
13. [Valuation Engine](#valuation-engine)
14. [Error Handling](#error-handling)
15. [Security Rules](#security-rules)

---

## EXECUTION CONTRACT

You are implementing admin-only additions to the TedyTech Admin Mini App.

### DO
- Create new API endpoints for new actions
- Handle errors gracefully (show toast/message)
- Log all admin actions with timestamps
- Use existing component styles

### DO NOT
- Change existing API endpoint contracts
- Rename existing screens or routes
- Modify existing form fields
- Change existing status values or workflows
- Add customer-facing features
- Touch authentication/login flow

---

## FROZEN API ENDPOINTS

> **⚠️ WARNING**: All existing `/api/admin/*` endpoints must remain functional. Do not rename or restructure.

---

## PRODUCTS API

### GET /api/admin/products
List all products with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| tab | string | Filter by tab: `all`, `new_arrivals`, `premium`, `accessories`, `archived` |
| sort | string | Sort field: `created_at`, `price`, `stock`, `inquiries` |
| order | string | `asc` or `desc` |

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "brand": "Apple",
      "model": "iPhone 13 Pro",
      "price": 92000,
      "storage": "256GB",
      "color": "Black",
      "condition": "Excellent",
      "in_stock": true,
      "new_arrival": true,
      "premium": false,
      "archived": false,
      "featured_type": "new_arrival",
      "featured_at": "2026-01-28T10:00:00Z",
      "admin_note": "Battery health 89%",
      "created_at": "2026-01-20T10:00:00Z"
    }
  ]
}
```

---

### PUT /api/admin/products/:id
Edit an existing product.

**Request Body:**
```json
{
  "brand": "Apple",
  "model": "iPhone 13 Pro",
  "price": 90000,
  "storage": "256GB",
  "color": "Black",
  "condition": "Excellent",
  "key_highlights": "95% battery",
  "in_stock": true,
  "new_arrival": true,
  "premium": false
}
```

**Business Logic:**
1. If price changed, log to `price_history` table
2. Log to `admin_activity_log`
3. Return updated product

---

### DELETE /api/admin/products/:id
Delete a product.

**Business Rules:**
- If product has active deposit → Return error: `"Cannot delete: item has active deposit"`
- If product has pending exchange → Return error: `"Cannot delete: item has pending exchange"`
- Log to `admin_activity_log`
- Return success message

**Response (Error):**
```json
{
  "error": true,
  "message": "Cannot delete: item has active deposit"
}
```

---

### PATCH /api/admin/products/:id/archive
Archive or unarchive a product.

**Request Body:**
```json
{
  "archived": true
}
```

**Business Rules:**
- If archived product has active deposit → Return error: `"Cannot archive: item has active deposit"`
- Set `archived = true` and `archived_at = NOW()`
- Archived items must NOT appear in customer mini app listings
- Log to `admin_activity_log`

---

### PATCH /api/admin/products/:id/price-adjust
Quick price reduction (5% or 10%).

**Request Body:**
```json
{
  "reduction_percent": 5
}
```

**Business Rules:**
- If product price < 10,000 ETB → Return error: `"Manual edit required for low-price items"`
- If 5% reduction would make price < 5,000 ETB → Return error with warning
- Calculate new price: `new_price = price * (1 - reduction_percent / 100)`
- Round to nearest 100 ETB
- Log old_price → new_price to `price_history` table
- Log to `admin_activity_log`

**Response:**
```json
{
  "old_price": 92000,
  "new_price": 87400,
  "reduction_percent": 5
}
```

---

### PATCH /api/admin/products/:id/feature
Toggle featured status.

**Request Body:**
```json
{
  "featured_type": "new_arrival"
}
```

**Values:** `"new_arrival"`, `"premium"`, or `null` (remove feature)

**Business Logic:**
1. Set `featured_type` to specified value
2. Set `featured_at = NOW()` if featuring, `null` if removing
3. Featured items sort first in their respective tabs (by `featured_at DESC`)
4. Auto-unfeature after 7 days (optional): `WHERE featured_at < NOW() - INTERVAL '7 days'`
5. Log to `admin_activity_log`

---

### POST /api/admin/products/:id/duplicate
Create a copy of an existing product.

**Request Body:** None (copies all fields from source)

**Business Logic:**
1. Copy all fields EXCEPT: `id`, `created_at`, `archived`, `archived_at`
2. Generate new ID
3. Set `created_at = NOW()`
4. Return new product ID for redirect to edit form

**Validation:**
- Warn if duplicate will create 6th identical product (Brand + Model + Storage + Condition match)

**Response:**
```json
{
  "new_product_id": "prod_456",
  "message": "Product duplicated successfully"
}
```

---

### GET /api/admin/products/:id/performance
Get performance metrics for a product.

**Response:**
```json
{
  "views": 47,
  "inquiries": 12,
  "avg_negotiation": -8000,
  "days_in_inventory": 18,
  "last_inquiry_at": "2026-01-30T14:30:00Z",
  "conversions": 0
}
```

**Data Sources:**
- Views/Inquiries: Count from `leads` table where `phone_model_text` matches
- Avg negotiation: Calculate from `price_history` reductions
- Days in inventory: `created_at` vs current date
- Last inquiry: Latest `lead.last_message_at` for this model

**Edge Case:**
- If no leads data exists → Return: `{ "message": "Lead tracking not active - metrics unavailable" }`
- Use fuzzy matching: "iphone 13" matches "iPhone 13 Pro"

---

### PATCH /api/admin/products/:id/note
Update admin note.

**Request Body:**
```json
{
  "note": "Battery health 89% - price negotiable"
}
```

**Validation:**
- Max 200 characters
- Notes visible only to admin

---

### GET /api/admin/products/check-duplicate
Check for duplicate before create.

**Query Parameters:**
| Param | Type |
|-------|------|
| brand | string |
| model | string |
| storage | string |
| color | string |
| condition | string |

**Response:**
```json
{
  "duplicate_found": true,
  "existing_product": {
    "id": "prod_123",
    "brand": "Apple",
    "model": "iPhone 13 Pro"
  }
}
```

---

### PATCH /api/admin/accessories/:id/quantity
Update accessory quantity (stock stepper).

**Request Body:**
```json
{
  "quantity": 13
}
```

**Business Rules:**
- Minimum quantity: 0
- Maximum quantity: 999
- If quantity reaches 0 → Product shows "Out of Stock" badge but remains visible
- Log to `admin_activity_log`: "Stock adjusted: [product_name] [old_qty] → [new_qty]"

---

## DEPOSITS API

### PATCH /api/admin/deposits/:id/status
Update deposit status.

**Request Body:**
```json
{
  "status": "Released"
}
```

**Valid Values:** `"Released"`, `"Expired"`, `"Completed"`

**Business Logic:**
| Action | Status Change | Side Effect |
|--------|---------------|-------------|
| Release Hold | Released | Item returns to stock |
| Mark as Paid | Released or Completed | None |
| Expire Now | Expired | Item returns to stock |

**Business Rules:**
- Log admin action with timestamp
- If item already sold/archived when releasing → Show warning, allow release anyway
- If deposit already expired → Return error (don't allow re-expiring)

---

## EXCHANGES API

### GET /api/admin/exchanges
List exchange requests.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: `active`, `quoted`, `completed` |
| limit | int | Default: 20 |

**Status Mappings:**
- `active` → `pending_evaluation`, `awaiting_customer`
- `quoted` → `quoted`
- `completed` → `accepted`, `rejected`, `expired`

---

### GET /api/admin/exchanges/:id
Get full exchange detail with evidence and grading data.

**Response:**
```json
{
  "id": 1,
  "trade_in_id": "TI-1247",
  "customer_telegram_id": "123456789",
  "customer_username": "biruk_addis",
  "trade_device_brand": "Apple",
  "trade_device_model": "iPhone 12 Pro",
  "trade_device_storage_gb": 128,
  "trade_device_imei": "356789012345678",
  "photos_provided": true,
  "photo_urls": {
    "front": "https://...",
    "back": "https://...",
    "left": "https://...",
    "right": "https://..."
  },
  "battery_proof_provided": true,
  "battery_health_percent": 87,
  "condition_grade": "B",
  "face_id_working": true,
  "true_tone_enabled": true,
  "original_screen": true,
  "icloud_signed_out": true,
  "imei_status": "clean",
  "base_price_etb": 65000,
  "deductions_breakdown": [...],
  "trade_in_value_etb": 52000,
  "status": "quoted"
}
```

---

### POST /api/admin/exchanges/:id/evaluate
Submit evaluation grading.

**Request Body:**
```json
{
  "condition_grade": "B",
  "face_id_working": true,
  "true_tone_enabled": true,
  "original_screen": true,
  "icloud_signed_out": true,
  "physical_defects": ["minor_scratches"],
  "evaluation_notes": "Good condition overall"
}
```

**Business Rules:**
- If `icloud_signed_out = false` → Return rejection:
  ```json
  {
    "rejected": true,
    "reason": "iCloud/FRP not signed out - device is locked"
  }
  ```
- Calculate valuation using Valuation Engine (see below)
- Return calculated values

**Response:**
```json
{
  "trade_in_value": 52000,
  "deductions": [
    { "reason": "Grade B (Good)", "amount": 5200 }
  ],
  "customer_top_up": 43000
}
```

---

### POST /api/admin/exchanges/:id/imei-check
Run IMEI check via external API.

**Request Body:**
```json
{
  "imei": "356789012345678"
}
```

**Business Logic:**
1. Call external IMEI API (e.g., CheckMEND)
2. Log result to DB (`imei_status`, `imei_checked_at`)
3. Return status

**Response:**
```json
{
  "status": "clean"
}
```

**Possible Values:** `"clean"`, `"blacklisted"`, `"unknown"`

**Edge Cases:**
- API unavailable → Return `"unknown"` with warning: "Proceed with caution - IMEI not verified"
- Blacklisted → Auto-reject, send rejection message via Telegram

---

### POST /api/admin/exchanges/:id/send-quote
Send quote to customer via Telegram.

**Request Body:**
```json
{
  "trade_in_value": 52000,
  "customer_top_up": 43000,
  "notes": "Quote valid for 48 hours"
}
```

**Business Logic:**
1. Update exchange status to `quoted`
2. Set `quoted_at = NOW()`
3. Format and send Telegram message (see Telegram Integration)
4. Log to `admin_activity_log`

---

### PATCH /api/admin/exchanges/:id/reject
Reject trade-in request.

**Request Body:**
```json
{
  "rejection_reason": "IMEI blacklisted - device reported stolen"
}
```

**Business Logic:**
1. Update status to `rejected`
2. Store rejection reason
3. Send rejection message via Telegram
4. Log to `admin_activity_log`

---

## LEADS/INBOX API

### GET /api/admin/leads
List leads with filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| tag | string | `hot`, `warm`, `cold` |
| status | string | `active`, `converted`, `lost` |
| limit | int | Default: 20 |

**Response:**
```json
{
  "leads": [
    {
      "id": 1,
      "telegram_user_id": "123456789",
      "telegram_username": "biruk_addis",
      "phone_model_text": "iPhone 15 Pro Max 256GB",
      "tag": "hot",
      "status": "active",
      "last_customer_message": "Can I come today?",
      "last_message_at": "2026-02-02T14:30:00Z",
      "admin_reply_count": 3
    }
  ]
}
```

---

### GET /api/admin/leads/:id
Get full lead detail with conversation history.

**Response includes:**
- Lead details
- All conversation messages
- Customer profile (if available)
- Keywords detected

---

### PATCH /api/admin/leads/:id/tag
Manual override of auto-tag.

**Request Body:**
```json
{
  "tag": "hot"
}
```

---

### PATCH /api/admin/leads/:id/status
Close out a lead.

**Request Body:**
```json
{
  "status": "converted"
}
```

**Valid Values:** `"active"`, `"converted"`, `"lost"`

**Auto-transitions:**
- Inquiry → Lost: No customer reply for 7 days
- Quoted → Lost: No customer reply for 48 hours after quote sent

---

### GET /api/admin/demand/models
Get top phone models by inquiry count.

**Query Parameters:**
| Param | Type |
|-------|------|
| date | string | `today`, `week`, or ISO date |

**Response:**
```json
{
  "models": [
    { "model": "iPhone 13 128GB", "count": 12 },
    { "model": "Samsung S23", "count": 8 }
  ]
}
```

---

### GET /api/admin/demand/questions
Get top question types.

**Response:**
```json
{
  "questions": [
    { "type": "availability", "count": 23 },
    { "type": "price_negotiation", "count": 14 }
  ]
}
```

---

### GET /api/admin/demand/peak-hours
Get hourly message distribution.

---

### GET /api/admin/inventory/alerts
Get inventory alerts.

**Response:**
```json
{
  "alerts": [
    {
      "type": "high_demand_low_stock",
      "product": "iPhone 13 128GB",
      "inquiries": 12,
      "stock": 1
    },
    {
      "type": "no_inquiries",
      "product": "Samsung A14",
      "days_since_inquiry": 7
    }
  ]
}
```

---

## DASHBOARD API

### GET /api/admin/stats
Get counts for dashboard cards.

**Response:**
```json
{
  "products_in_stock": 127,
  "active_deposits": 8,
  "pending_exchanges": 5,
  "unpaid_commissions": 12
}
```

**Queries:**
- Products In Stock: `WHERE in_stock = true AND archived = false`
- Active Deposits: `WHERE status = 'Active'`
- Pending Exchanges: `WHERE status IN ('New', 'Quoted', 'pending_evaluation')`
- Unpaid Commissions: `WHERE status != 'Paid'`

---

### GET /api/admin/dashboard/stats (Sales Intelligence)
Extended stats for future phase.

**Response:**
```json
{
  "active_chats": 15,
  "hot_leads_count": 5,
  "deposits_today": { "count": 3, "total_etb": 45000 },
  "replies_needed": 8
}
```

---

## ACTIVITY LOG API

### GET /api/admin/activity
Get recent admin activity.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| limit | int | 50 |

**Response:**
```json
{
  "activities": [
    {
      "id": 1,
      "action_type": "product_edited",
      "entity_type": "phone",
      "entity_id": "prod_123",
      "admin_email": "admin@tedytech.com",
      "details": { "field": "price", "old": 92000, "new": 87400 },
      "created_at": "2026-02-02T14:30:00Z"
    }
  ]
}
```

**Logged Events:**
- `product_created`, `product_edited`, `product_deleted`
- `product_archived`, `product_unarchived`
- `price_reduced`, `product_featured`
- `deposit_released`, `deposit_expired`
- `exchange_quoted`, `exchange_accepted`, `exchange_rejected`
- `commission_paid`
- `stock_adjusted`

---

## COMMISSIONS API

### PATCH /api/admin/commissions/:id/paid
Mark commission as paid.

**Request Body:** None

**Business Logic:**
1. Update status to `"Paid"`
2. Set `paid_at = NOW()`
3. Log to `admin_activity_log`
4. No financial processing (tracking only)

**Response:**
```json
{
  "success": true,
  "paid_at": "2026-02-02T14:30:00Z"
}
```

---

## MARKET PRICING API

### GET /api/admin/market-prices
List current market prices.

### POST /api/admin/market-prices
Add or update market price.

**Request Body:**
```json
{
  "brand": "Apple",
  "model": "iPhone 13",
  "storage_gb": 128,
  "typical_price_etb": 75000
}
```

### GET /api/admin/repair-costs
List repair costs by model.

### POST /api/admin/repair-costs
Add or update repair cost.

**Request Body:**
```json
{
  "model": "iPhone 13",
  "repair_type": "screen",
  "cost_etb": 9000
}
```

---

## TELEGRAM INTEGRATION

### Bot Requirements

The Telegram bot must log for each conversation:

| Data Point | Purpose |
|------------|---------|
| telegram_user_id | Unique identifier |
| telegram_username | Display name for admin |
| messages (timestamped) | Conversation history |
| phone_models_mentioned | What they're interested in |
| keywords_detected | For lead tagging |
| first_message_at | Lead age |
| last_message_at | Response urgency |
| admin_reply_count | Engagement level |

### Message Templates

Templates stored in `message_templates` table with language support (English + Amharic).

**Template Keys:**
- `request_trade_in_proof`
- `quote_message`
- `meetup_confirmation`
- `payment_verified`
- `rejection_message`

### Quote Message Format

```
📱 Trade-In Quote for iPhone 12 Pro 128GB

Base value: 65,000 ETB
Deductions:
  • No photos: -9,750 ETB
  • Battery (assumed 75%): -13,000 ETB
  • Fair condition: -9,750 ETB

Your trade-in value: 32,500 ETB

iPhone 14 you want: 95,000 ETB
💰 You pay: 62,500 ETB

✅ Send photos + battery screenshot for better quote
⏰ Valid for 48 hours

Reply "Accept" to proceed or "Reject" to cancel.
```

### Image Sync Pipeline

1. Bot receives image from Telegram API
2. Bot uploads image to Convex file storage
3. Bot saves image URL to `exchanges.photo_urls` JSONB field
4. Admin mini app fetches image URLs from `exchanges` table

> **[NEEDS CLARIFICATION]**: Is Telegram → Convex image pipeline already built?

---

## LEAD SCORING LOGIC

### Keyword Detection Patterns

**Hot Keywords:**
- "available", "in stock", "still have"
- "pay", "payment", "CBE", "Telebirr", "transfer"
- "location", "shop", "where", "meet", "delivery"
- "I want", "I'll take", "reserve", "hold"
- "warranty", "guarantee", "return"

**Warm Keywords:**
- "last price", "best price", "discount", "reduce"
- "compare", "which is better", "difference"
- "trade", "exchange", "my old phone"
- "think about", "get back", "let me check"
- "other color", "other storage", "different"

**Cold Signals:**
- "just checking", "just asking", "maybe later"
- "how much" (if only message)
- No reply after 72 hours

### Scoring Algorithm

```javascript
function calculateLeadScore(conversation) {
  let score = 0;
  const lastMessages = conversation.messages.slice(-5);
  const fullText = lastMessages.map(m => m.text.toLowerCase()).join(' ');

  // High-value model mentions (+30)
  const highValueModels = ['iphone 15', 'iphone 16', 'pro max', 's23 ultra', 's24'];
  if (highValueModels.some(model => fullText.includes(model))) score += 30;

  // Budget indicators (+25)
  if (/\d{6,}/.test(fullText)) score += 25;
  if (fullText.includes('budget')) score += 20;

  // Buying intent keywords (+35)
  const buyingKeywords = ['buy now', 'want to buy', 'ready to pay', 'take it', 'come today'];
  if (buyingKeywords.some(kw => fullText.includes(kw))) score += 35;

  // Payment/logistics questions (+20)
  if (fullText.includes('payment') || fullText.includes('location')) score += 20;

  // Assign priority
  if (score >= 50) return 'hot';
  if (score >= 25) return 'warm';
  return 'cold';
}
```

### Lead Lifecycle

```
Customer sends first message → [Tagged COLD by default]
        ↓
Customer asks follow-up about same phone → [Upgraded to WARM]
        ↓
Customer asks about payment/location → [Upgraded to HOT]
        ↓
Admin closes sale → Lead marked CONVERTED
        or
No reply for 7 days → Lead marked LOST
```

---

## VALUATION ENGINE

### Deduction Logic (Locked Rules)

```javascript
function calculateValuation(evaluationData) {
  let basePrice = getMarketPrice(brand, model, storage);
  let deductions = 0;
  let deductionsList = [];

  // 1. No Photos Penalty (-15%)
  if (!photosProvided) {
    const penalty = basePrice * 0.15;
    deductions += penalty;
    deductionsList.push({ reason: "No photos provided", amount: penalty });
  }

  // 2. Condition Grade
  if (grade === 'B') {
    deductions += basePrice * 0.08;
  }
  if (grade === 'C') {
    deductions += basePrice * 0.15;
  }

  // 3. Battery Health
  if (!batteryProofProvided) {
    deductions += basePrice * 0.20; // Assume 75%
  } else if (batteryHealth < 80) {
    deductions += basePrice * 0.25;
  } else if (batteryHealth < 85) {
    deductions += basePrice * 0.15;
  }

  // 4. Face ID (iPhone only)
  if (isIPhone && !faceIdWorking) {
    deductions += basePrice * 0.20;
  }

  // 5. Screen Issues
  if (!originalScreen || crackedScreen) {
    deductions += getScreenReplacementCost(model);
  }

  // 6. Blocking Conditions
  if (!iCloudSignedOut) {
    return { rejected: true, reason: "iCloud/FRP not signed out" };
  }
  if (imeiStatus === 'blacklisted') {
    return { rejected: true, reason: "IMEI blacklisted" };
  }

  return {
    tradeInValue: Math.max(0, basePrice - deductions),
    deductions: deductionsList,
    basePrice,
    totalDeductions: deductions
  };
}
```

### Deduction Summary

| Condition | Deduction |
|-----------|-----------|
| No photos | -15% of base |
| No battery proof | -20% of base |
| Grade B | -8% of base |
| Grade C | -15% of base |
| Battery 80-84% | -15% of base |
| Battery <80% | -25% of base |
| Face ID broken | -20% of base |
| Non-original/cracked screen | Fixed repair cost |

> **⚠️ IMPORTANT**: Admin CANNOT override deduction rules. They can only add notes and adjust after customer negotiation.

---

## ERROR HANDLING

### Standard Error Response

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PRODUCT_HAS_DEPOSIT` | 400 | Cannot delete/archive - has active deposit |
| `PRODUCT_HAS_EXCHANGE` | 400 | Cannot delete - has pending exchange |
| `PRICE_TOO_LOW` | 400 | Cannot reduce price below threshold |
| `ICLOUD_LOCKED` | 400 | Device not signed out of iCloud |
| `IMEI_BLACKLISTED` | 400 | Device is blacklisted |
| `QUOTE_EXPIRED` | 400 | Quote no longer valid |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Not authenticated |

---

## SECURITY RULES

### Authentication
- All `/api/admin/*` endpoints require admin authentication
- Use existing login persistence via localStorage
- Access control redirects for unauthorized users

### Authorization
- Admin actions logged with `admin_email` for audit trail
- Notes/internal data visible only to admin (never shown to customers)
- Archived items must not appear in customer-facing queries

### Data Validation
- All inputs sanitized
- Price values must be positive integers
- Quantity range: 0-999
- Note max length: 200 characters
- IMEI format validation: 15 digits

---

## TESTING REQUIREMENTS

Before marking complete, verify:

- [ ] All frozen features still work exactly as before
- [ ] Each addition functions as specified
- [ ] Actions update DB correctly
- [ ] Activity log captures all specified events
- [ ] Dashboard stats show correct counts
- [ ] Duplicate warning triggers on exact match only
- [ ] Archived products hidden from customer queries (verify API filter)
- [ ] No console errors on any screen
- [ ] Valuation engine calculates correctly for all grade combinations

---

**END OF BACKEND SPECIFICATIONS**

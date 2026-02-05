## Admin Inventory Page - Convex Migration Complete ✅

### Summary of Changes

The Admin Inventory page has been successfully converted from Supabase/fetch to Convex. Here's what was updated:

---

### 1. **Backend Setup** (`convex/store.ts`)

Added two query functions to retrieve product and category data:

```typescript
export const listCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .order("_creationTime", "desc")
      .collect();
  },
});

export const listProducts = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("products");

    if (args.isActive !== undefined) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("isActive"), args.isActive),
      );
    }

    return await queryBuilder.order("_creationTime", "desc").collect();
  },
});
```

---

### 2. **Frontend Setup** (`main.tsx`)

Wrapped the app with ConvexProvider:

```typescript
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App.tsx";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
```

---

### 3. **Environment Configuration** (`.env.local`)

Created `.env.local` in the admin app:

```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

**⚠️ ACTION REQUIRED:** Replace with your actual Convex deployment URL.

---

### 4. **Updated InventoryPage.tsx**

- Replaced `@tanstack/react-query` with Convex's `useQuery`
- Removed all fetch calls
- Imported Convex API: `import { api } from "../../../convex/_generated/api"`
- All tabs now use `useQuery(api.store.listProducts, {})` with optional filtering
- UI components remain unchanged

**Key Changes:**

- `useQuery` now returns `undefined` while loading (instead of `isLoading` flag)
- Products use Convex schema fields: `_id`, `name`, `description`, `price`, `images`, `isActive`
- All four tabs (All Products, New Arrivals, Premium, Accessories) now pull from the same `listProducts` query with optional filtering

---

### 5. **Installation & Verification**

#### Step 1: Install Convex dependencies

```bash
cd d:\Ab\TedTech\tedytalk-manager
npm install convex
```

#### Step 2: Update VITE_CONVEX_URL

Edit `.env.local` and replace `https://your-deployment.convex.cloud` with your actual Convex deployment URL.

#### Step 3: Start Convex backend

```bash
cd d:\Ab\TedTech\abenier-convex-test
npx convex dev
```

Expected output: `✔ Convex functions ready!`

#### Step 4: Start admin app (in separate terminal)

```bash
cd d:\Ab\TedTech\tedytalk-manager
npm run dev
```

Expected: Admin app loads with green Convex connection.

#### Step 5: Test Inventory page

1. Navigate to the Inventory page
2. All four tabs should display products from Convex database
3. No errors in browser console
4. Data updates in real-time from Convex

---

### 6. **Full Updated Code - InventoryPage.tsx**

```tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AllPhonesTab() {
  const products = useQuery(api.store.listProducts, {});

  if (products === undefined) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product) => (
            <TableRow key={product._id}>
              <TableCell>
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {product.name}
              </TableCell>
              <TableCell className="text-foreground">
                {product.description}
              </TableCell>
              <TableCell className="text-foreground">
                {product.price.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={product.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NewArrivalsTab() {
  const products = useQuery(api.store.listProducts, {});

  if (products === undefined) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Filter for active products only
  const activeProducts = products?.filter((p) => p.isActive) || [];

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeProducts?.map((product) => (
            <TableRow key={product._id}>
              <TableCell>
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {product.name}
              </TableCell>
              <TableCell className="text-foreground">
                {product.price.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PremiumTab() {
  const products = useQuery(api.store.listProducts, { isActive: true });

  if (products === undefined) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product) => (
            <TableRow key={product._id}>
              <TableCell>
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {product.name}
              </TableCell>
              <TableCell className="text-foreground">
                {product.price.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AccessoriesTab() {
  const products = useQuery(api.store.listProducts, { isActive: true });

  if (products === undefined) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product) => (
            <TableRow key={product._id}>
              <TableCell className="font-medium text-foreground">
                {product.name}
              </TableCell>
              <TableCell className="text-foreground">
                {product.description}
              </TableCell>
              <TableCell className="text-foreground">
                {product.price.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  Active
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Inventory</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            All Products
          </TabsTrigger>
          <TabsTrigger value="new" className="text-xs">
            New Arrivals
          </TabsTrigger>
          <TabsTrigger value="premium" className="text-xs">
            Premium
          </TabsTrigger>
          <TabsTrigger value="accessories" className="text-xs">
            Accessories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AllPhonesTab />
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <NewArrivalsTab />
        </TabsContent>

        <TabsContent value="premium" className="mt-4">
          <PremiumTab />
        </TabsContent>

        <TabsContent value="accessories" className="mt-4">
          <AccessoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### 7. **Next Steps**

Once verified, you can:

- Add more Convex mutations for creating/updating/deleting products
- Add search and filtering logic in the backend
- Implement proper authentication and authorization
- Add real-time updates using Convex subscriptions

---

### 📋 Checklist

- [x] ConvexProvider added to main.tsx
- [x] Query functions added to convex/store.ts
- [x] InventoryPage.tsx converted to use Convex hooks
- [x] .env.local created with VITE_CONVEX_URL placeholder
- [x] All UI components preserved
- [x] No fetch calls remain
- [ ] **TODO:** Update VITE_CONVEX_URL with actual deployment URL
- [ ] **TODO:** Run `npx convex dev` and verify "✔ Convex functions ready!"
- [ ] **TODO:** Test Inventory page in admin app

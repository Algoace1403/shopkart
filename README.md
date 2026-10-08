# ShopKart — Labs 01–06

Implements Labs 01–06 and the listed bonuses from [Lab-2029-Problem-Statements](https://github.com/mrinal1224/Lab-2029-Problem-Statements), including Razorpay Test Mode checkout and persistent orders.

## Bonus completion checklist

| Lab | Bonus in the supplied repository | Status |
|---|---|---|
| 01 | Protected change-password API, old-password verification and hashing | Complete: `PATCH /customers/change-password` |
| 02 | No bonus section | Not applicable |
| 03 | Price sorting via query parameters | Complete: `GET /products?sort=price_asc` and `price_desc` |
| 04 | Wishlist toggle and dynamic navbar count | Complete: UI add/remove toggle, optional `PATCH /wishlist/:productId/toggle`, and backend-derived count |
| 05 | No bonus section | Not applicable |
| 06 | Basic order status progression | Complete: guarded development status endpoint and visual progress |

A focused bonus audit passed 35 assertions covering authentication and password hashing, ascending/descending sorting across differently priced products with combined search/category filters, toggle saved states and wishlist counts. Wishlist toggle and navbar updates also passed the UI browser checks. Lab 01 and Lab 03 bonuses are API requirements in the supplied statements; they can be exercised using the Postman collection.

## Run locally

The Home page includes **Your account → Change password**. Products includes a **Sort by** dropdown for ascending or descending price; sorting works together with search and category filters. Wishlist cards provide the bonus add/remove toggle and the navbar displays the saved-product count.

MongoDB must be running. If it is not already running, start it:

```sh
mongod --dbpath /opt/homebrew/var/mongodb
```

The existing `backend/.env` supplies `PORT`, `MONGODB_URI` and `JWT_SECRET`. Use backend port `5001` and a local MongoDB URI on port `27017`.

```sh
cd /Users/aks/shopkart/backend
npm install
npm start
```

In a second terminal:

```sh
cd /Users/aks/shopkart/frontend
npm install
npm run dev -- --port 5174 --strictPort
```

Open `http://localhost:5174`. Restart an already-running backend after changing its code.

## Lab 01 — Customer authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/customers/register` | Register with fullName, email, password and phone |
| POST | `/customers/login` | Authenticate and set an HttpOnly JWT cookie |
| GET | `/customers/me` | Return the authenticated customer's profile |
| POST | `/customers/logout` | Clear the authentication cookie |
| PATCH | `/customers/change-password` | Bonus: verify oldPassword and hash newPassword |

Registration requires all four fields and a password of at least six characters. Duplicate emails return `409`; missing fields and short passwords return `400`. Invalid credentials and unauthenticated protected requests return `401`. Passwords are bcrypt hashes and are never returned in responses.

## Lab 02 — React authentication

- `/register`: controlled fields, validation errors, redirects to Login after registration.
- `/login`: sends cookies, shows invalid credentials, redirects to Home after login.
- `/home`: loads `/customers/me` and displays name, email and phone; unauthenticated users return to Login.
- Navbar Logout clears the cookie and redirects to Login.

## Lab 03 — Product catalog

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/products` | Create a product |
| GET | `/products` | List products with search, category and bonus price sorting |
| GET | `/products/:id` | Get product details |

Example creation body:

```json
{
  "name": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard with blue switches.",
  "price": 2999,
  "category": "Electronics",
  "image": "https://example.com/keyboard.jpg",
  "stock": 10
}
```

The lab image URL is a placeholder; supply an accessible image URL to display a real product image. Products are created through the API, not hardcoded in React.

Search and filter examples:

- `/products?search=keyboard`
- `/products?category=Electronics`
- `/products?search=keyboard&category=Electronics`
- `/products?sort=price_asc`
- `/products?sort=price_desc`

Price must be greater than zero and stock cannot be negative. Invalid IDs return `400`; nonexistent products return `404`. React `/products` displays searchable, filterable product cards; `/products/:id` shows details. Loading, error and empty states are included.

## Lab 04 — Wishlist

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/wishlist/:productId` | Save a Product reference |
| GET | `/wishlist` | Return the current customer's populated products and count |
| DELETE | `/wishlist/:productId` | Remove a saved reference |
| PATCH | `/wishlist/:productId/toggle` | Bonus: toggle membership and return `saved: true/false` |

All endpoints require the existing login cookie. Identity comes from authentication, never a supplied `userId`. Invalid IDs return `400`; missing products or absent removal targets return `404`; duplicate additions return `409`.

The Customer model stores Product ObjectIds with `ref: 'Product'`, defaulting to an empty array. The API uses `populate()` to return current product details.

Product cards show saving, success and failure states. `/wishlist` displays image, name, price, category, stock, View Details and Remove actions. Empty states link to Products; failed loads have Try Again. No page refresh is required.

Listed bonuses: a single add/remove UI toggle uses POST and DELETE, the optional PATCH toggle endpoint returns the saved state, and the navbar displays the count from backend wishlist data. The page refetches populated products on navigation and after mutations so prices, stock and counts reflect the backend. Wishlist uses ordinary component state and props, without a global state-management library.

## Lab 05 — Shopping cart

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/cart/:productId` | Add quantity 1 or increment the existing row |
| GET | `/cart` | Return populated products and quantities |
| PATCH | `/cart/:productId` | Set quantity with `{ "quantity": 3 }` |
| DELETE | `/cart/:productId` | Remove an item and return the updated cart |

All endpoints require login. Invalid IDs return `400`; missing products or absent cart items return `404`. Quantities must be whole numbers from 1 up to the latest product stock. The cart stores only Product references and quantities, not copied prices or totals. Repeated additions increment one row; concurrent edits are retried against the current document.

React Context shares cart items, loading/error state and mutation functions across product cards, product details, Navbar and `/cart`. Successful mutations update the shared state from the API response. Navigation reloads that single shared cart to show current prices and stock; rejected stock or stale-item mutations reconcile it with the backend. Navbar count is total quantity, and subtotal is calculated as the sum of price × quantity.

Cart provides quantity controls, explicit removal, order summary, loading/empty/error states and retry. The minus button normally decreases by one and stops at one; if stock has dropped below the saved quantity, it reduces to available stock. An out-of-stock item must be removed. Plus stops at stock. Proceed to Checkout opens the Lab 06 shipping and payment page.

## Verify the user flow

1. Register, log in, and refresh Home to check cookie persistence.
2. Browse Products, search, filter, and open product details.
3. Save a product to Wishlist. Check the navbar count, toggle removal, and save it again.
4. Open Wishlist, view details, and remove items. Removing the last item shows the empty state.
5. Add a product to Cart, then add it again. One row should hold both units.
6. Change quantity and confirm subtotal and navbar count update together. Stock limits prevent over-ordering.
7. Refresh and log out/back in. Wishlist and cart remain stored for that customer.
8. Remove all cart items to see the empty state and Browse Products link.

## Postman and earlier verification

Import `ShopKart.postman_collection.json`, select **ShopKart - Labs 01 to 06**, and run requests in order. `baseUrl` defaults to `http://localhost:5001`. Login cookies are handled automatically.

The original 75 requests cover Labs 01–05, including duplicate wishlist entries, populated data, cart increments, invalid quantities, stock limits, removal, authentication and login persistence. Each normal run creates a unique customer and product in the configured database.

```sh
cd /Users/aks/shopkart/frontend
npm run build
npm run lint
```

Backend verification passed 148 API/database assertions using an isolated temporary MongoDB database, including concurrent updates, customer isolation, price/stock changes and persistence. Temporary verification data is removed afterward.

The updated 75-request Postman collection passed all 206 assertions, including the optional Lab 04 toggle endpoint. Headless browser checks passed registration/login, protected routes, wishlist toggle/count/error/retry, cart addition from cards and details, quantity limits, totals, refresh/login persistence, removal, cart retry and mobile layout, with no JavaScript errors. Frontend build and lint passed without warnings.

## Code order for studying

1. Authentication: customer model → token utility → auth middleware → customer controller/routes → server.
2. React authentication: API service → Register/Login/Home → routing and Navbar.
3. Products: product model/controller/routes → Products, SearchBar, ProductCard, ProductDetails.
4. Wishlist: Customer wishlist field → wishlist controller/routes → ShopLayout component state → WishlistButton and Wishlist page.
5. Cart: Customer cart field → cart controller/routes → CartContext → AddToCartButton, CartItem, Cart page and Navbar.

### Lab 04 follow-up audit

The focused wishlist audit passed 82 API/database assertions, covering missing/invalid authentication, malformed IDs, absent products, duplicate additions, per-customer access, pre-existing customers without a wishlist field, ObjectId storage, populated current prices/stock, login persistence, removal and concurrent toggle/add requests. Browser checks passed loading/empty/error/retry states, failed saves/removals, disabled duplicate clicks, navbar count, details navigation, refresh/login persistence and mobile layout. Opening Wishlist and successful changes now reload backend data. Build and lint pass without warnings.

### Lab 05 follow-up audit

The focused cart audit passed 106 API/database assertions: authentication, ID validation, existing customers, Product references and quantities, duplicate-row prevention, concurrent increments, invalid quantities, stock limits, customer isolation, current prices/stock and login persistence. Browser checks passed multi-product counts and subtotals, pending actions and duplicate-click prevention, loading/empty/error/retry states, failed additions/quantity updates/removals, current prices on navigation, stock changes and recovery, refresh/login persistence, removal and mobile layout. Build and lint pass without warnings.


## Lab 06 — Checkout, Razorpay test payments and orders

Cart now links to `/checkout`. Enter all six shipping fields; phone requires 10 digits and pincode requires 6 digits. Whitespace-only values are rejected in both React and Express. Checkout uses the existing cart context, shows the current summary, and opens Razorpay Standard Checkout. Cancellation and failure leave the cart intact. A successful callback is verified by the server before showing `/orders/:id` and refreshing the cart/navbar. My Orders is available in the navbar at `/orders`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/orders/create-payment-order` | Validate shipping/current cart, snapshot products and create a pending Razorpay test order |
| POST | `/orders/verify-payment` | Verify signature, mark paid/placed and clear the unchanged cart |
| GET | `/orders` | Current customer's orders, newest first |
| GET | `/orders/:id` | Owned order with saved items, shipping, payment and status |
| PATCH | `/orders/:id/status` | Optional guarded development status progression |

Create-payment accepts only `{ "shippingAddress": { "fullName", "phone", "addressLine1", "city", "state", "pincode" } }` as meaningful input. Client prices, totals, product lists and identity are ignored. The backend reloads products, rejects deleted items and insufficient stock, calculates integer paise, persists name/price/image/quantity snapshots and sends the total to Razorpay. Orders do not populate live Product fields, so history survives price changes and product deletion.

Verification accepts `shopKartOrderId`, `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. It uses the **stored** Razorpay order ID in HMAC-SHA256 and compares signatures in constant time. Every order API requires login; customer reads and payment verification enforce ownership. Duplicate callbacks are idempotent and do not reset later fulfilment statuses. Failed verification can be retried from Checkout without making a second payment.

### Configure test payments

Add these values to the existing `backend/.env` and restart the backend:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Use credentials generated in Razorpay **Test Mode**. Live keys are rejected. Only the public key ID reaches React; the secret stays on the backend. `.env` is ignored by Git, and `backend/.env.example` lists configuration without real secrets. The integration follows [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

No usable Razorpay keys were present during implementation. The API returns a clear 503 configuration error until they are supplied. A real Razorpay-hosted test payment still needs to be exercised with those keys; the automated tests simulate only the external gateway.

### Bonus status progression

Set `ORDER_ADMIN_TOKEN` in backend `.env`. With a logged-in session, send `X-Order-Admin-Token` and `{ "status": "CONFIRMED" }` to `PATCH /orders/:id/status`, then advance to SHIPPED and DELIVERED. The endpoint only accepts one forward step at a time for paid orders, is disabled without the token, and is always disabled when `NODE_ENV=production`. Never put the token in React. The order details page displays the progress visually.

### Verify Lab 06

```sh
cd /Users/aks/shopkart/backend
npm test
cd /Users/aks/shopkart/frontend
npm run build
npm run lint
```

Backend tests use a uniquely named temporary MongoDB database and remove it after the run. The default MongoDB address is `mongodb://127.0.0.1:27017`; override it with `TEST_MONGODB_URI` if needed. They cover authentication, shipping, empty/deleted/stock-limited carts, gateway failure, server totals, fake signatures, ownership, paid confirmation, concurrent/repeated callbacks, cart edits, snapshots and guarded status progression. They do not contact Razorpay.

The Postman collection includes an additional Lab 06 folder with 11 requests. Run it after the original requests with test keys configured. To test successful payment, use the React Checkout and then inspect the stored order and empty cart through the APIs.

For manual review: add products → checkout → test invalid fields → cancel a payment and confirm cart preservation → retry and complete a test payment → check Cart (0), confirmation, My Orders and reload persistence. Verify an empty checkout and the orders empty/error/retry states too.

Implementation scope: stock is checked at payment-order creation; this lab does not reserve or decrement inventory. An unchanged cart is cleared after verified payment. If another tab edits the cart while payment is open, its newer contents are preserved using a cart revision check. Paid persistence and cart clearing are recoverable through a repeated verification request, without requiring a MongoDB replica set. Payment callbacks must reach the application; automatic webhook reconciliation is outside this lab implementation.

Lab 06 verification completed: all 12 backend tests pass; frontend build and lint pass. Headless browser checks with mocked API/gateway responses passed shipping validation, cancelled/failed payments, verification retry without another payment, Cart (0), confirmation reload, order history, empty/error/retry states and mobile layout, with no JavaScript page errors. An actual Razorpay-hosted Test Mode payment remains unverified until test keys are configured.

## Vercel deployment

Live site: https://shopkart-self.vercel.app

The repository root contains `vercel.json`. Vercel builds `frontend/dist` and runs the Express backend through `api/index.js`. Production browser requests use `/api` on the same domain, preserving secure authentication cookies. The database connection is reused across warm function invocations with a bounded connection pool.

Configure `MONGODB_URI` and `JWT_SECRET` as private Vercel production environment variables, with `NODE_ENV=production`. Add Razorpay **test** keys there to enable payments; they are not currently configured. Do not upload `.env` files. `.vercelignore` excludes local environment files and installed dependencies.

Deploy from the repository root with `vercel --prod`. The initial deployment used the CLI; automatic GitHub deployment integration was not established. Atlas network access was configured for this lab with an explicitly approved `0.0.0.0/0` entry. Existing local records were not migrated, so Atlas starts with new application data.

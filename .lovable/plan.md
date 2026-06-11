I will now proceed with the database migration and the integration of the Mercado Pago payment gateway (via server functions) as requested.

### 1. Database Setup
Since you provided the Supabase credentials in `.env.example`, I will ensure the application is configured to use them.
**Action required from you:** As per our previous communication, please copy the content of `db/migrations/001_init.sql` and run it in your **Supabase SQL Editor** to create the necessary tables and the `reserve_numbers` function.

### 2. Mercado Pago Integration
I will implement the backend logic to generate real PIX payments using the Mercado Pago credentials you provided.
- **Backend Service:** Create a server-side function using `@tanstack/react-start` to communicate with the Mercado Pago API securely.
- **Checkout Page:** Update `src/routes/checkout.$orderId.tsx` to call this backend function instead of using mock data.
- **Webhook (Future):** I will add a placeholder for a webhook to receive payment notifications automatically.

### 3. Implementation Plan
- **File Edits:**
    - `src/lib/mercadopago.server.ts`: New file to handle Mercado Pago SDK/API calls.
    - `src/lib/api/payment.functions.ts`: New server function `createPixPayment`.
    - `src/routes/checkout.$orderId.tsx`: Update to fetch the real PIX QR code and copy-paste string from the backend.
    - `src/routes/admin.campaigns.$id.tsx`: Ensure admin can see real payment details if needed.

Technical Details:
- Uses `ACCESS_TOKEN` and `PUBLIC_KEY` for Mercado Pago.
- Implements PIX (Instant payment) with 15-minute expiration matching the reservation.
- Environment variables are read safely on the server.

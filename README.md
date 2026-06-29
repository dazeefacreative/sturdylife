# Sturdy Life — Full Stack E-commerce

## Quick Start (Local Development)

### 1. Database
- Start MySQL (XAMPP / WAMP / Homebrew)
- Create database: `sturdy_life`
- Run: `backend/schema.sql` in phpMyAdmin or MySQL CLI

### 2. Backend
```bash
cd backend
npm install
node server.js        # runs on http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
pnpm install
pnpm dev              # runs on http://localhost:5173
```
Vite proxies /api → http://localhost:3000 automatically.

### 4. Create admin user
```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./config/db');
bcrypt.hash('Admin1234!', 12).then(hash => {
  db.query('INSERT INTO users (first_name,last_name,email,password_hash,role) VALUES (?,?,?,?,?)',
    ['Admin','User','admin@sturdylife.com',hash,'admin'])
    .then(() => { console.log('Admin created'); process.exit(0); });
});
"
```

## Routes
| URL | Description |
|-----|-------------|
| / | Homepage |
| /shop | All products |
| /shop/:category | Filtered products |
| /product/:slug | Product detail |
| /cart | Shopping cart |
| /checkout | Place order |
| /login | Sign in |
| /register | Create account |
| /account | Customer dashboard |
| /account/orders | Order history |
| /payment/success | After Paystack payment |
| /admin | Admin dashboard |
| /admin/products | Manage products |
| /admin/orders | Manage orders |
| /admin/customers | View customers |

## Paystack Test Card
- Number: `4084084084084081`
- Expiry: Any future date
- CVV: Any 3 digits

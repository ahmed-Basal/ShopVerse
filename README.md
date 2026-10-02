# 🛒 Full-Stack E-Commerce & Admin Dashboard Platform

A modern, high-performance, full-stack E-Commerce application with an integrated **Customer Storefront** and a powerful **Admin Management Dashboard**. Built with **Angular 17**, **Tailwind CSS**, **Node.js / Express**, **PostgreSQL**, and **Prisma ORM**.

---

## 🚀 Key Highlights & Tech Stack

### 🎨 Frontend
- **Framework**: [Angular 17](https://angular.dev/) (Standalone Components, Modern `@if`/`@for` Control Flow, Reactive Forms)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) with a curated Dark Navy / Ocean theme (`ocean-950`, `ocean-900`, `cyan`, `blue`), glassmorphism, and responsive layouts
- **UI Components & Icons**: [PrimeNG](https://primeng.org/) & [PrimeIcons](https://primefaces.org/primeicons/)
- **State & HTTP**: Angular Signals, RxJS Observables, HTTP Interceptors for JWT auth & error handling
- **Image Handling**: Custom image uploader supporting both local file uploads (multipart) and direct CDN image URLs

### ⚙️ Backend (Web API)
- **Runtime & Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` password hashing, Role-Based Access Control (`user`, `admin`, `manager`)
- **Payments**: Stripe API integration + Cash on Delivery (COD)
- **File Uploads**: Multer with `sharp` image processing & thumbnail optimization
- **Async Tasks & Queues**: BullMQ with Redis support
- **Logging & Monitoring**: Pino HTTP logging & Prometheus metrics (`prom-client`)
- **Documentation**: OpenAPI 3.0 specification & Postman collection included

---

## ✨ Features Overview

### 🛍️ Customer Storefront
- **Dynamic Home Page**: Hero banners, quick category slider, popular products, and coupon announcements.
- **Product Catalog**: Multi-attribute filtering (category, brand, price range, ratings, search query).
- **Product Details**: High-resolution image viewing, live quantity and subtotal pricing reactivity, stock status, and reviews.
- **Interactive Cart**: Centered responsive layout, bordered image cards, inline quantity +/- adjustments, instant item removal, and subtotal calculation.
- **Wishlist**: One-click add/remove directly from product cards across Home and Catalog pages.
- **Checkout & Orders**: Multi-step checkout with address selection, coupon code discount redemption, and order status tracking.
- **Authentication**: Sign Up, Sign In, Remember Me, Forgot Password, and OTP verification flow.

### ⚡ Admin Dashboard (`/dashboard`)
- **Modern Dark UI**: Fluid sidebar navigation with collapsible toggle, top bar with user profile and quick links.
- **Overview Analytics**: High-level store metrics, sales stats, and quick shortcuts.
- **Products Management**: Full CRUD, multiple image uploads, discount pricing, stock management, and search.
- **Categories & Taxonomy**:
  - Dual view modes: **Grid Cards** & **Table View**.
  - Category cover banners with live preview.
  - Nested subcategories display with inline quick-add and delete.
  - Search filter by category name or slug.
- **Subcategories & Brands Management**: Dedicated views to organize parent-child taxonomy and brand associations.
- **Orders Management**: Order status tracking, payment verification, and customer delivery details.
- **Coupons Management**: Create and manage discount codes, percentage / fixed discounts, and expiration dates.
- **Users Management**: User directory, role assignment (`user` vs `admin`), and account status.

---

## 📂 Project Structure

```text
full-stack/
├── frontend/                     # Angular 17 Client Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/       # Global navigation, navbar, footer, cart badge
│   │   │   ├── core/             # Auth guards, HTTP interceptors, services, models
│   │   │   ├── layouts/          # Storefront layout, Admin layout, Auth layout
│   │   │   ├── pages/            # Feature pages (Home, Cart, Products, Dashboard, etc.)
│   │   │   └── shared/           # Reusable UI components (Modals, Uploaders, Cards)
│   │   ├── assets/               # Static icons, placeholder images
│   │   └── styles.scss           # Global styles and Tailwind directives
│   ├── tailwind.config.js        # Custom ocean color palette & theme extensions
│   └── package.json
│
├── web api/                      # Express REST API Server
│   ├── config/                   # Database connection and environment loaders
│   ├── middlewares/              # JWT auth guard, error handler, role verification
│   ├── models/                   # Legacy models & Mongoose/Prisma schema mappings
│   ├── prisma/                   # Prisma schema & database migration history
│   │   └── schema.prisma
│   ├── routes/                   # Express route definitions (auth, products, cart, etc.)
│   ├── services/                 # Business logic and database operations
│   ├── uploads/                  # Uploaded product and category media
│   ├── utils/                    # Data seeders, validators, API error helpers
│   ├── server.js                 # Application entry point
│   ├── apidog_openapi_spec.json  # OpenAPI 3.0 API Documentation
│   └── package.json
│
├── package.json                  # Root runner script for simultaneous execution
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Running locally or via a cloud provider (e.g. Supabase, Neon)

---

### 1. Clone & Install Dependencies

Run from the repository root:
```bash
# Install dependencies for both Frontend and Backend concurrently
npm run install:all
```
*Or install them individually:*
```bash
# Backend
cd "web api"
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the `web api/` directory:

```env
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:8000

# PostgreSQL Database Connection URL (Prisma)
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ecommerce?schema=public"

# JWT Secret & Expiry
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE_TIME=90d

# Stripe (Optional for Card Payments)
STRIPE_SECRET_KEY=sk_test_...

# Email / SMTP (Optional for OTP verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

---

### 3. Setup the Database (Prisma)

From the `web api/` folder:
```bash
cd "web api"

# Generate Prisma Client
npm run db:generate

# Push database schema or run migrations
npm run db:push

# (Optional) Seed dummy data
npm run db:seed
```

---

### 4. Run the Application

You can start both servers together from the root directory:

```bash
# Start both Backend (Port 8000) and Frontend (Port 4200) concurrently
npm start
```

Or run them in separate terminals:

**Backend:**
```bash
npm run start:backend
# Server running at: http://localhost:8000
```

**Frontend:**
```bash
npm run start:frontend
# Client running at: http://localhost:4200
```

---

## 🌐 Endpoints & API Reference

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend Storefront** | `http://localhost:4200` | Main customer-facing application |
| **Admin Dashboard** | `http://localhost:4200/dashboard` | Admin panel (Requires admin role) |
| **REST API Base** | `http://localhost:8000/api/v1` | Express API endpoints |
| **Metrics** | `http://localhost:8000/metrics` | Prometheus observability metrics |

An OpenAPI 3.0 specification file is located at [`web api/apidog_openapi_spec.json`](file:///c:/Users/ahmed/OneDrive/Desktop/New%20folder/full%20stack/web%20api/apidog_openapi_spec.json), which can be imported directly into **Postman**, **Insomnia**, or **Swagger UI**.

---

## 📜 Available NPM Scripts

### Root Directory
- `npm run install:all`: Installs dependencies for both `web api` and `frontend`.
- `npm run start:backend`: Runs the Express server in development mode with `nodemon`.
- `npm run start:frontend`: Runs the Angular dev server with live reload.
- `npm start`: Runs both backend and frontend concurrently.

### Backend (`web api/`)
- `npm run start:dev`: Starts API with nodemon hot-reload.
- `npm run db:generate`: Regenerates Prisma Client.
- `npm run db:migrate`: Creates and applies database migrations.
- `npm run db:push`: Pushes schema directly to the database.
- `npm run db:studio`: Launches Prisma Studio visual database editor.
- `npm run db:seed`: Seeds initial categories, brands, and products.

### Frontend (`frontend/`)
- `npm start`: Serves Angular on `http://localhost:4200`.
- `npm run build`: Builds production artifacts into `dist/`.
- `npm test`: Runs unit tests with Karma and Jasmine.

---

## 🛡️ License

This project is licensed under the **ISC License**.

## Best Lashes — Full‑Stack Booking Website

Best Lashes is a full‑stack web application for a lash studio. It lets customers explore services and styles (Cluster and Mink), then request bookings. An admin dashboard provides secure authentication, appointment management, and time‑slot controls.

### Features
- Public marketing site with hero, service overviews, and social links
- Category‑first product browsing for Cluster and Mink (Classic, Volume, Hybrid)
- Smooth scroll and prefilled booking when a product is selected
- Lash Consultation page with a styled booking form
- Admin authentication (JWT) and protected dashboard
- Manage bookings (list, confirm, cancel)
- Manage time slots (create/list/update/delete, public availability endpoint)

### Tech Stack
- Frontend: React 19, React Router, Vite, CSS (custom design system)
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT (admin)

### Monorepo Layout
```
client/               # React app (Vite)
  src/
    components/       # UI components (Navigation, Footer, etc.)
    pages/            # App pages (AdminDashboard, ClusterLashes, MinkLashes, LashConsultation)
    data/products.js  # Product catalog and images
server/               # Express API with MongoDB
  routes/             # auth, bookings, admin, timeSlots
  models/             # User, Booking, TimeSlot
  middleware/         # auth (JWT, admin guards)
  setup-admin.js      # Utility to create an initial admin
README.md             # This file
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or a hosted cluster)

### 1) Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2) Configure environment
Create `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/beauty-booking
JWT_SECRET=your_strong_secret
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

**Note:** For production, use a strong password and consider hashing it with bcrypt. The system supports both plain text and hashed passwords (starting with `$2`).

### 3) Start the backend
```bash
cd server
npm run dev   # or: npm start
```

### 4) Start the frontend
```bash
cd client
npm run dev
```
Vite will print a local dev URL (e.g., http://localhost:5173). The backend runs on http://localhost:5000 by default.

### 5) Admin Login
Use the credentials from your `.env` file:
- Username: Value of `ADMIN_USERNAME` (default: `admin`)
- Password: Value of `ADMIN_PASSWORD` (default: `admin123`)

Navigate to `/admin` to sign in.

---

## Development Scripts

### Frontend (client)
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

### Backend (server)
- `npm run dev` — start with nodemon
- `npm start` — start Express server

---

## API Overview (server)

Base URL: `http://localhost:5000`

Auth
- `POST /api/auth/login` — returns `{ token, user }` (admin)
- `GET /api/auth/me` — returns current user (requires `Authorization: Bearer <token>`)

Bookings
- `POST /api/bookings` — create a booking (public), basic time conflict check
- `GET /api/bookings` — list all bookings (admin only)
- `PATCH /api/bookings/:id/status` — update status (`pending|confirmed|cancelled`) (admin only)

Time Slots
- `GET /api/time-slots` — list all (admin only)
- `POST /api/time-slots` — create (admin only)
- `PATCH /api/time-slots/:id` — update availability (admin only)
- `DELETE /api/time-slots/:id` — delete (admin only)
- `GET /api/time-slots/available` — list available slots (public, `?date=YYYY-MM-DD` optional)

---

## Key Frontend Behaviors
- Category‑first browsing on Cluster/Mink pages. Users first pick Classic/Volume/Hybrid, then see matching products.
- Clicking a product pre‑fills the “Selected Product” field and smoothly scrolls to the booking form.
- On mobile, sections use spacing, scroll‑margin, and responsive typography for a clean layout.
- Footer uses Font Awesome social icons and provides a Contact link.

---

## Production Notes
- Set real values for `MONGODB_URI` and `JWT_SECRET` in production.
- Serve the built client from a CDN or static host; deploy the server behind HTTPS with CORS configured as needed.
- Consider environment‑based API URLs in the client (e.g., via Vite env variables) for non‑localhost deployments.

---

## License / Ownership
© Chief Studios. All rights reserved.



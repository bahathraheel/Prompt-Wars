# 🏟️ EXO — Intelligent Stadium Experience Platform

A full-stack Node.js/Express application that transforms the stadium experience with interactive seat navigation, mobile food ordering, real-time restroom monitoring, and an admin operations dashboard.
#LIVE URL:https://exo-stadium-355837571867.us-central1.run.app
## ✨ Features

### 🗺️ Find My Seat — Interactive Stadium Map
- 2D overhead Canvas-rendered stadium with 14 sections, 4 gates, 3 concession stands, and 4 restrooms
- Click any gate + section to trace the optimal walking path with animated route visualization
- Live occupancy overlay with color-coded crowd density
- Hover tooltips with section details

### 🍔 Order Food — Concessions Storefront
- Digital menu with 15 items across Mains, Snacks, & Drinks categories
- Filter buttons for browsing by category
- Full shopping cart with add/remove/quantity controls
- Checkout generates a unique order number + QR code for pickup

### 🚻 Restroom Radar
- Real-time wait times and occupancy for every restroom
- Color-coded status badges (Low / Medium / High)
- Auto-refreshes every 15 seconds
- Recommends the shortest-wait restroom automatically

### 📊 Admin Dashboard (Hidden)
- Secure login (`admin` / `exo2026`)
- Live crowd heatmap with color-coded occupancy
- Digital signage override with priority levels
- Emergency protocol activation
- Real-time orders table

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Node.js + Express                 |
| Frontend   | HTML5 + CSS3 + Vanilla JavaScript |
| Rendering  | Canvas 2D API                     |
| Storage    | `checks.json` (last 10 checks)   |
| Deployment | Docker + Google Cloud Run         |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Visit http://localhost:8080
```

## 📁 Project Structure

```
EXO/
├── server.js              # Express server + REST API
├── validate.js             # Health check + browser validation script
├── checks.json             # Last 10 check history
├── package.json
├── Dockerfile
├── .dockerignore
└── public/
    ├── index.html          # Homepage — 3 main actions
    ├── stadium.html        # Interactive stadium map
    ├── concessions.html    # Food ordering storefront
    ├── restrooms.html      # Restroom radar
    ├── admin.html          # Admin dashboard (login-protected)
    ├── css/
    │   └── style.css       # Full dark theme + glassmorphism
    └── js/
        ├── main.js         # Homepage particles + animations
        ├── stadium.js      # Canvas map + path tracing
        ├── concessions.js  # Menu + cart + QR code
        ├── restrooms.js    # Real-time restroom cards
        └── admin.js        # Dashboard + heatmap + signage
```

## 🔌 API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/api/health`         | Health check (writes to checks.json) |
| GET    | `/api/checks`         | Last 10 check history          |
| GET    | `/api/menu`           | Menu items (optional `?category=`) |
| GET    | `/api/stadium`        | Stadium layout data            |
| GET    | `/api/stadium/heatmap`| Live crowd occupancy           |
| GET    | `/api/restrooms`      | Restroom wait times            |
| POST   | `/api/orders`         | Place a food order             |
| GET    | `/api/orders`         | All orders                     |
| POST   | `/api/admin/login`    | Admin authentication           |
| POST   | `/api/admin/signage`  | Override digital signage       |
| POST   | `/api/admin/emergency`| Activate emergency protocol    |

## 🐳 Docker & Cloud Run Deployment

```bash
# Build Docker image
docker build -t exo-stadium .

# Run locally
docker run -p 8080:8080 exo-stadium

# Deploy to Cloud Run
gcloud run deploy exo-stadium \
  --source . \
  --region us-central1 \
  --memory 512Mi \
  --allow-unauthenticated \
  --port 8080
```

## 🔐 Admin Access

- **URL:** `/admin`
- **Username:** `admin`
- **Password:** `exo2026`

---

**EXO** © 2026 — Built for the future of live events
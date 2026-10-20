# 🚀 TasteTrial Food Delivery - Render Deployment Guide

This guide provides complete instructions to deploy the entire **TasteTrial Food Delivery** system (Backend, Client Frontend, and Admin Frontend) to **[Render](https://render.com)**.

---

## 🏗️ Architecture Overview

The project consists of 3 services:

| Component | Type on Render | Root Directory | Build Command | Start / Publish |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | **Web Service** (Node) | `backend` | `npm install` | `npm start` |
| **Client Frontend** | **Static Site** | `frontend` | `npm install && npm run build` | `dist` |
| **Admin Frontend** | **Static Site** | `admin/frontend` | `npm install && npm run build` | `dist` |

---

## ⚡ Method 1: Automatic Deployment via Render Blueprint (Recommended)

A pre-configured `render.yaml` file has been added to your project root. Render will automatically read this file and link all 3 services together.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** in the top right and select **"Blueprint"**.
4. Connect your GitHub repository.
5. Render will detect `render.yaml` and display the 3 services:
   - `tastetrial-backend` (Web Service)
   - `tastetrial-frontend` (Static Site)
   - `tastetrial-admin` (Static Site)
6. Fill in the required secret environment variables (e.g. `MONGODB_URL`, `EMAIL`, `PASS`, `CLOUDINARY_*`, `RAZORPAY_*`, `VITE_GEOAPIKEY`, `VITE_FIREBASE_APIKEY`).
7. Click **"Apply"** to deploy all services at once!

---

## 🛠️ Method 2: Manual Deployment (Step-by-Step)

If you prefer to configure the services manually on Render:

### Step 1: Deploy Backend (Web Service)
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `tastetrial-backend` (or your choice)
   - **Region**: Closest to your users (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Expand **Advanced** and set:
   - **Health Check Path**: `/health`
5. In the **Environment Variables** section, add:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL=your_email@gmail.com
   PASS=your_gmail_app_password
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   RAZORPAY_KEY_ID=rzp_test_xxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   FRONTEND_URL=https://<your-frontend-name>.onrender.com
   ADMIN_FRONTEND_URL=https://<your-admin-name>.onrender.com
   ```
   *(Note: You can update `FRONTEND_URL` and `ADMIN_FRONTEND_URL` after creating the frontends in steps 2 & 3).*
6. Click **Create Web Service**. Copy the backend URL (e.g. `https://tastetrial-backend.onrender.com`).

---

### Step 2: Deploy Client Frontend (Static Site)
1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect the same repository.
3. Configure the settings:
   - **Name**: `tastetrial-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add the **Environment Variables**:
   ```env
   VITE_SERVER_URL=https://<your-backend-url>.onrender.com
   VITE_GEOAPIKEY=your_geoapify_key
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxx
   VITE_FIREBASE_APIKEY=your_firebase_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key (optional)
   ```
5. Click **Create Static Site**.
*(The `_redirects` file in `frontend/public/_redirects` automatically ensures routes like `/my-orders` and `/cart` don't 404 on refresh).*

---

### Step 3: Deploy Admin Frontend (Static Site)
1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect the same repository.
3. Configure the settings:
   - **Name**: `tastetrial-admin`
   - **Branch**: `main`
   - **Root Directory**: `admin/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add the **Environment Variables**:
   ```env
   VITE_BACKEND_URL=https://<your-backend-url>.onrender.com
   ```
5. Click **Create Static Site**.
*(The `_redirects` file in `admin/frontend/public/_redirects` handles SPA client routing for the admin dashboard).*

---

### Step 4: Final Link Check
Go back to your **Backend Web Service** settings in the Render Dashboard:
- Update `FRONTEND_URL` to match your deployed Client Frontend URL (`https://tastetrial-frontend.onrender.com`).
- Update `ADMIN_FRONTEND_URL` to match your deployed Admin Frontend URL (`https://tastetrial-admin.onrender.com`).
- Render will automatically trigger a redeploy of the backend.

---

## 🔑 Crucial Configurations Already Done in the Code

1. **Proxy & Secure Cookies**:
   - `app.set("trust proxy", 1)` has been added to `backend/index.js` to ensure cross-origin HTTPS cookies work seamlessly through Render's reverse proxy.
   - `secure: isProduction, sameSite: isProduction ? "None" : "Lax"` is configured for both user and admin JWT cookies.

2. **CORS & Socket.IO**:
   - `backend/index.js` dynamically accepts `FRONTEND_URL`, `ADMIN_FRONTEND_URL`, and any Render subdomain (`*.onrender.com`), allowing both REST requests and live Socket.IO tracking connections.

3. **Dynamic Frontend Backend URLs**:
   - `frontend/src/App.jsx` dynamically reads `import.meta.env.VITE_SERVER_URL`.
   - `admin/frontend/src/api/index.js` dynamically reads `import.meta.env.VITE_BACKEND_URL`.

4. **SPA 404 Fix**:
   - Added `_redirects` in `frontend/public/` and `admin/frontend/public/` with `/* /index.html 200` so direct URL visits and page reloads work without 404 errors.

5. **Health Check**:
   - Added `GET /health` endpoint in `backend/index.js` for zero-downtime health monitoring.

---

## 💡 Notes on Render Free Tier
- **Spin-down after inactivity**: Render's free Web Services sleep after 15 minutes of inactivity. When a request arrives, it takes ~30-50 seconds to spin back up (a cold start).
- To keep the backend warm, you can use a free pinging service like **[Cron-Job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)** to ping `https://<your-backend-url>.onrender.com/health` every 10 minutes.

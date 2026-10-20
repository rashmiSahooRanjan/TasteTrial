import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import userRouter from "./routes/user.routes.js"

import itemRouter from "./routes/item.routes.js"
import shopRouter from "./routes/shop.routes.js"
import orderRouter from "./routes/order.routes.js"
import adminRouter from "./routes/admin.routes.js"
import http from "http"
import { Server } from "socket.io"
import { socketHandler } from "./socket.js"

const app=express()
const server=http.createServer(app)

// Trust proxy for Render / reverse proxies so secure cookies work properly
app.set("trust proxy", 1)

const envOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) 
  : [];

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL,
  ...envOrigins
].filter(Boolean);

const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    allowedOrigins.some(ao => origin.startsWith(ao)) ||
    (process.env.NODE_ENV === "production" && (origin.endsWith(".onrender.com") || origin.includes("render.com"))) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(null, true);
};

const corsOptions = {
  origin: corsOriginHandler,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
};

const io = new Server(server, {
  cors: corsOptions
})

app.set("io", io)

const port = process.env.PORT || 8000
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())

// Root landing page
app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>TasteTrial API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #fff9f6; color: #1f2937; }
          .card { background: white; padding: 2.5rem 3rem; border-radius: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; border: 1px solid #fed7aa; max-width: 480px; width: 90%; }
          .badge { display: inline-flex; align-items: center; gap: 0.4rem; background: #dcfce7; color: #15803d; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-bottom: 1.25rem; }
          .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block; }
          h1 { color: #ff4d2d; margin: 0 0 0.5rem 0; font-size: 1.85rem; }
          p { color: #6b7280; font-size: 0.95rem; line-height: 1.5; margin: 0.5rem 0; }
          .links { margin-top: 1.5rem; display: flex; justify-content: center; gap: 1rem; }
          a { color: #ff4d2d; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 0.5rem; background: #fff1ee; transition: all 0.2s; }
          a:hover { background: #ffe4de; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> Server Active & Running</div>
          <h1>🍕 TasteTrial Backend</h1>
          <p>The backend API service is successfully running and ready to handle requests.</p>
          <div class="links">
            <a href="/health">Health Check</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
app.use("/api/shop",shopRouter)
app.use("/api/item",itemRouter)
app.use("/api/order",orderRouter)
app.use("/api/admin",adminRouter)

socketHandler(io)
server.listen(port,()=>{
    connectDb()
    console.log(`Server is running on port ${port}`)
})


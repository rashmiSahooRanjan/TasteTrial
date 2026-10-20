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


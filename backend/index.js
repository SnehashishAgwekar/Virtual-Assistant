import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import geminiResponse from "./gemini.js"

const app = express()

app.use(cors({
    origin: "http://localhost:5173",  // ✅ fixed port
    credentials: true
}))

app.use(express.json())       // ✅ moved up, clean order
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)

const port = process.env.PORT || 5000

app.listen(port, () => {
    connectDb()
    console.log("server started")
})
import mongoose from "mongoose"
import Admin from "../models/admin.model.js"
import bcrypt from "bcryptjs"

const autoSeedAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne({ email: "admin@kosfood.com" })
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("admin123", 10)
            await Admin.create({
                fullName: "Super Admin",
                email: "admin@kosfood.com",
                password: hashedPassword,
                role: "superadmin",
                isActive: true
            })
            console.log("Default admin account auto-seeded successfully (admin@kosfood.com)")
        }
    } catch (error) {
        console.error("Auto-seed admin error:", error.message)
    }
}

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Admin DB Connected Successfully")
        await autoSeedAdmin()
    } catch (error) {
        console.log("Admin DB Connection Error:", error.message)
    }
}

export default connectDb



import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

import path from "path";

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        return response.secure_url || response.url;
    } catch (error) {
        console.log("Cloudinary upload error:", error.message);
        if (localFilePath) {
            const filename = path.basename(localFilePath);
            return `/uploads/${filename}`;
        }
        return null;
    }
};

export default uploadOnCloudinary;


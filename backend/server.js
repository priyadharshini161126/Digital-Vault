const authMiddleware = require("./middleware/authMiddleware");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const dns = require("dns");

const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");
const File = require("./models/File");
const User = require("./models/User");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const requiredConfig = ["MONGO_URI", "JWT_SECRET"];
const smtpConfig = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];

console.log("Environment loaded from:", path.join(__dirname, ".env"));
console.log("Required config:", Object.fromEntries(
    requiredConfig.map((key) => [key, Boolean(process.env[key])])
));
console.log("SMTP config:", Object.fromEntries(
    smtpConfig.map((key) => [key, Boolean(process.env[key])])
));

const app = express();

const PORT = 5000;
const uploadsDir = path.join(__dirname, "uploads");

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("Missing required backend configuration. Check backend/.env.");
    process.exit(1);
}

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ]
}));

app.use("/uploads", express.static(uploadsDir));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });

// AUTH ROUTES
app.use("/auth", authRoutes);
app.use("/files", fileRoutes);

// File Upload Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage: storage
});

// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "Backend is working 🚀"
    });
});

// Old test route
app.get("/test", (req, res) => {
    res.send("Digital Vault Server is running");
});

// Profile Image Route
app.post(
    "/auth/profile/image",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No image uploaded" });
            }
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user.profileImage = req.file.filename;
            await user.save();
            res.json({ message: "Profile image updated successfully", user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// Upload Route
app.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    async (req, res) => {
        try {
            const newFile = new File({
                userId: req.user.userId,
                originalName: req.file.originalname,
                fileName: req.file.filename,
                filePath: req.file.path,
                size: req.file.size
            });

            await newFile.save();

            res.json({
                message: "File uploaded and saved successfully",
                file: newFile
            });
        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    }
);

// Start Server
app.listen(PORT, () => {
    console.log("Server started on port 5000");
});

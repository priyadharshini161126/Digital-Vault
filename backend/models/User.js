const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    firstName: {
        type: String
    },

    secondName: {
        type: String
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String
    },

    gender: {
        type: String,
        enum: ["male", "female", "others"]
    },

    profileImage: {
        type: String
    },

    password: {
        type: String,
        required: true
    },

    resetCode: {
        type: String
    },

    resetCodeExpires: {
        type: Date
    },

    resetCodeVerified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

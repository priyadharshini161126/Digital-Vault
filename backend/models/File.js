const mongoose = require("mongoose");


const fileSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },


    originalName:{
        type:String,
        required:true
    },


    fileName:{
        type:String,
        required:true
    },


    filePath:{
        type:String,
        required:true
    },


    size:{
        type:Number
    },


    uploadedAt:{
        type:Date,
        default:Date.now
    }


});


module.exports = mongoose.model("File", fileSchema);
const express = require("express");
const multer = require("multer");
const router = express.Router();

const File = require("../models/File");


// storage setup

const storage = multer.diskStorage({

  destination: function(req, file, cb){

    cb(null, "uploads/");

  },


  filename: function(req, file, cb){

    cb(null, Date.now() + "-" + file.originalname);

  }

});


const upload = multer({ storage });



// upload API

router.post("/", upload.single("file"), async (req,res)=>{


  try {


    const newFile = new File({

      userId: "000000000000000000000000",

      originalName: req.file.originalname,

      fileName: req.file.filename,

      filePath: req.file.path,

      size: req.file.size

    });



    await newFile.save();



    res.json({

      message:"File uploaded and saved to database 🚀",

      file:newFile

    });


  }


  catch(err){


    console.log(err);


    res.status(500).json({

      error:"Upload failed"

    });


  }


});



module.exports = router;
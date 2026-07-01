const express = require("express");
const path = require("path");
const fs = require("fs");

const File = require("../models/File");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();



// ===============================
// GET USER FILES
// ===============================

router.get("/", authMiddleware, async (req, res) => {

    try {


        const files = await File.find({

            userId: req.user.userId

        });


        res.json(files);



    } catch (error) {


        res.status(500).json({

            error: error.message

        });


    }

});





// ===============================
// DOWNLOAD FILE
// ===============================

router.get("/:id", authMiddleware, async (req, res) => {


    try {


        const file = await File.findById(req.params.id);



        if (!file) {


            return res.status(404).json({

                message: "File not found"

            });


        }



        // Check ownership

        if (file.userId.toString() !== req.user.userId) {


            return res.status(403).json({

                message: "Access denied"

            });


        }



        const filePath = path.resolve(
            __dirname,
            "..",
            file.filePath
        );



        res.download(
            filePath,
            file.originalName
        );



    } catch (error) {


        res.status(500).json({

            error: error.message

        });


    }


});





// ===============================
// DELETE FILE
// ===============================

router.delete("/:id", authMiddleware, async (req, res) => {


    try {


        const file = await File.findById(req.params.id);



        if (!file) {


            return res.status(404).json({

                message: "File not found"

            });


        }



        // Check ownership

        if (file.userId.toString() !== req.user.userId) {


            return res.status(403).json({

                message: "Access denied"

            });


        }



        // Delete actual file from uploads folder

        const filePath = path.resolve(
            __dirname,
            "..",
            file.filePath
        );


        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);

        }



        // Delete file details from MongoDB

        await File.findByIdAndDelete(req.params.id);



        res.json({

            message: "File deleted successfully"

        });



    } catch (error) {


        res.status(500).json({

            error: error.message

        });


    }


});





module.exports = router;
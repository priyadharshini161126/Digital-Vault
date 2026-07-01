const jwt = require("jsonwebtoken");


const authMiddleware = (req, res, next) => {


    try {


        const authHeader = req.headers.authorization;
        const queryToken = req.query.token;


        if(!authHeader && !queryToken){

            return res.status(401).json({
                message:"No token provided"
            });

        }

        const token = authHeader
            ? authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader
            : queryToken;



        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        req.user = decoded;


        next();



    } catch(error){


        res.status(401).json({
            message:"Invalid token"
        });


    }

};


module.exports = authMiddleware;

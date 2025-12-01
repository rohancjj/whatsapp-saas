import jwt from "jsonwebtoken"

export default function authMiddleware(req,res,next){
    const token = req.header.authrization?.split(" ")[1]

    if(!token)return res.status(401).json({ message: "Missing token" });

    try {
        const data = jwt.verify(token,process.env.JWT_SECRET)
        req.user = data
        next()
        
    } catch (error) {
        return res.status(403).json({message:"Invalid token"})
    }
}
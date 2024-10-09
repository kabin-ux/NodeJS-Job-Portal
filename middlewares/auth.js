import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET } from '../config.js';
import User from '../models/userModel.js';

export const verifyJWT = async (req, res, next) => {
    try {
        const token = await req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")
    
        if(!token){
            res.status(401).json({
                message: "No token provided!",
                StatusCode: 401,
                IsSuccess: false,
            })
        }
    
        const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
    
        if(!user){
            res.status(401).json({
                errorMessage: "Invalid Access token"
            })
        }
    
        req.user = user;
        next()
    } catch (error) {
        res.status(401).json({
            errorMEssage: "Invalid Access Token"
        })
    }
};


export const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)){
            return res.status(403).json({
                message: "Prohibited: You don't have the right permission"
            })
        }
        next();
    }
};
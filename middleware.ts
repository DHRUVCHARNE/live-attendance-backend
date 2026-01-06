import type { NextFunction,Request,Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import { AppError } from "./utils/AppError";

export const authMiddleware = (req:Request,res:Response,next:NextFunction) =>{
    const token= req.headers.authorization as string | undefined;
    if(!token){
        res.status(401).json({
            "success":false,
            "error":"Unauthorized, token missing or invalid"
        })
        return;
    }
    try{
       const {userId,role}=jwt.verify(token,process.env.JWT_PASSWORD!) as JwtPayload
       req.userId=userId;
       req.role=role;
       next()
    } catch(e){
        console.error(e)
        res.status(401).json({
            "success":false,
            "error":"Unauthorized, token missing or invalid"
        });
        return;
    }

}

export const teacherRoleMiddleware = (req:Request,res:Response,next:NextFunction)=>{
    if(!req.role || req.role != "teacher"){
        res.status(403).json({
            "success":false,
            "error":"Forbidden, teacher access required"
        });
        return;
    }
    next();
}

export function errorHandler(err:any,req:Request,res:Response,next:NextFunction) {
    console.error(err);

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
}


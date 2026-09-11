import { Router } from "express";
import { teacherLogin } from "../controllers/auth.controller";

const authRoute = Router()

authRoute.post("/teacher-login", teacherLogin)

export default authRoute
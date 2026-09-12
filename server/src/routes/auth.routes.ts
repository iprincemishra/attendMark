import { Router } from "express";
import { studentLogin, teacherLogin } from "../controllers/auth.controller";

const authRoute = Router()

authRoute.post("/teacher-login", teacherLogin)
authRoute.post("/student-login", studentLogin)

export default authRoute
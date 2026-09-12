import { Router } from "express";
import multer from "multer";
import { addSingleStudent, uploadStudentsCsv } from "../controllers/student.controller";
import { verifyTeacher } from "../middleware/auth.middleware";

const studentRoute = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only .csv format allowed!'));
        }
    }
});

studentRoute.post("/add", verifyTeacher, addSingleStudent);

studentRoute.post("/upload-csv", verifyTeacher, upload.single('file'), uploadStudentsCsv);

export default studentRoute;
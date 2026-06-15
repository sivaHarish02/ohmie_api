import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'jobs');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const jobId = req.params.id || 'unknown';
        const type = file.fieldname; // 'beforeImage' or 'afterImage'
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `job_${jobId}_${type}_${timestamp}${ext}`);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpg, .jpeg, .png files are allowed'));
    }
};

export const uploadJobImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// --- Profile image upload ---

const profileUploadDir = path.join(__dirname, '..', '..', 'uploads', 'profile');

if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, profileUploadDir);
    },
    filename: (req: any, file, cb) => {
        const techId = req.user?.id || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `tech_${techId}_${timestamp}${ext}`);
    },
});

export const uploadProfileImage = multer({
    storage: profileStorage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

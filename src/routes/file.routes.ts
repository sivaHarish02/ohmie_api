import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { log } from 'console';

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'jobs');

router.get('/job/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;

    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(uploadsDir, filename);
    log("Requested file path:", filePath);

    // Verify the resolved path is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
});
// add setting directory
router.get('/settings/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;

    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', 'settings', filename);
    log("Requested settings file path:", filePath);

    // Verify the resolved path is within uploads directory
    if (!filePath.startsWith(path.join(__dirname, '..', '..', 'uploads'))) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
});

// Profile images
router.get('/profile/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const profileDir = path.join(__dirname, '..', '..', 'uploads', 'profile');
    const filePath = path.join(profileDir, filename);

    if (!filePath.startsWith(profileDir)) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
});

export default router;

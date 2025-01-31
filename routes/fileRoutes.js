const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Upload files
router.post('/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    res.status(200).json({ message: 'Files uploaded successfully' });
});

// Fetch all uploaded files
router.get('/files', (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching files' });
        }
        const fileUrls = files.map(file => `/uploads/${file}`);
        res.json(fileUrls);
    });
});

// Delete file
router.delete('/delete', (req, res) => {
    try {
        if (!req.query.file) {
            return res.status(400).json({ error: "File path is required" });
        }

        // Extract filename only
        const fileName = path.basename(req.query.file);
        const filePath = path.join(UPLOADS_DIR, fileName);

        console.log("Deleting file:", filePath);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
                return res.status(500).json({ error: "Failed to delete file" });
            }
            res.json({ message: "File deleted successfully" });
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const Visitor = require('./src/db');
require('./src/db');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}


// Configure multer storage settings
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Serve uploaded files from the 'uploads' folder
app.use('/uploads', express.static(UPLOADS_DIR));

let sharedText = ""; // Store shared text

io.on('connection', async (socket) => {
    
    // Send the latest text to the new connection
    socket.emit('text-update', sharedText);

    socket.on('text-update', (text) => {
        sharedText = text;
        socket.broadcast.emit('text-update', text);
        console.log(`Text updated: ${text}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected`);
    });
});
// Home route: serve the index page
app.get('/', async (req, res) => {
    try {
        // Fetch the visitor record (first-time visitor check)
        let visitors = await Visitor.findOne({ name: 'localhost' });

        // If no records exist (first-time visitor)
        if (!visitors) {
            // Create a new visitor record with count 1
            const beginCount = new Visitor({
                name: 'localhost',
                count: 1
            });

            console.log('New visitor record created:', beginCount);

            // Save the new visitor record to the database
            await beginCount.save();

            // Assign the saved record to visitors
            visitors = beginCount;
        } else {
            // Increment the count of the visitor
            visitors.count += 1;

            // Save the updated count to the database
            await visitors.save();
        }

        // Send the updated visitor count to the client (pass it properly)
        res.render('index', { visitorCount: visitors.count });  // Ensure this matches the variable used in the view

    } catch (error) {
        // Log the error and send a 500 response in case of an issue
        console.error('Error processing visitor count:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Upload route: handle file uploads
app.post('/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    res.status(200).json({ message: 'Files uploaded successfully' });
});

// Files route: fetch all uploaded files
app.get('/files', (req, res) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching files' });
        }
        const fileUrls = files.map(file => `/uploads/${file}`);
        res.json(fileUrls);
    });
});

// Delete route: handle file deletion
app.delete("/delete", (req, res) => {
    try {
        const filePath = path.join(__dirname, req.query.file);
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



// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
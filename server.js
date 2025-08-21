const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());

// This is the correct way to connect
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// --- MongoDB Schema ---
const SubmissionSchema = new mongoose.Schema({
    tournament: { type: String, required: true },
    partner: { type: String, required: true },
    finalFiles: [{
        fieldName: String,
        originalName: String,
        path: String,
        uploadDate: { type: Date, default: Date.now }
    }],
    workingFiles: [{
        fieldName: String,
        originalName: String,
        path: String,
        uploadDate: { type: Date, default: Date.now }
    }],
    submissionDate: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', SubmissionSchema);

// --- Multer File Upload Setup ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Route for Submissions ---
app.post('/submit-assets', upload.any(), async (req, res) => {
    try {
        const { tournament, partner } = req.body;
        
        const finalFiles = req.files.filter(file => file.fieldname.includes('final-asset-'));
        const workingFiles = req.files.filter(file => file.fieldname.includes('working-file-'));

        const finalFileObjects = finalFiles.map(file => ({
            fieldName: file.fieldname,
            originalName: file.originalname,
            path: file.path
        }));

        const workingFileObjects = workingFiles.map(file => ({
            fieldName: file.fieldname,
            originalName: file.originalname,
            path: file.path
        }));

        const newSubmission = new Submission({
            tournament: tournament,
            partner: partner,
            finalFiles: finalFileObjects,
            workingFiles: workingFileObjects
        });

        await newSubmission.save();
        
        res.status(200).json({ message: 'Assets and data submitted successfully!' });

    } catch (error) {
        console.error('Submission failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
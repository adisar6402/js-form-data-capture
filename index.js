const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import the cors package
require('dotenv').config(); // Load environment variables
const { MongoClient, ServerApiVersion } = require('mongodb');

// Confirm Environment Variables Load Correctly
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const uri = process.env.MONGODB_URI; // Load from .env file
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();

// Use CORS to allow requests from specific origins (or all origins for testing purposes)
app.use(cors({
  origin: 'https://js-form-data-capture.vercel.app', // Allow only your frontend domain (change if necessary)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middlewares
app.use(express.json());  // to parse JSON bodies
app.use(express.static('public'));  // Serve static files like CSS and images from the 'public' folder

// Connect to MongoDB
let db;
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("emailstoragecluster"); // Use your actual database name
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if unable to connect to the database
  }
}

// Serve the index.html file when the root URL is accessed
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/send-email', async (req, res) => {
  const { name, email, contact, phone } = req.body;

  if (!db) {
    console.error("Database not connected");
    return res.status(500).send("Database connection failed");
  }

  const submission = { name, email, contact, phone, date: new Date() };
  try {
    const collection = db.collection('submissions');
    await collection.insertOne(submission);
    console.log('Form submission saved to MongoDB:', submission);
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return res.status(500).send('Error saving form submission');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'New Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nContact Method: ${contact}${contact === 'phone' ? `\nPhone: ${phone}` : ''}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending email:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Form submission successful');
  });
});

// Export the app for Vercel serverless functions
connectToDatabase(); // Connect to the database when the module is loaded
module.exports = app;

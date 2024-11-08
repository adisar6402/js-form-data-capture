const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import CORS package
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

// Use CORS to allow requests from specific origins (only your frontend URL)
app.use(cors({
  origin: ['https://js-form-data-capture.vercel.app'], // Allow only this frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware for parsing JSON requests
app.use(express.json());

// Connect to MongoDB
let db;
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("emailstoragecluster"); // Your database name
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if unable to connect
  }
}

// Route to handle form submission
app.post('/send-email', async (req, res) => {
  const { name, email, contact, phone } = req.body;

  // Check if the database is connected
  if (!db) {
    console.error("Database not connected");
    return res.status(500).send("Database connection failed");
  }

  // Log the submission for debugging
  const submission = { name, email, contact, phone, date: new Date() };
  try {
    const collection = db.collection('submissions');
    await collection.insertOne(submission);
    console.log('Form submission saved to MongoDB:', submission);
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return res.status(500).send('Error saving form submission');
  }

  // Set up Nodemailer for email sending
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Set the email details
  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'New Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nContact Method: ${contact}${contact === 'phone' ? `\nPhone: ${phone}` : ''}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Form submission successful');
  });
});

// Start the server
connectToDatabase(); // Connect to the database before starting the server
module.exports = app;
 
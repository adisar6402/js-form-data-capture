const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();

// Updated CORS configuration to allow requests from your frontend domain
app.use(cors({
  origin: 'https://js-form-data-capture.vercel.app', // Replace with your actual frontend URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials if needed
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
let db;
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("emailstoragecluster");
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

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

connectToDatabase();
module.exports = app;

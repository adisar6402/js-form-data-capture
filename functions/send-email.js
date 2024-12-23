const querystring = require('querystring');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const validator = require('validator');

// MongoDB connection URL and database name
const mongoUri = process.env.MONGODB_URI;
const dbName = 'emailstoragecluster';

// Use a cached MongoDB client
let cachedClient = null;

async function getMongoClient() {
    if (!cachedClient) {
        cachedClient = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await cachedClient.connect();
    }
    return cachedClient;
}

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Lambda function handler
exports.handler = async (event) => {
    // Set CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Allow from all origins; adjust if needed
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight OPTIONS requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    // Allow only POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let data;
    try {
        // Parse the incoming request body
        data = JSON.parse(event.body);

        // Validate required fields
        if (
            validator.isEmpty(data.name) ||
            validator.isEmpty(data.email) ||
            validator.isEmpty(data.message) ||
            !validator.isEmail(data.email)
        ) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Invalid form data', receivedData: data }),
            };
        }
    } catch (error) {
        console.error('Error parsing request body:', error.message);
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Invalid data format' }),
        };
    }

    // Email options
    const mailOptions = {
        to: process.env.GMAIL_USER, // Your email address
        from: process.env.GMAIL_USER, // Sender's email
        subject: `New Form Submission from ${data.name}`,
        text: `You have a new form submission:\n\n${JSON.stringify(data, null, 2)}`,
    };

    try {
        // Send email via nodemailer
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Failed to send email' }),
        };
    }

    // Save form data to MongoDB
    try {
        const client = await getMongoClient();
        const db = client.db(dbName);
        const collection = db.collection('formSubmissions');
        await collection.insertOne(data);

        console.log('Form data saved to MongoDB successfully');
    } catch (error) {
        console.error('Error saving data to MongoDB:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Failed to save form data' }),
        };
    }

    // Success response
    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Form submitted successfully' }),
    };
};

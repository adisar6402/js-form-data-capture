const querystring = require('querystring');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const validator = require('validator');

// MongoDB connection URL and database name
const mongoUri = process.env.MONGODB_URI;
const dbName = 'emailstoragecluster';

// Use a global MongoDB client instance
let cachedClient = null;

async function getMongoClient() {
    if (!cachedClient) {
        cachedClient = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await cachedClient.connect();
    }
    return cachedClient;
}

// Create a reusable transporter object using Gmail's SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

exports.handler = async (event) => {
    // Add CORS headers to all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Adjust the origin if necessary
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'x-content-type-options': 'nosniff',
    };

    // Handle preflight OPTIONS request
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
        // Handle JSON format
        if (event.headers['content-type'] === 'application/json') {
            console.log('Parsing JSON body');
            data = JSON.parse(event.body);
        } else {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Invalid Content-Type' }),
            };
        }

        // Validate form data
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
        console.error('Parsing error:', error.message);
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Invalid data format' }),
        };
    }

    // Email options
    const mailOptions = {
        to: process.env.GMAIL_USER, // Recipient (your email address)
        from: process.env.GMAIL_USER, // Sender (your email address)
        subject: `New Form Submission by ${data.name}`,
        text: `You have a new form submission:\n\n${JSON.stringify(data, null, 2)}`,
    };

    try {
        // Send email via Gmail
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error sending email' }),
        };
    }

    // Store form data in MongoDB
    try {
        const client = await getMongoClient(); // Use global client
        const db = client.db(dbName);
        const collection = db.collection('formSubmissions');

        await collection.insertOne(data);
        console.log('Data stored in MongoDB successfully');
    } catch (error) {
        console.error('Error storing data in MongoDB:', error.message);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error storing data in MongoDB' }),
        };
    }

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Form submitted and stored successfully' }),
    };
};

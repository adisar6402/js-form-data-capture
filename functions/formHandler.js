const querystring = require('querystring');
const sgMail = require('@sendgrid/mail');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const validator = require('validator');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

exports.handler = async (event) => {
    // Add CORS headers to all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Adjust the origin if necessary
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'x-content-type-options': 'nosniff',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let data;
    try {
        data = querystring.parse(event.body);

        // Validate form data
        if (!data.name || !data.email || !data.message || !validator.isEmail(data.email)) {
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
        to: process.env.TO_EMAIL || 'adisar6402@gmail.com',
        from: process.env.FROM_EMAIL,
        subject: `New Form Submission by ${data.name}`,
        text: `You have a new form submission:\n\n${JSON.stringify(data, null, 2)}`,
    };

    try {
        // Send email via SendGrid
        await sgMail.send(mailOptions);
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

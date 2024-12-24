const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const validator = require('validator');

const mongoUri = process.env.MONGODB_URI;
const dbName = 'emailstoragecluster';

let cachedClient = null;

async function getMongoClient() {
    if (!cachedClient) {
        cachedClient = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await cachedClient.connect();
    }
    return cachedClient;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

exports.handler = async (event) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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

    console.log('Raw event.body:', event.body); // Log raw body

    let data;
    try {
        data = JSON.parse(event.body);
        console.log('Parsed data:', data); // Log parsed data

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

        if (data.contact === 'phone' && validator.isEmpty(data.phone)) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Phone number required for phone contact method', receivedData: data }),
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

    const mailOptions = {
        to: process.env.GMAIL_USER,
        from: process.env.GMAIL_USER,
        subject: `New Form Submission from ${data.name}`,
        text: `You have a new form submission:\n\n${JSON.stringify(data, null, 2)}`,
    };

    try {
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

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Form submitted successfully' }),
    };
};

const sgMail = require('@sendgrid/mail');
const { MongoClient } = require('mongodb');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

exports.handler = async (event) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
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
        data = JSON.parse(event.body);
        if (!data.name || !data.email || !data.message) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Invalid form data' }),
            };
        }
    } catch (error) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error parsing data' }),
        };
    }

    const mailOptions = {
        to: process.env.TO_EMAIL || 'recipient@example.com',
        from: process.env.FROM_EMAIL,
        subject: `New Form Submission by ${data.name}`,
        text: `You have a new form submission:\n\n${JSON.stringify(data, null, 2)}`,
    };

    try {
        await sgMail.send(mailOptions);
    } catch (error) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error sending email' }),
        };
    }

    try {
        const client = await getMongoClient();
        const db = client.db(dbName);
        const collection = db.collection('formSubmissions');
        await collection.insertOne(data);
    } catch (error) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Error storing data in MongoDB' }),
        };
    }

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Form submitted successfully' }),
    };
};

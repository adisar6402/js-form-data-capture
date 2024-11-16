const querystring = require('querystring');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables from .env file

// MongoDB connection URL and database name
const mongoUri = process.env.MONGODB_URI;
const dbName = 'emailstoragecluster'; // Replace this with your actual database name if it's different

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use any email service
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password
    },
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'x-content-type-options': 'nosniff',
            },
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    console.log('Received event headers:', event.headers);
    console.log('Received event body:', event.body);

    let data;
    try {
        data = querystring.parse(event.body);
    } catch (error) {
        console.error('Parsing error:', error);
        console.error('Received event body:', event.body);
        return {
            statusCode: 400,
            headers: {
                'x-content-type-options': 'nosniff',
            },
            body: JSON.stringify({ message: 'Invalid data format', receivedBody: event.body }),
        };
    }

    console.log('Parsed form data:', data);

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: 'adisar6402@gmail.com', // List of recipients (replace with your desired recipient email)
        subject: 'New Form Submission',
        text: `You have a new form submission:\n\n${JSON.stringify(data, null, 2)}`,
    };

    try {
        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            headers: {
                'x-content-type-options': 'nosniff',
            },
            body: JSON.stringify({ message: 'Error sending email' }),
        };
    }

    // Connect to MongoDB and store the data
    try {
        const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('formSubmissions');
        await collection.insertOne(data);
        await client.close();
        console.log('Data stored in MongoDB successfully');
    } catch (error) {
        console.error('Error storing data in MongoDB:', error);
        return {
            statusCode: 500,
            headers: {
                'x-content-type-options': 'nosniff',
            },
            body: JSON.stringify({ message: 'Error storing data in MongoDB' }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'x-content-type-options': 'nosniff',
        },
        body: JSON.stringify({ message: 'Form submitted successfully' }),
    };
};

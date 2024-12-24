const querystring = require('querystring');
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

    let data;
    try {
        data = JSON.parse(event.body);

        if (
            validator.isEmpty(data.name) ||
            validator.isEmpty(data.email) ||
            validator.isEmpty(data.message) ||
            !validator.isEmail(data.email)
        ) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Invalid form data', received
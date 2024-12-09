const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendTestEmail() {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to yourself for testing
            subject: 'Test Email',
            text: 'This is a test email to confirm nodemailer setup is working.',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendTestEmail();

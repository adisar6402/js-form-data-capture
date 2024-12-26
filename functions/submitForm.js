const nodemailer = require('nodemailer');
require('dotenv').config();

exports.handler = async (event, context) => {
    try {
        // Parse the form data sent in the POST request body
        const { name, email, message, contact } = JSON.parse(event.body); // You might want to include 'message' or 'contact' based on your form fields

        // Setup Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',  // You can change this if you're using another email service
            auth: {
                user: process.env.GMAIL_USER,  // Your email
                pass: process.env.GMAIL_APP_PASSWORD, // Your App password or regular password (use app password for better security)
            },
        });

        // Prepare email options (the content of the email)
        const mailOptions = {
            from: process.env.GMAIL_USER,  // From your email
            to: process.env.GMAIL_USER,    // To your email address
            subject: 'New Form Submission', // Email subject
            text: `New form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}\nPreferred Contact Method: ${contact}`, // Including additional fields like 'message' if needed
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);

        // Return a success response if email is sent
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Form submitted and email sent successfully!',
                emailResponse: info.response, // Include response from Nodemailer if required
            }),
        };
    } catch (error) {
        console.error('Error processing form submission:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error submitting the form.',
                error: error.message,
            }),
        };
    }
};


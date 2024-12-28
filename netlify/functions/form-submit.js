require('dotenv').config();  // Ensure environment variables are loaded

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// The function handler for the form submission
const handler = async (event, context) => {
  // Set up MongoDB connection
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Define the schema and model for form submissions
  const formSchema = new mongoose.Schema({
      name: String,
      email: String,
      contact: String,
      message: String,
      date: { type: Date, default: Date.now },
  });

  const FormSubmission = mongoose.model('FormSubmission', formSchema);

  try {
    // Only handle POST requests for form submission
    if (event.httpMethod === 'POST') {
      const { name, email, message, contact } = JSON.parse(event.body); // Parse the form data

      // Save form data to MongoDB
      const newSubmission = new FormSubmission({ name, email, message, contact });
      const savedSubmission = await newSubmission.save();

      // Set up Nodemailer for email notification
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // Email details for the submitted form
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: 'New Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}\nPreferred Contact: ${contact}`,
      };

      // Send the email notification
      const emailResponse = await transporter.sendMail(mailOptions);

      // Return response in JSON
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Form submitted successfully!',
          emailResponse: emailResponse.response,
          savedSubmission,
        }),
      };
    }

    // Handle unsupported methods
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Only POST method is supported.' }),
    };
  } catch (error) {
    console.error('Error processing form submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error submitting form', error: error.message }),
    };
  }
};

// Export the handler for Netlify functions
exports.handler = handler;

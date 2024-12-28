const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const formSubmitHandler = async (event) => {
  try {
    // Allowing CORS
    event.setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    if (event.httpMethod === "OPTIONS") {
      // Preflight requests can return successfully
      return { statusCode: 200, body: "" };
    }

    if (event.httpMethod === "POST") {
      const { name, email, contact, phone, message } = JSON.parse(event.body);

      if (!name || !email || !contact || !message) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Required fields are missing" }),
        };
      }

      // Create email transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,       // Gmail email
          pass: process.env.GMAIL_APP_PASSWORD, // Gmail app password
        },
      });

      // Email content
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER, // Send email to self for notification
        subject: "New Form Submission",
        text: `
          Name: ${name}\n
          Email: ${email}\n
          Preferred Contact: ${contact}\n
          Phone: ${phone || "N/A"}\n
          Message: ${message}
        `,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      // MongoDB connection
      const { MongoClient } = require("mongodb");
      const uri = process.env.MONGODB_URI;

      const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      // Connect to MongoDB
      await client.connect();

      // Insert form data into MongoDB collection
      const database = client.db();
      const collection = database.collection("form-submissions");

      const submission = {
        name,
        email,
        contact,
        phone: phone || "N/A",
        message,
        submittedAt: new Date(),
      };

      await collection.insertOne(submission);

      // Close database connection
      await client.close();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Form submitted successfully!" }),
      };
    }

    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Form submission failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

exports.handler = formSubmitHandler;

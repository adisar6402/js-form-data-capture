const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");

const formSubmitHandler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    // Handle OPTIONS preflight request
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      };
    }

    // Handle POST request
    if (event.httpMethod === "POST") {
      console.log("POST request received.");

      // Parse request body
      const { name, email, contact, phone, message } = JSON.parse(event.body);

      // Validate required fields
      if (!name || !email || !contact || !message) {
        console.error("Missing required fields.");
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Required fields are missing" }),
        };
      }

      // Test email configuration
      console.log("Setting up Nodemailer...");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: "New Form Submission",
        text: `Name: ${name}\nEmail: ${email}\nContact: ${contact}\nPhone: ${
          phone || "N/A"
        }\nMessage: ${message}`,
      };

      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully.");

      // Test MongoDB configuration
      console.log("Connecting to MongoDB...");
      const uri = process.env.MONGODB_URI;
      const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

      await client.connect();
      console.log("Connected to MongoDB.");

      const database = client.db("EmailStorageCluster"); // Replace with your database name
      const collection = database.collection("form-submissions");

      await collection.insertOne({
        name,
        email,
        contact,
        phone: phone || "N/A",
        message,
        submittedAt: new Date(),
      });

      await client.close();
      console.log("Form data stored successfully.");

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Form submitted successfully!" }),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Form submission failed:", error.message, error.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message, // Include detailed error message
      }),
    };
  }
};

exports.handler = formSubmitHandler;

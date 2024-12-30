const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");

const formSubmitHandler = async (event) => {
  try {
    event.setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, body: "" };
    }

    if (event.httpMethod === "POST") {
      console.log("POST request received.");

      const { name, email, contact, phone, message } = JSON.parse(event.body);
      if (!name || !email || !contact || !message) {
        console.error("Missing required fields.");
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Required fields are missing" }),
        };
      }

      // Email Setup
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

      // MongoDB Setup
      const uri = process.env.MONGODB_URI;
      const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

      await client.connect();
      console.log("Connected to MongoDB.");

      // Use the correct database name
      const database = client.db("EmailStorageCluster");
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

      return { statusCode: 200, body: JSON.stringify({ message: "Form submitted successfully!" }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (error) {
    console.error("Form submission failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
  }
};

exports.handler = formSubmitHandler;

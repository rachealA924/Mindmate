// api/contact/send.js
// POST /api/contact/send  — saves message to Firestore and sends email notification

import { db } from "../../lib/firebase-admin.js";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "name, email, and message are all required." });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // 1. Save to Firestore
    await db.collection("contact_messages").add({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      receivedAt: new Date().toISOString(),
      read: false,
    });

    // 2. Send email notification to MindMate team
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password (not your regular password)
      },
    });

    await transporter.sendMail({
      from: `"MindMate Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr/>
        <small>Sent via MindMate contact form</small>
      `,
      // Also send a confirmation to the user
      replyTo: email,
    });

    // 3. Send auto-reply to the user
    await transporter.sendMail({
      from: `"MindMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "We received your message — MindMate",
      html: `
        <h2>Hi ${name},</h2>
        <p>Thank you for reaching out to MindMate. We've received your message and will get back to you within 24–48 hours.</p>
        <p>In the meantime, feel free to explore our <a href="https://mindmate.vercel.app/resources.html">resources</a> or take a <a href="https://mindmate.vercel.app/self-check.html">self-check</a>.</p>
        <br/>
        <p>With care,<br/>The MindMate Team</p>
      `,
    });

    return res.status(200).json({ success: true, message: "Your message has been sent!" });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Failed to send message. Please try again." });
  }
}
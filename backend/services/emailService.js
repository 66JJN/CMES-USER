import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sends an email using Google Apps Script HTTP Web App proxy.
 * Completely bypasses SMTP port blocking on hosts like Render and DMARC alignment restrictions.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 */
export async function sendEmail({ to, subject, html }) {
  const GMAIL_SCRIPT_URL = process.env.GMAIL_SCRIPT_URL;
  // Use JWT_SECRET in .env for authentication (matches the script)
  const SECRET_KEY =
    process.env.JWT_SECRET ||
    "336d4fc2c44e87dfacc204a32a3f1e47479fed76699a0d8b195dfdb3231529df286d6ef4a28bc029ce2a148e171f7bc8f9483b3729f7c51c3a2da4541f4f6c33";

  if (!GMAIL_SCRIPT_URL) {
    throw new Error("Missing GMAIL_SCRIPT_URL in environment variables");
  }

  console.log(`[AppsScript] Sending email to ${to} via Google script proxy...`);

  const response = await fetch(GMAIL_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: SECRET_KEY,
      to: to,
      subject: subject,
      html: html,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    console.error("[AppsScript Error] Google Script returned error response:", data);
    throw new Error(data.error || "Google Script failed to send email");
  }

  console.log(`[AppsScript Success] Email sent successfully to ${to}`);
  return data;
}

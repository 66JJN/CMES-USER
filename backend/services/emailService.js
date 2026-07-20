import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "pyaksda@gmail.com";

/**
 * Sends an email using the Brevo HTTP API.
 * Bypasses all SMTP blocks on host platforms like Render.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 */
export async function sendEmail({ to, subject, html }) {
  if (!BREVO_API_KEY) {
    throw new Error("Missing BREVO_API_KEY in environment variables");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "CMES Support",
        email: EMAIL_FROM,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Brevo Error] API returned error response:", data);
    throw new Error(data.message || `Brevo API returned status ${response.status}`);
  }

  console.log(`[Brevo Success] Email sent successfully to ${to}. Message ID: ${data.messageId}`);
  return data;
}

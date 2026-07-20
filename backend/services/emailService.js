import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Fallback to onboarding@resend.dev or custom sender
const EMAIL_FROM = process.env.EMAIL_FROM || "CMES <onboarding@resend.dev>";

/**
 * Sends an email using the Resend HTTP API.
 * Bypasses all SMTP blocks on host platforms like Render.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 */
export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY in environment variables");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Resend Error] API returned error response:", data);
    throw new Error(data.message || `Resend API returned status ${response.status}`);
  }

  console.log(`[Resend Success] Email sent successfully to ${to}. Email ID: ${data.id}`);
  return data;
}

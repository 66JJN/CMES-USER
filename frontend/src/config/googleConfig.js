// Google OAuth Configuration
// Update this file with your actual Google Client ID

export const GOOGLE_CONFIG = {
  // Get your Client ID from: https://console.cloud.google.com/
  // Select your project > APIs & Services > Credentials > OAuth 2.0 Client IDs
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "588733956605-6d07pgmirpkobtnjj28d68im5qk4u851.apps.googleusercontent.com",
  
  // These should match your Google Cloud Console settings
  redirectUris: [
    // ===== LOCAL DEVELOPMENT =====
    "http://localhost:3000",              // Admin Frontend
    "http://localhost:3001",              // User Frontend
    "http://localhost:3001/auth/callback",
    
    // ===== PRODUCTION =====
    "https://cmesadminfrontend.vercel.app/",
    "https://cmesuserfrontend.vercel.app/",
    "https://cmes-user.onrender.com",
  ],
};

export const getGoogleClientId = () => {
  const clientId = GOOGLE_CONFIG.clientId;
  
  if (!clientId || clientId.includes("YOUR_GOOGLE")) {
    console.warn(
      "⚠️  Google Client ID is not configured. " +
      "Follow GOOGLE_OAUTH_SETUP.md to set it up."
    );
    return null;
  }
  
  return clientId;
};

export const isGoogleConfigured = () => {
  return !!getGoogleClientId();
};

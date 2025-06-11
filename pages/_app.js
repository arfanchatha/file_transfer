import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';

// Get Google Client ID from environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Show warning if client ID is not configured
if (!CLIENT_ID || CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
  console.warn(
    '%cGoogle OAuth Configuration Missing', 
    'font-size: 16px; color: red; font-weight: bold;'
  );
  console.warn(
    'Please set up your Google OAuth credentials in .env.local file:\n' +
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id\n' +
    'NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key\n\n' +
    'See README.md for detailed instructions.'
  );
}

export default function App({ Component, pageProps }) {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
} 
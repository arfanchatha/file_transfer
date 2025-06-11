# Loom to Google Drive Transfer (Next.js)

A Next.js application that allows you to transfer Loom videos directly to your Google Drive without downloading them locally.

## Features

- 🎥 Direct Loom video streaming to Google Drive
- 🔐 Google OAuth authentication
- 📁 Google Drive folder selection
- 🚀 No local storage required - streams directly
- 💻 Modern React UI with Bootstrap
- ⚡ Built with Next.js for full-stack capabilities

## Prerequisites

1. Google Cloud Project with Drive API enabled
2. OAuth 2.0 credentials configured
3. Node.js 18+ installed

## Setup Instructions

### 1. Google Cloud Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Go to "APIs & Services" > "Credentials"
5. Create OAuth 2.0 Client ID (Web application)
6. Add authorized origins:
   - `http://localhost:3000` (for development)
   - Your production domain (if deploying)

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key-here
```

### 3. Installation and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Visit `http://localhost:3000` to use the application.

## Usage

1. Click "Login with Google" to authenticate
2. Paste a Loom share URL
3. Optionally customize the filename
4. Select a Google Drive folder (or use root)
5. Click "Transfer to Google Drive"

## Environment Variables

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `NEXT_PUBLIC_GOOGLE_API_KEY`: Your Google API Key

## Technology Stack

- **Frontend**: Next.js, React, Bootstrap, React Bootstrap
- **Backend**: Next.js API Routes
- **Authentication**: Google OAuth 2.0
- **APIs**: Google Drive API, Loom API
- **Streaming**: Direct HTTP streaming (no local storage)

## Migration from Separate React + Express

This project has been converted from a separate React frontend and Express backend to a unified Next.js application:

- React components moved to `pages/` and converted to Next.js pages
- Express routes converted to Next.js API routes in `pages/api/`
- Shared utilities moved to `lib/` directory
- Environment variables updated for Next.js conventions

## Deployment

The application can be deployed to Vercel, Netlify, or any Node.js hosting platform:

```bash
# Build the application
npm run build

# Start production server
npm start
```

Make sure to configure environment variables on your hosting platform.

## Troubleshooting

### OAuth Issues

- Ensure your OAuth client is configured for the correct domain
- Add test users if your app is in testing mode
- Check that redirect URIs match your domain

### API Issues

- Verify Google Drive API is enabled
- Check that OAuth scopes include Drive access
- Ensure API keys are correctly configured

## License

MIT License - see LICENSE file for details.

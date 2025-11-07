<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hearth

Hearth is a smart home assistant that helps you manage your daily life. It provides a calendar, weather forecasts, recipes, games, and a voice assistant to help you with your daily tasks.

## Getting Started

**Prerequisites:** Node.js

### 1. Installation

First, install the project dependencies:

```bash
npm install
```

### 2. Environment Variables

Next, you'll need to set up your environment variables. Copy the `.env.example` file to a new file named `.env`:

```bash
cp .env.example .env
```

Now, you have two options:

#### Development (with Mock Data)

To run the application in development mode with mock data, simply set the following variable in your `.env` file:

```
VITE_USE_FAKE_DATA=true
```

This will allow you to run the application without needing to provide any real API keys.

#### Production (with Real Data)

To run the application with real data, you'll need to provide your Google Client ID and Gemini API Key.

1.  **Comment out or remove** the `VITE_USE_FAKE_DATA` variable in your `.env` file.
2.  **Provide your Google Client ID and Gemini API Key** in the `.env` file:

```
VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

You can obtain a Google Client ID from the [Google Cloud Console](https://console.cloud.google.com/) and a Gemini API Key from [Google AI Studio](https://makersuite.google.com/).

### 3. Run the App

Once you've configured your environment variables, you can run the application:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

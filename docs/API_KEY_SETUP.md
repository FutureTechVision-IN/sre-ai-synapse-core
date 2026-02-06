# Google Generative AI API Key Setup Guide

## Overview

This application uses the Google Generative AI API to power conversational AI features. To use the chat and voice interface, you must configure a valid API key.

## Current Status

**Status**: ❌ API key not configured  
**Error**: `VITE_GEMINI_API_KEY` environment variable is empty  
**Impact**: Chat and voice features will not work until API key is configured

## Step-by-Step Setup

### 1. Create a Google Cloud Project and Enable API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account (create one if needed)
3. Click **"Create API Key"** button
4. Select or create a Google Cloud project
5. The API key will be generated automatically

### 2. Copy Your API Key

- The generated key will appear on screen in the format: `AIza...` (35+ characters)
- Click the copy icon or select and copy the full key
- **Keep this key secure** - treat it like a password

### 3. Configure the Environment Variable

#### Option A: Using `.env.local` (Recommended for Development)

1. Open the `.env.local` file in the project root
2. Find the line: `VITE_GEMINI_API_KEY=`
3. Add your API key after the `=`:
   ```
   VITE_GEMINI_API_KEY=AIza1234567890abcdefghijklmnopqrst
   ```
4. Save the file
5. **Do NOT commit this file to version control** - it contains sensitive credentials

#### Option B: System Environment Variable

Set the environment variable before starting the application:

```bash
export VITE_GEMINI_API_KEY="AIza1234567890abcdefghijklmnopqrst"
npm run dev
```

#### Option C: Using `.env.production.local` (For Production)

Create `.env.production.local` file (Vite uses this automatically for production builds):

```
VITE_GEMINI_API_KEY=your_production_api_key_here
```

### 4. Restart the Application

After saving the `.env.local` file:

1. Stop the development server (Ctrl+C)
2. Restart it: `npm run dev`
3. **Note**: Environment variables require a server restart to take effect (not hot-reloaded)

### 5. Verify Configuration

Try using the chat feature:

1. Click "Initialize_Voice_Link" button
2. If successful, the voice interface will activate
3. If failed, an error message will display with setup instructions

## API Key Format and Validation

### Valid Format
- **Pattern**: `AIza` followed by 35 alphanumeric and special characters
- **Example**: `AIzaSyC_-Bz3KqcZ1...` (40 characters total)
- **Length**: Exactly 39 characters

### Validation Rules
Your API key will be rejected if:
- It's empty or blank
- It contains the placeholder text `PLACEHOLDER_API_KEY`
- It doesn't start with `AIza`
- It's not exactly 39 characters
- It contains invalid characters

### Checking Your Key

```bash
# In .env.local
VITE_GEMINI_API_KEY=AIza1234567890abcdefghijklmnopqrst
                    ↑ starts with AIza
                    ↓ total 39 characters
```

## Troubleshooting

### Error: "API key not configured"

**Symptom**: Error message says "Please set VITE_GEMINI_API_KEY in your .env.local file"

**Solution**:
1. Verify `.env.local` exists in project root
2. Check that the line contains: `VITE_GEMINI_API_KEY=your_key_here`
3. Ensure no extra spaces after the `=`
4. Save file and restart the dev server

### Error: "API key not valid"

**Symptom**: Error message says "Please pass a valid API key from https://aistudio.google.com/app/apikey"

**Solution**:
1. Verify the API key format matches `AIza...` pattern
2. Ensure the full key was copied (39 characters)
3. Check for accidental whitespace or line breaks
4. Generate a new key from [Google AI Studio](https://aistudio.google.com/app/apikey)
5. Replace old key with new one

### Error: "Failed to initialize API client"

**Symptom**: Error displays after key validation passes

**Possible Causes**:
1. API quota exceeded - check [Google Cloud Console](https://console.cloud.google.com)
2. API key permissions - ensure Generative AI API is enabled
3. Network connectivity issue - check internet connection
4. Rate limiting - wait a few minutes before retrying

### Chat Features Not Working

**Symptom**: Chat interface shows error after attempting to send message

**Troubleshooting**:
1. Verify API key is configured (check error message)
2. Test error handling by clicking "Initialize_Voice_Link"
3. Check browser console (F12) for detailed error messages
4. Verify API quotas haven't been exceeded
5. Try with a different browser or incognito mode

## Environment Variable Priority

The application checks for API keys in this order:

1. **User-provided API key** (highest priority)
   - Stored per-user if user has logged in
   - Used if user role is "USER" or "ADMIN"

2. **Admin pool API key** (medium priority)
   - Used if admin has configured shared key
   - Shared across all users with admin permission

3. **System environment variable** (lowest priority)
   - `VITE_GEMINI_API_KEY` from `.env.local`
   - `process.env.API_KEY` fallback (Node.js only)

## Security Best Practices

### Do's ✅
- Store API key in `.env.local` (git-ignored)
- Use `.env.production.local` for production (never commit)
- Rotate keys periodically
- Use different keys for development and production
- Monitor API usage in [Google Cloud Console](https://console.cloud.google.com)
- Keep key confidential

### Don'ts ❌
- Never commit API key to version control
- Never hardcode API key in source files
- Never share API key via email or chat
- Never use the same key across multiple environments
- Never post key in public repositories or forums
- Don't log full API key values (truncate in logs)

## Monitoring and Quotas

### Check Your Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to "Generative AI API" > "Quotas and System Limits"
4. View current usage and limits

### Rate Limits

- **Requests per minute (RPM)**: Varies by API tier
- **Tokens per minute (TPM)**: Depends on model and tier
- **Exceeding limits**: Returns HTTP 429 (Too Many Requests)

### Response When Quota Exceeded

The application will display:
```
Status: COOLDOWN (Xs)
```

And automatically retry after the cooldown period.

## File Structure

```
project-root/
├── .env.local                    # ← Add VITE_GEMINI_API_KEY here
├── .env.production.local         # ← For production key
├── .gitignore                    # ← Should exclude .env.local
├── services/
│   └── geminiService.ts          # ← API key validation logic
├── components/
│   └── ChatInterface.tsx         # ← Error display handling
└── API_KEY_SETUP.md             # ← This file
```

## Testing API Key Validation

The application includes built-in API key validation:

### Validation Flow

1. **Retrieve** - Get key from configured source
2. **Validate Format** - Check pattern matches `AIza[0-9A-Za-z_-]{35}`
3. **Reject Placeholders** - Reject `PLACEHOLDER_API_KEY`
4. **Create Client** - Initialize GoogleGenAI with valid key
5. **Error Handling** - Display user-friendly error if validation fails

### Test Cases

**Test 1: No API key configured**
- Expected: Error message directing to setup guide
- Key: (empty)
- Result: ❌ `API key not configured...`

**Test 2: Invalid API key format**
- Expected: Error message directing to Google AI Studio
- Key: `invalid-key-format`
- Result: ❌ `API key not valid...`

**Test 3: Placeholder API key**
- Expected: Error message with setup instructions
- Key: `PLACEHOLDER_API_KEY`
- Result: ❌ `API key not valid...`

**Test 4: Valid API key**
- Expected: Voice interface initializes successfully
- Key: `AIza1234567890abcdefghijklmnopqrst` (valid)
- Result: ✅ Voice link established

## Support and Resources

- **Google AI Studio**: https://aistudio.google.com/app/apikey
- **Google Cloud Console**: https://console.cloud.google.com
- **Generative AI API Docs**: https://cloud.google.com/docs/generative-ai
- **Troubleshooting Guide**: See "Troubleshooting" section above

## Version Information

- **Last Updated**: January 9, 2026
- **API Validation Version**: 2.0
- **Supported Google Generative AI SDK**: v1.29.0+
- **Environment**: Vite (browser-based)

---

**Need help?** Check the error message displayed in the diagnostic overlay - it will guide you to the next steps.

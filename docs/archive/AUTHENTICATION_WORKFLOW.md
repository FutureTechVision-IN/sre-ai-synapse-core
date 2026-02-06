# API Authentication and Key Management Workflow

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Status**: Complete and Tested

---

## Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [API Key Retrieval Hierarchy](#api-key-retrieval-hierarchy)
3. [Validation Workflow](#validation-workflow)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Security Protocols](#security-protocols)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Authentication Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│        (ChatInterface, DataVisualizer, etc.)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (geminiService.ts)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NeuralOrchestrator                                  │   │
│  │  - getClient()        [API client initialization]    │   │
│  │  - parseError()       [Error categorization]         │   │
│  │  - getStats()         [Performance metrics]          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SecurityManager                                     │   │
│  │  - getBestAvailableKey()  [Key selection]            │   │
│  │  - validateApiKey()       [Format validation]        │   │
│  │  - loginUser()            [Authentication]           │   │
│  │  - logAudit()             [Audit trail]              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Generative AI API                       │
│        (Remote authentication and processing)               │
└─────────────────────────────────────────────────────────────┘
```

---

## API Key Retrieval Hierarchy

### Priority Order

When the application needs an API key, it searches in this order:

```
┌─────────────────────────────────┐
│ 1. ACTIVE USER KEY (Priority 1) │  ← Highest
│    - User must be logged in     │
│    - User must have apiKey set  │
│    - Status must be 'ACTIVE'    │
└────────────┬────────────────────┘
             │ [Not found or inactive]
             ▼
┌─────────────────────────────────┐
│ 2. ADMIN POOL KEY (Priority 2)  │  ← Medium
│    - Admin must exist           │
│    - Admin must have apiKey     │
│    - Status must be 'ACTIVE'    │
└────────────┬────────────────────┘
             │ [Not found or inactive]
             ▼
┌─────────────────────────────────┐
│ 3. SYSTEM ENV VAR (Priority 3)  │  ← Lowest
│    - VITE_GEMINI_API_KEY        │
│    - process.env.API_KEY        │
│    - Can be empty               │
└─────────────────────────────────┘
```

### Key Retrieval Logic

```typescript
// Pseudo-code representation
function getBestAvailableKey() {
    // Try User Key
    if (activeUser && activeUser.apiKey && activeUser.keyStatus === 'ACTIVE') {
        return {
            key: activeUser.apiKey,
            source: 'USER_KEY (username)',
            userId: activeUser.id,
            isValid: validateApiKey(activeUser.apiKey)
        };
    }
    
    // Try Admin Pool Key
    const adminWithKey = findAdminWithActiveKey();
    if (adminWithKey) {
        return {
            key: adminWithKey.apiKey,
            source: 'POOL_KEY (admin_username)',
            userId: adminWithKey.id,
            isValid: validateApiKey(adminWithKey.apiKey)
        };
    }
    
    // Fall back to System Environment
    const systemKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
    return {
        key: systemKey,
        source: 'SYSTEM_ENV',
        userId: undefined,
        isValid: validateApiKey(systemKey)
    };
}
```

---

## Validation Workflow

### Complete Validation Pipeline

```
API Request Initiated
    │
    ├─ Step 1: Retrieve Key
    │   └─ Call getBestAvailableKey()
    │      └─ Returns { key, source, userId, isValid }
    │
    ├─ Step 2: Check Validity
    │   ├─ Is key empty?
    │   │   ├─ YES → Error: "API key not configured"
    │   │   └─ NO → Continue
    │   │
    │   └─ Is key valid format?
    │       ├─ Pattern: AIza[0-9A-Za-z_-]{35}
    │       ├─ Not placeholder: PLACEHOLDER_API_KEY
    │       ├─ Has content: length > 0
    │       ├─ YES → Continue to Step 3
    │       └─ NO → Error: "API key not valid"
    │
    ├─ Step 3: Create Client
    │   ├─ new GoogleGenAI({ apiKey: key })
    │   ├─ Success → Return client
    │   └─ Failure → Error: "Failed to initialize API client"
    │
    ├─ Step 4: Log Event
    │   └─ auditLog.push({
    │       action: 'NEURAL_LINK_ESTABLISHED',
    │       source: source,
    │       timestamp: now()
    │   })
    │
    └─ Step 5: Execute Request
        └─ Use client to communicate with API
```

### Validation Function

```typescript
private validateApiKey(key: string): boolean {
    // Step 1: Check pattern
    const googleApiKeyPattern = /^AIza[0-9A-Za-z_-]{35}$/;
    if (!googleApiKeyPattern.test(key)) {
        return false;
    }
    
    // Step 2: Reject placeholder
    if (key === 'PLACEHOLDER_API_KEY') {
        return false;
    }
    
    // Step 3: Reject empty
    if (key.length === 0) {
        return false;
    }
    
    // All checks passed
    return true;
}
```

### Validation Regex Breakdown

```
Pattern: /^AIza[0-9A-Za-z_-]{35}$/

^        = Start of string (anchor)
AIza     = Required prefix (literal)
[0-9]    = Digits 0-9
[A-Z]    = Uppercase letters
[a-z]    = Lowercase letters
[_-]     = Underscore or hyphen
{35}     = Exactly 35 of the above characters
$        = End of string (anchor)
```

**Examples**:
```
✅ AIzaSyDJbqfGdz1XoJTHZFUl7ZKd8eFZ9vQ4QrX
   AIza + 35 alphanumeric/underscore/hyphen = 39 chars total

❌ AIzaShort
   AIza + 9 chars = 13 chars total (too short)

❌ GCPzaSyDJbqfGdz1XoJTHZFUl7ZKd8eFZ9vQ4QrX
   Wrong prefix (GCPza, not AIza)

❌ AIza@invalid!chars#here
   Invalid characters (@, !, #)
```

---

## Error Handling

### Error Types and Responses

#### Error Type 1: Missing API Key

**Trigger**: 
```
VITE_GEMINI_API_KEY=  (empty)
```

**Detection**:
```typescript
if (key === '' && !isValid) {
    // Missing key detected
}
```

**Error Message**:
```
"API key not configured. Please set VITE_GEMINI_API_KEY in your 
.env.local file. Get your key from: https://aistudio.google.com/app/apikey"
```

**User Action**:
1. Visit https://aistudio.google.com/app/apikey
2. Create API key
3. Add to `.env.local`: `VITE_GEMINI_API_KEY=AIza...`
4. Restart server

---

#### Error Type 2: Invalid Key Format

**Trigger**:
```
VITE_GEMINI_API_KEY=invalid-key-format
```

**Detection**:
```typescript
if (key !== '' && !validateApiKey(key)) {
    // Invalid format detected
}
```

**Error Message**:
```
"API key not valid. Please pass a valid API key from 
https://aistudio.google.com/app/apikey"
```

**Validation Checks Failed**:
- ❌ Doesn't start with `AIza`
- ❌ Doesn't have exactly 39 characters
- ❌ Contains invalid characters
- ❌ Matches placeholder value

**User Action**:
1. Verify key format (should be `AIza...` with 39 chars)
2. Copy key again from Google AI Studio
3. Replace value in `.env.local`
4. Restart server

---

#### Error Type 3: Client Initialization Failed

**Trigger**:
```
Key valid format but GoogleGenAI initialization fails
```

**Detection**:
```typescript
try {
    new GoogleGenAI({ apiKey: key })
} catch (error) {
    // Initialization failed
}
```

**Error Message**:
```
"Failed to initialize API client: [specific Google error]"
```

**Possible Causes**:
- API quota exceeded
- Billing not enabled
- API key permissions incorrect
- Network connectivity issue

**User Action**:
1. Check [Google Cloud Console](https://console.cloud.google.com)
2. Verify API is enabled
3. Check quota usage
4. Enable billing if needed
5. Retry in a few moments

---

### Error Display in UI

```
┌──────────────────────────────────────────┐
│     Link_Critical_Fault                  │
│                                          │
│  Neural handshake rejected.              │
│  Manual reset required.                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Error message appears here         │  │
│  │ (scrollable, monospace font)       │  │
│  │                                    │  │
│  │ API key not configured. Please     │  │
│  │ set VITE_GEMINI_API_KEY in your    │  │
│  │ .env.local file. Get your key      │  │
│  │ from: https://aistudio.google...   │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│        [Force_Reset]                     │
└──────────────────────────────────────────┘
```

---

## Rate Limiting

### Rate Limit Behavior

```
Normal Usage
    ├─ Status: "OPTIMIZED_ACOUSTIC_LINK"
    ├─ Requests allowed: Yes
    └─ Continue

Approaching Limit
    ├─ HTTP 429 (Too Many Requests)
    ├─ Status: "COOLDOWN (10s)"
    ├─ Requests allowed: No
    └─ Auto-retry in 10 seconds

Exceeding Limit
    ├─ Error: Quota exceeded
    ├─ Status: "THROTTLED"
    ├─ Circuit breaker: OPEN
    └─ Wait for cooldown period
```

### Quota Monitoring

**Check Current Usage**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to "Generative AI API" → "Quotas"
4. View current requests and limits

**Rate Limit Response**:
```typescript
// In getStats():
const isThrottled = telemetry.isCircuitOpen;
const cooldownTime = telemetry.isCircuitOpen ? 10000 : 0;
```

---

## Security Protocols

### Key Storage

**Development**:
- Stored in: `.env.local`
- Format: Plain text (local file only)
- Access: Process environment variables
- Protection: Git-ignored file

**Production**:
- Stored in: `.env.production.local` or environment variable
- Format: Encrypted in transit, secure storage at rest
- Access: Server-side only
- Protection: Production secrets management

### Key Security Checklist

✅ **Do's**:
- Store key in `.env.local` (development)
- Use `.env.production.local` for production
- Keep key confidential (like a password)
- Rotate keys periodically
- Use different keys per environment
- Monitor usage in Google Cloud Console

❌ **Don't's**:
- Commit `.env.local` to version control
- Hardcode API key in source files
- Share key via email, chat, or public forums
- Use same key across environments
- Post key in GitHub issues or discussions
- Log full key values (only log source)

### Audit Logging

All API key operations are logged:

```typescript
this.logAudit(
    'API_KEY_VALIDATION_FAILED',  // Action
    'AUTH_GATE',                   // Node ID
    'Failed validation: SYSTEM_ENV. API key not configured...'
);
```

**Audit Log Entries Include**:
- Timestamp
- Action (validation failed, link established, etc.)
- User (if applicable)
- Node ID (system component)
- Details (source and error info)

**Access Audit Logs**:
```javascript
// Browser console
geminiService.synapseManager.getAuditLogs()
```

---

## Troubleshooting Guide

### Issue: "API key not configured"

**Root Cause**: `.env.local` has empty `VITE_GEMINI_API_KEY`

**Resolution**:
```bash
# 1. Check if .env.local exists
ls -la .env.local

# 2. View contents
cat .env.local

# 3. Should show:
# VITE_GEMINI_API_KEY=AIza...

# 4. If empty, add your key
echo "VITE_GEMINI_API_KEY=YOUR_KEY_HERE" > .env.local

# 5. Restart server
npm run dev
```

---

### Issue: "API key not valid"

**Root Cause**: Key doesn't match Google API format

**Validation Checklist**:
```
Check format:
  [ ] Starts with "AIza"
  [ ] Total length is exactly 39 characters
  [ ] Only contains: letters, numbers, underscore, hyphen
  [ ] Not "PLACEHOLDER_API_KEY"

Example of valid key:
  AIzaSyDJbqfGdz1XoJTHZFUl7ZKd8eFZ9vQ4QrX
  ^^^^                                    = 39 chars total
  AIza = prefix (4 chars)
       + 35 alphanumeric/underline/hyphen = 39 total
```

**Resolution**:
```bash
# 1. Get new key from:
#    https://aistudio.google.com/app/apikey

# 2. Copy entire key (Ctrl+C)

# 3. Edit .env.local
nano .env.local

# 4. Update line:
VITE_GEMINI_API_KEY=AIza[paste_your_entire_key]

# 5. Save and exit (Ctrl+X, then Y, then Enter)

# 6. Restart server
npm run dev
```

---

### Issue: "Failed to initialize API client"

**Root Cause**: Key valid but API is unavailable or quota exceeded

**Diagnostics**:
```
Check 1: API Status
  [ ] Go to: https://console.cloud.google.com
  [ ] Select your project
  [ ] Check "Generative AI API" status
  [ ] Should show: ENABLED

Check 2: Quota Usage
  [ ] In Google Cloud Console
  [ ] Navigate to "Quotas"
  [ ] Check usage vs. limit
  [ ] If exceeded: Wait for reset or upgrade

Check 3: Billing
  [ ] Verify billing is enabled
  [ ] Check credit balance
  [ ] Add payment method if needed

Check 4: Network
  [ ] Verify internet connection
  [ ] Try from different network if possible
  [ ] Check firewall/proxy settings
```

**Resolution**:
```bash
# 1. Check quota in Google Cloud Console
#    (see Check 2 above)

# 2. If quota exceeded, wait for:
#    - Daily reset (midnight UTC), or
#    - Upgrade plan for higher limits

# 3. If billing issue, enable billing:
#    - Google Cloud Console → Billing
#    - Add payment method
#    - Wait 5-10 minutes for system update

# 4. Retry chat feature
#    Status should change from "COOLDOWN (Xs)" to "OPTIMIZED_ACOUSTIC_LINK"
```

---

### Issue: Environment variable not being read

**Root Cause**: Server didn't restart after `.env.local` change

**Note**: Environment variables are NOT hot-reloaded

**Resolution**:
```bash
# 1. Save .env.local file

# 2. Stop the dev server
#    Press Ctrl+C in terminal

# 3. Restart server
npm run dev

# 4. Verify in console output:
#    ➜  Local:   http://localhost:3000/

# 5. Clear browser cache (Ctrl+Shift+Delete)

# 6. Reload page (F5)
```

---

### Issue: Service worker caching old version

**Root Cause**: Browser cache serving old files

**Resolution**:
```bash
# Chrome/Edge:
  1. Press F12 (DevTools)
  2. Press Ctrl+Shift+R (Hard refresh)
  3. Or: Clear cache → Ctrl+Shift+Delete

# Safari:
  1. Press Cmd+Option+E (Clear cache)
  2. Or: Reload page (Cmd+R)

# Firefox:
  1. Press Ctrl+F5 (Hard refresh)
  2. Or: Clear cache → Ctrl+Shift+Delete
```

---

## Summary

### Key Points

1. **API Key Retrieval**: Checks User → Admin → System in priority order
2. **Validation**: Checks format (`AIza...` pattern) and rejects placeholders
3. **Error Messages**: Context-aware and actionable
4. **Display**: Shows in diagnostic overlay with setup guidance
5. **Audit Trail**: All events logged for troubleshooting

### Quick Reference

| Situation | Action |
|-----------|--------|
| No API key | Get from https://aistudio.google.com/app/apikey |
| Invalid format | Check key is 39 chars starting with `AIza` |
| Quota exceeded | Check Google Cloud Console, wait or upgrade |
| Can't see changes | Restart server (Ctrl+C, npm run dev) |
| Still broken | See Troubleshooting Guide above |

---

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Status**: Complete and Tested  
**Next Review**: 90 days

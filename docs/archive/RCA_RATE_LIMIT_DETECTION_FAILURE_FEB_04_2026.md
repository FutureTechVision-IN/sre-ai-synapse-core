# ROOT CAUSE ANALYSIS (RCA): RATE LIMIT DETECTION FAILURE
**Document ID:** RCA-FEB-04-2026-DETECTION-01  
**Date:** February 4, 2026  
**Status:** RESOLVED  
**Severity:** P1 - System Degradation  
**Reported Issue:** System crashing to "Critical Fault" screen on 429 errors instead of handling gracefully.

---

## 1. PROBLEM STATEMENT

### 1.1 Symptom
Despite having a sophisticated Rate Limit handling system, `429 Too Many Requests` errors from the Gemini API were triggering the **fatal error screen** (`System_Critical_Fault`) instead of the intended **graceful fallback** (chat message notification).

### 1.2 Evidence
Logs confirmed the following sequence:
1. `POST ... 429 (Too Many Requests)` - Network error occurred
2. `[UNKNOWN] Neural Correlation Fault: Unknown system error` - Error handled as UNKNOWN
3. `System_Critical_Fault` screen displayed

---

## 2. ROOT CAUSE ANALYSIS

### 2.1 Primary Root Cause: Incomplete Error Categorization
**Location:** `services/enhancedErrorHandling.ts` function `categorizeError()`

**Analysis:**
The Google GenAI SDK throws a 429 error which:
- Did NOT contain "rate limit" string in its message
- Did NOT have `error.status` property accessible in the way the code checked
- Contained the string "Too Many Requests"

The existing check was:
```typescript
if (type === 'RATE_LIMIT_EXCEEDED' || status === 429 || msg.includes('429') || msg.includes('rate limit'))
```

It failed to match "Too Many Requests", causing the error to fall through to `ErrorCategory.UNKNOWN`.

### 2.2 Secondary Root Cause: Error Object Structure
The specific error object returned by the underlying fetch/SDK integration didn't populate the `status` field at the top level, causing the `status === 429` check to fail.

---

## 3. IMPACT INTERACTION
This issue interacted with the previously fixed "Undefined Error" issue.
- **Before Phase 1:** The fallback was `undefined`, crashing the app.
- **After Phase 1:** The fallback was "Unknown system error", showing the fatal error screen (better than crash, but still disruptive).

---

## 4. RESOLUTION

### 4.1 Fix Implementation
Updated `categorizeError` to explicitly check for "Too Many Requests":
```typescript
    if (
        type === 'RATE_LIMIT_EXCEEDED' || 
        status === 429 || 
        msg.includes('429') || 
        msg.includes('rate limit') || 
        msg.includes('too many requests')  // <--- ADDED
    ) {
        return ErrorCategory.RATE_LIMIT;
    }
```

### 4.2 Handling Flow Improvement
With this fix:
1. Error is identified as `RATE_LIMIT`
2. `onRateLimit` callback is triggered via `App.tsx`
3. System displays a **Chat Message** ("System is currently being throttled...")
4. `System_Critical_Fault` screen is **AVOIDED**
5. User stays in the application flow

---

**Sign-off:** AI SRE ARCHITECT  
**Date:** Feb 4, 2026

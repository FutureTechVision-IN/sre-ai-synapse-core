# Data Classification Fix Part 2: JSON Parsing & Fallback Logic
**Date:** February 05, 2026
**Topic:** Critical Fix for "Engineering & SRE Ops" Misclassification
**Status:** DEPLOYED

## 1. Issue Recurrence Analysis
**Symptom:** The system displayed "CLASSIFICATION: Engineering & SRE Ops" even after the prompt update.
**Root Cause:** 
1.  **JSON Parsing Failure:** The Google Gemini API (`gemini-3-flash-preview`) often wraps the JSON response in markdown code blocks (` ```json ... ``` `). The previous code tried to `JSON.parse` the raw string, which would cause an exception.
2.  **Faulty Fallback:** The `catch` block for exceptions was hardcoded to `return { category: 'TECHNICAL_SRE', ... }`. 
    -   This means *any* error (network, parsing, timeout) results in an "Engineering & SRE Ops" classification.
    -   This masked the actual parsing error and forced the financial document into the SRE bucket.

## 2. Implemented Resolution

### 2.1. Robust JSON Sanitization (`services/geminiService.ts`)
We added a sanitization layer before parsing:
```typescript
let cleanedText = response.text || '{}';
if (cleanedText.includes('```json')) {
    cleanedText = cleanedText.replace(/```json\n?|\n?```/g, '').trim();
}
```
This ensures that markdown formatting from the AI does not break the classification logic.

### 2.2. Safe Default Fallback
We changed the default fallback category from `TECHNICAL_SRE` to `OTHER`.
```typescript
} catch (e) {
    console.error("Analysis failed...", e);
    return { category: 'OTHER', ... }; // PREVENTS FALSE POSITIVE SRE
}
```
Now, if an error occurs, the document will be flagged as "Other" rather than incorrectly labelled as engineering schematics.

### 2.3. Debugging
Added `console.log("Raw Analysis Response:", response.text)` to the browser console to allow inspection of the raw AI output for future tuning.

## 3. Verification Steps for User
1.  **Refresh** the dashboard application.
2.  **Upload** the Tata Gold/Silver ETF document again.
3.  **Check Console:** If classification fails, check the browser DevTools console for "Raw Analysis Response".
4.  **Expectation:** The system should now correctly parse the JSON and apply the `FINANCIAL_MARKET` category. If it fails, it will show as "Other", proving the Catch Block fix is active.

---
**System Updated by:** SRE Synapse Neural Agent

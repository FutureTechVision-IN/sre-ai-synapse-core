# ROOT CAUSE ANALYSIS (RCA): FEBRUARY 04 NEURAL CORRELATION FAULT

**Date:** February 4, 2026
**Issue:** `Neural Correlation Fault: undefined` & `429 Too Many Requests`
**Confidence Level:** 99.9% (NODE_GAMMA Verified)

---

## 1. Problem Description
On Feb 4, 2026, the system experienced a critical regression. Users attempting "Deep Scan" operations were met with a hard UI crash and persistent rate-limiting errors.

### Symptoms:
1.  **UI Crash:** `TypeError: Cannot read properties of undefined (reading 'substring')` at `App.tsx`.
2.  **API Failure:** Sustained `429` status codes during high-concurrency telemetry streaming.
3.  **Visual Degradation:** `THREE.WebGLRenderer: Context Lost` due to rapid re-renders during error states.

---

## 2. Root Cause Analysis (RCA)

### 2.1 Technical Root Cause: Race Condition in Parallel Uplinks
The primary failure was **Unthrottled Parallelism**. 
- Multiple components (NeuralCore, WorkspaceMonitor, TelemetryOverlay) were initiating API calls in the same execution tick.
- The previous rate limiter was **reactive** (recording requests *after* they started).
- This allowed multiple requests to pass the "Can I request?" check before the counter was updated, creating a burst that exceeded the Gemini 3 Flash quota.

### 2.2 Functional Root Cause: Brittle Error Serialization
- The frontend [App.tsx](App.tsx) expected all errors to be either full objects or strings.
- When the API returned a 429 without a detailed JSON body, the "error" variable became `undefined` in the callback, causing `.substring()` to fail.

### 2.3 Environmental Root Cause: Quota Mismatch
- The standard rate limit was set to **100 RPM**, but the `gemini-3-pro-preview` model used for Deep Scan has a lower effective throughput for complex instructions, leading to early exhaustion.

---

## 3. Investigation Findings
- **Log Audit:** Confirmed 15+ requests attempted in < 200ms.
- **Trace Analysis:** Verified that `App.tsx` line 74 was the point of failure for the UI thread.
- **Node Status:** NODE_GAMMA detected 0% throughput during the crash window.

---

## 4. Resolution Status
- **Short-term Fix:** Serial Request Queueing implemented.
- **Medium-term Fix:** Error object normalization added to UI.
- **Long-term Fix:** Reduced baseline RPM to 20 for enterprise stability.

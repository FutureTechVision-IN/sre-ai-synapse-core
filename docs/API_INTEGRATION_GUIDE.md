# Synapse Robotics API Integration Guide

This document outlines the architecture and usage of the reconstructed API integration layer for the SRE Synapse supercomputer dashboard.

## Overview

The integration layer provides a robust, production-grade interface to the Gemini API, ensuring high availability, precision, and safety through several defensive programming patterns.

## Core Components

### 1. API Request Manager (`services/apiRequestManager.ts`)
The central orchestrator for all API traffic.
- **Rate Limiting**: Integrated sliding-window limiter.
- **Circuit Breaking**: Automatically trips after 5 consecutive failures, protecting the "Neural Core".
- **Deduplication**: Prevents identical requests within 100ms.
- **Staggering**: Ensures at least 100ms between any two API calls.
- **Retries**: Implements exponential backoff with jitter.

### 2. Enhanced Error Handling (`services/enhancedErrorHandling.ts`)
Structured error categorization for the React frontend.
- **Categories**: `RATE_LIMIT`, `THERMAL_LIMIT`, `CIRCUIT_BREAKER`, `AUTH`, `NETWORK`.
- **Hooks**: Integration within `App.tsx` via `AppErrorHandlingSystem`.

### 3. Rate Limiter (`services/rateLimiter.ts`)
A precise sliding-window limiter that handles burst traffic and provides "Retry-After" metadata.

## Usage Patterns

### Standard API Call
Wrap API calls in `geminiService.ts` using the manager:

```typescript
const response = await apiRequestManager.executeRequest(
    '/gemini/endpoint',
    () => client.models.generateContent({ ... }),
    { deduplicatable: true, retryCount: 3 }
);
```

### Frontend Integration
Use the `errorSystem` in `App.tsx`:

```typescript
try {
    const result = await errorSystem.executeWithErrorHandling(
        () => geminiService.someAction(),
        { operationName: "Action Name" }
    );
} catch (err) {
    // Error is already categorized and reported to the UI
}
```

## Resilience Strategies

1. **Sliding Window**: Prevents "Thundering Herd" by spreading requests over time.
2. **Exponential Backoff**: $t_{retry} = base \times 2^{attempt} + jitter$.
3. **Thermal Protection**: Monitors system load and proactively throttles when limits are approached.
4. **Audit Logging**: Every failure is logged to the `NeuralOrchestrator` for post-incident analysis.

## Maintenance

To adjust rate limits, modify:
- `services/rateLimiter.ts` (Underlying logic)
- `services/apiRequestManager.ts` (Global throttle settings)

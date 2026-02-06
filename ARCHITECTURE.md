# Architecture Documentation

## System Architecture Overview

SRE Synapse is built as a modern web application leveraging React for the frontend, Google Gemini AI for intelligent processing, and a resilient service architecture for service readiness.

---

## Architecture Layers

### 1. Presentation Layer

**Components** (`/components`)
- Responsible for UI rendering and user interactions
- Pure functional React components with TypeScript
- State management via React hooks
- Event handling and user input validation

**Key Components:**
```
WelcomeScreen → Initial upload interface
ChatInterface → Conversational AI interaction
AdminPortal → System administration
WorkspaceMonitor → Real-time telemetry
```

### 2. Application Layer

**Core Application** (`App.tsx`)
- Central state management
- Application lifecycle management
- Route/view coordination
- Error boundary management

**State Flow:**
```
User Action → Component → App State → Service Call → API → Response → State Update → UI Re-render
```

### 3. Service Layer

**AI Service** (`services/geminiService.ts`)
- Google Gemini API integration
- Document analysis and classification
- Streaming chat responses
- Model management and failover

**Telemetry Service** (`services/telemetryService.ts`)
- Performance metrics collection
- Quota monitoring
- Circuit breaker implementation
- Health checks

### 4. Data Layer

**Type System** (`types.ts`)
- Centralized type definitions
- Interface contracts
- Enum declarations
- Type guards

---

## Core Modules

### SynapseManager Module

**Responsibilities:**
- AI model lifecycle management
- API key rotation and management
- User authentication
- Audit logging
- Quota management

**Architecture:**
```typescript
class SynapseManager {
  private client: GoogleGenAI
  private securityManager: SecurityManager
  private telemetry: Telemetry
  
  // Model Management
  +getClient(): { client, modelName }
  +switchModel(newModel: string): void
  
  // Resilience
  +runWithResilience<T>(fn: Function): Promise<T>
  +parseError(error: any): NeuralFaultType
  
  // Security
  +authenticate(username, password): AuthResult
  +createUser(username, password, role): User
}
```

### Document Analysis Pipeline

**Flow:**
```
1. File Upload
   ↓
2. File Validation (size, type)
   ↓
3. Content Extraction
   ↓
4. AI Classification (5-step decision tree)
   ↓
5. Post-Validation (keyword override)
   ↓
6. Entity Extraction
   ↓
7. Contextual Question Generation
   ↓
8. Result Display
```

**Classification Decision Tree:**
```
Step 1: Financial Market Indicators (HIGHEST PRIORITY)
  - Stock tickers, ETF names, trading indicators
  - If found → FINANCIAL_MARKET
  
Step 2: Tax Documents
  - Tax forms, ITR, jurisdiction mentions
  - If found → INCOME_TAX
  
Step 3: Lottery/Gaming
  - Lottery tickets, betting slips
  - If found → LOTTERY
  
Step 4: Technical/Service Readiness (LOWEST PRIORITY)
  - Source code, infrastructure configs, logs
  - If found AND no financial data → TECHNICAL_SERVICE_READINESS
  
Step 5: Default
  - If none match → OTHER
```

### Chat Streaming Architecture

**Streaming Pipeline:**
```
User Query Input
  ↓
Context Assembly (files + history + analysis)
  ↓
Gemini API Stream Request
  ↓
Token-by-Token Reception
  ↓
Grounding Citation Extraction
  ↓
UI Update (incremental)
  ↓
Completion + Verification
```

**Response Verification:**
```typescript
interface VerificationLayer {
  confidence: number;        // 0-1 score
  processingNode: string;    // Node identifier
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
}
```

---

## Data Flow Diagrams

### User Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Login Attempt
     ▼
┌─────────────────────┐
│  AdminLogin.tsx     │
└────┬────────────────┘
     │ 2. Credentials
     ▼
┌─────────────────────┐
│ SecurityManager     │
│ • Verify password   │
│ • Check role        │
│ • Create session    │
└────┬────────────────┘
     │ 3. Auth Result
     ▼
┌─────────────────────┐
│  App.tsx State      │
│ • Set currentUser   │
│ • Update status     │
└────┬────────────────┘
     │ 4. Redirect
     ▼
┌─────────────────────┐
│  AdminPortal.tsx    │
│  (if Admin role)    │
└─────────────────────┘
```

### Document Upload & Analysis Flow

```
┌──────────────┐
│ File Upload  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  WelcomeScreen       │
│  • Validate files    │
│  • Check size/type   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  ingestFiles()       │
│  • Convert to base64 │
│  • Create file parts │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│  analyzeDocumentStructure()  │
│  • AI classification         │
│  • Entity extraction         │
│  • Question generation       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Post-Validation Override    │
│  • Keyword scan              │
│  • Entity validation         │
│  • Category correction       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  App State Update            │
│  • Store file parts          │
│  • Set analysis context      │
│  • Generate example Qs       │
│  • Switch to Chat mode       │
└──────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Status     │  │ Current User │  │  Chat Hist   │      │
│  │   Files      │  │ Analysis Ctx │  │  Example Qs  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────┬───────────────────┬───────────────────┬───────────────┘
      │                   │                   │
      │                   │                   │
   ┌──▼──────────┐  ┌────▼─────────┐  ┌─────▼────────┐
   │ Welcome     │  │ Chat         │  │ Admin        │
   │ Screen      │  │ Interface    │  │ Portal       │
   └──┬──────────┘  └────┬─────────┘  └─────┬────────┘
      │                  │                   │
      │                  │                   │
   ┌──▼──────────────────▼───────────────────▼────────┐
   │            geminiService.ts                       │
   │  • ingestFiles()                                  │
   │  • analyzeDocumentStructure()                     │
   │  • querySynapseStream()                           │
   │  • SynapseManager                                 │
   └───────────────────┬───────────────────────────────┘
                       │
                  ┌────▼─────┐
                  │  Gemini  │
                  │   API    │
                  └──────────┘
```

---

## Security Architecture

### Authentication & Authorization

```typescript
// Role-Based Access Control
enum UserRole {
  Admin = 'ADMIN',    // Full system access
  Viewer = 'VIEWER'   // Read-only access
}

// Permission Matrix
const permissions = {
  ADMIN: [
    'user.create', 'user.delete', 'user.modify',
    'key.rotate', 'key.revoke',
    'logs.view', 'telemetry.access',
    'chat.use', 'upload.files'
  ],
  VIEWER: [
    'chat.use', 'upload.files'
  ]
};
```

### API Key Management

**Multi-Key Architecture:**
```
Primary Key → Active (daily operations)
  ↓
Backup Key → Standby (automatic failover)
  ↓
Emergency Key → Manual activation (quota exceeded)
```

**Key Rotation Flow:**
```
1. Admin initiates rotation
2. Generate new key
3. Update client configuration
4. Test new key
5. Deprecate old key (grace period)
6. Revoke old key
7. Audit log entry
```

---

## Resilience Patterns

### Circuit Breaker

**States:**
```
CLOSED (Normal Operation)
  ↓ (5 consecutive failures)
OPEN (Reject requests, fast-fail)
  ↓ (30s timeout)
HALF-OPEN (Test recovery)
  ↓ (Success)
CLOSED
```

**Implementation:**
```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  private failureCount: number;
  private lastFailureTime: number;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > 30000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Model Failover

**Fallback Hierarchy:**
```
gemini-3-pro-preview (Primary)
  ↓ (on quota/error)
gemini-3-flash-preview (Fast fallback)
  ↓ (on quota/error)
gemini-1.5-flash (Reliable fallback)
  ↓ (on quota/error)
Error state + circuit breaker activation
```

---

## Performance Optimizations

### Lazy Loading

```typescript
// Component-level code splitting
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const WorkspaceMonitor = lazy(() => import('./components/WorkspaceMonitor'));
```

### Memoization

```typescript
// Expensive computations cached
const exampleQuestions = useMemo(() => 
  generateQuestions(analysisContext), 
  [analysisContext]
);

const handleQuery = useCallback((query: string) => {
  // Stable function reference
}, [dependencies]);
```

### Streaming Optimization

```typescript
// Token-by-token rendering instead of waiting for full response
for await (const chunk of stream) {
  updateUI(chunk);  // Incremental updates
}
```

---

## Monitoring & Observability

### Telemetry Collection

**Metrics:**
- Success/failure rates
- Average latency (p50, p95, p99)
- Quota utilization
- Circuit breaker state transitions
- API key usage per user

**Logging:**
```typescript
interface AuditLog {
  timestamp: number;
  action: string;
  user: string;
  nodeId: string;
  details: string;
}

// Example
logAudit('USER_CREATED', 'SEC-001', 'Admin created user: john_doe');
```

---

## Deployment Architecture

### Development Environment

```
Local Machine
  ↓
Vite Dev Server (HMR enabled)
  ↓
Browser (localhost:3000)
```

### Production Environment

```
GitHub Repository
  ↓
Build Process (GITHUB_PAGES=true npm run build)
  ↓
Static Assets (HTML, JS, CSS)
  ↓
GitHub Pages CDN
  ↓
End Users (HTTPS)
```

---

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.3.1 | UI framework |
| | TypeScript | 5.8.2 | Type safety |
| | Vite | 6.2.0 | Build tool |
| **AI/ML** | Google Gemini API | 1.29.0 | AI processing |
| **Visualization** | Three.js | 0.170.0 | 3D graphics |
| | Recharts | 2.12.7 | Charts |
| | Spline | 4.1.0 | 3D scenes |
| **Utilities** | jsPDF | 2.5.1 | PDF generation |
| | Tailwind | 3.x | CSS framework |

---

## Future Architecture Considerations

### Planned Enhancements

1. **Microservices Migration**
   - Separate document service
   - Authentication service
   - Analytics service

2. **Real-time Collaboration**
   - WebSocket integration
   - Shared document sessions
   - Live chat sync

3. **Plugin Architecture**
   - Custom document classifiers
   - Third-party integrations
   - Extension marketplace

4. **Self-Hosted AI**
   - Local model deployment
   - GPU acceleration
   - Custom fine-tuning

---

## References

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

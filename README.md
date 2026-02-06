<div align="center">
  
# 🧠 SRE Synapse

### AI-Powered Service Readiness Engineering Intelligence Platform

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646cff)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4)](https://ai.google.dev/)

An advanced AI-powered platform that transforms how Site Reliability Engineers interact with technical documentation, financial data, and system intelligence through natural language processing and intelligent document analysis.

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Component Reference](#-component-reference)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🌟 Overview

**SRE Synapse** is an enterprise-grade AI platform designed specifically for Service Readiness Engineering teams. It leverages Google's Gemini AI to provide intelligent document analysis, real-time chat capabilities, and comprehensive system monitoring through a beautiful, futuristic neural interface.

### Key Capabilities

- 🤖 **AI-Powered Document Analysis**: Automatically classifies and extracts insights from technical, financial, and operational documents
- 💬 **Neural Chat Interface**: Context-aware conversational AI with streaming responses and grounding citations
- 📊 **Financial Intelligence**: Specialized ETF, stock, and market analysis with technical indicator recognition
- 🔐 **Enterprise Security**: Role-based access control, API key management, and comprehensive audit logging
- 📈 **Real-time Monitoring**: System telemetry, quota management, and thermal monitoring dashboards
- 🎨 **Immersive UI**: 3D holographic visualizations powered by Three.js and Spline

---

## ✨ Features

### Core Features

#### 🧠 Intelligent Document Classification
- **Multi-Category Detection**: Automatically categorizes documents into Income Tax, Financial Markets, Technical/Service Readiness, Lottery, or General
- **ETF & Trading Chart Recognition**: Specialized detection for TATA Gold/Silver, NIFTY, SENSEX, and technical indicators (RSI, MACD, EMA)
- **Financial Keyword Validation**: 24+ keyword post-validation ensures accurate classification
- **Entity Extraction**: Identifies stock tickers, tax jurisdictions, and domain-specific entities

#### 💬 Advanced Chat System
- **Streaming Responses**: Real-time token-by-token response generation
- **Grounding Citations**: Source attribution with confidence scores
- **Context-Aware**: Multi-document ingestion with intelligent context switching
- **Verification Layer**: Multi-node validation with confidence scoring

#### 🔒 Security & Access Control
- **Role-Based Access**: Admin and Viewer roles with granular permissions
- **API Key Management**: Multi-key rotation, usage tracking, and quota monitoring
- **Audit Logging**: Comprehensive activity tracking with timestamp and user attribution
- **Password Management**: Secure authentication with mandatory password resets

#### 📊 Visualization & Monitoring
- **Thermal Dashboard**: Real-time quota, latency, and error rate monitoring
- **3D Neural Interface**: Holographic visualizations for system health
- **Data Charts**: Recharts integration for financial and telemetry data
- **PDF Export**: jsPDF integration for report generation

### Technical Features

- **Resilient Architecture**: Circuit breaker pattern with automatic failover
- **Multi-Model Support**: Gemini 3 Pro Preview with Flash fallback
- **Rate Limiting**: Intelligent request throttling and quota management
- **Error Recovery**: Automatic retry logic with exponential backoff
- **Telemetry Collection**: Performance metrics, success rates, and fault tracking

---

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SRE Synapse Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Presentation │  │   Security   │  │  Admin UI    │         │
│  │     Layer     │  │    Layer     │  │   Portal     │         │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘         │
│          │                  │                  │                 │
│  ┌───────▼──────────────────▼──────────────────▼──────┐        │
│  │           Core Application Layer (App.tsx)          │        │
│  └───────┬──────────────────┬──────────────────┬───────┘       │
│          │                  │                  │                 │
│  ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐         │
│  │   Gemini AI  │  │  Telemetry   │  │  Document    │         │
│  │   Service    │  │   Service    │  │  Analysis    │         │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘         │
│          │                  │                  │                 │
│  ┌───────▼──────────────────▼──────────────────▼──────┐        │
│  │            AI Processing & Validation               │        │
│  │  • SynapseManager    • Rate Limiter                 │        │
│  │  • Circuit Breaker   • Error Handler                │        │
│  └─────────────────────────────────────────────────────┘        │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Google Gemini  │                          │
│                    │   AI Models     │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### **Services Layer** (`/services`)

| Service | Purpose | Key Features |
|---------|---------|--------------|
| `geminiService.ts` | Core AI integration | Model management, streaming, document analysis |
| `telemetryService.ts` | Monitoring & metrics | Performance tracking, quota monitoring |

#### **Components Layer** (`/components`)

| Component | Type | Purpose |
|-----------|------|---------|
| `WelcomeScreen` | UI | Initial entry point with file upload |
| `ChatInterface` | UI | Conversational AI interaction |
| `AdminPortal` | UI | User management and system config |
| `APIKeyConfigPanel` | UI | Multi-key management interface |
| `WorkspaceMonitor` | UI | Real-time system telemetry |
| `DocumentList` | UI | Ingested document overview |
| `DataVisualizer` | UI | Chart and graph rendering |

#### **Core Types** (`types.ts`)

```typescript
// Primary Data Models
User, VaultNode, AuditLog, SpeechLog
ChatMessage, DocumentAnalysis, QueryResult
AppStatus, UserRole, NeuralFaultType
```

---

## 🔧 Prerequisites

### System Requirements

- **Node.js**: ≥ 18.0.0 (LTS recommended)
- **npm**: ≥ 9.0.0 or **yarn**: ≥ 1.22.0
- **Operating System**: macOS, Linux, or Windows 10+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RAM**: Minimum 4GB (8GB recommended for development)
- **Storage**: 500MB available disk space

### Required Accounts

- **Google AI Studio Account**: For Gemini API access
- **Gemini API Key**: [Get your key here](https://ai.google.dev/)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/FutureTechVision-IN/sre-ai-synapse-core.git
cd sre-synapse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 📦 Installation

### Detailed Setup

#### Step 1: Environment Setup

```bash
# Clone repository
git clone https://github.com/FutureTechVision-IN/sre-ai-synapse-core.git
cd sre-synapse

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Step 2: API Configuration

Create `.env.local` file:

```env
# Required: Gemini API Configuration
GEMINI_API_KEY=AIzaSy...your-key...

# Optional: Advanced Configuration
VITE_AI_STUDIO_URL=https://ai.studio/apps/drive/your-app-id
VITE_MAX_FILE_SIZE_MB=10
VITE_ENABLE_TELEMETRY=true
```

#### Step 3: Verify Setup

```bash
# Start development server
npm run dev

# In another terminal, run health check
curl http://localhost:3000
```

### Docker Installation (Advanced)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

```bash
docker build -t sre-synapse .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key sre-synapse
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `GEMINI_API_KEY` | string | **Required** | Your Google Gemini API key |
| `VITE_MAX_FILE_SIZE_MB` | number | 10 | Maximum upload file size (MB) |
| `VITE_ENABLE_TELEMETRY` | boolean | true | Enable performance monitoring |
| `GITHUB_PAGES` | boolean | false | Enable GitHub Pages deployment mode |

### Vite Configuration

Edit `vite.config.ts` for advanced configuration:

```typescript
export default defineConfig(({ mode }) => {
  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/sre-ai-synapse-core/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': 'http://localhost:8080' // Optional API proxy
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      chunkSizeWarningLimit: 1000
    }
  };
});
```

### TypeScript Configuration

The project uses strict TypeScript settings. See `tsconfig.json` for full configuration.

---

## 📖 Usage Guide

### Basic Workflow

#### 1. **Initial Access**

```
Navigate to http://localhost:3000
↓
Welcome Screen appears
↓
Upload document(s) or start admin login
```

#### 2. **Document Upload & Analysis**

```typescript
// Supported file types
const supportedFormats = [
  'PDF', 'DOCX', 'TXT', 'PNG', 'JPG', 
  'JPEG', 'CSV', 'XLSX', 'MD'
];

// Maximum file size: 10MB per file
// Multiple files supported
```

**Upload Flow**:
1. Click "Upload Document" or drag & drop
2. System analyzes content using AI
3. Classification displayed: Income Tax | Financial Markets | Technical/SRE | Lottery | Other
4. Context-specific questions generated automatically

#### 3. **Chat Interaction**

**Example queries**:

```
For Financial Documents:
- "What's the RSI value for TATSILV?"
- "Analyze the MACD indicator trend"
- "Calculate portfolio returns for Q4"

For Tax Documents:
- "Summarize deductions in Form 16"
- "What is the total tax liability?"
- "List all income sources"

For Technical Documents:
- "Explain the Kubernetes configuration"
- "Identify potential service readiness issues"
- "Summarize error logs"
```

#### 4. **Admin Functions**

**Access Admin Portal**:
1. Click user icon → "Admin Login"
2. Default credentials: `sre-admin` / (no password - mandatory reset)
3. Set new password on first login

**Admin Capabilities**:
- User management (create, modify, delete users)
- API key rotation and monitoring
- System telemetry dashboard
- Audit log review
- Quota management

---

## 🔌 API Documentation

### Core API Functions

#### `geminiService.ts`

##### `ingestFiles(files: File[], onProgress?: (p: number) => void): Promise<any[]>`

Uploads and processes files for AI analysis.

**Parameters**:
- `files`: Array of File objects
- `onProgress`: Optional callback for upload progress (0-100)

**Returns**: Array of file parts ready for AI processing

**Example**:
```typescript
const files = [new File(['content'], 'doc.pdf')];
const parts = await geminiService.ingestFiles(files, (progress) => {
  console.log(`Upload: ${progress}%`);
});
```

##### `querySynapseStream(query: string, files: any[], history: ChatMessage[], analysisContext?: DocumentAnalysis)`

Streams AI responses with grounding citations.

**Parameters**:
- `query`: User's question
- `files`: Ingested file parts
- `history`: Chat message history
- `analysisContext`: Document classification context

**Returns**: AsyncGenerator yielding ChatMessage objects

**Example**:
```typescript
for await (const message of geminiService.querySynapseStream(
  "Explain this ETF", fileParts, chatHistory, analysis
)) {
  console.log(message.parts[0].text);
}
```

##### `analyzeDocumentStructure(fileParts: any[]): Promise<DocumentAnalysis>`

Classifies documents and generates contextual questions.

**Returns**:
```typescript
{
  category: 'INCOME_TAX' | 'FINANCIAL_MARKET' | 'TECHNICAL_SERVICE_READINESS' | 'LOTTERY' | 'OTHER',
  questions: string[],
  metadata: {
    jurisdiction?: string,
    entities?: string[],
    confidence: number
  }
}
```

#### Security API

##### `synapseManager.authenticate(username: string, password: string)`

Authenticates user credentials.

**Returns**:
```typescript
{
  success: boolean,
  user?: User,
  error?: string
}
```

##### `synapseManager.createUser(username, password, role, apiKey?): User`

Creates a new user account.

**Roles**: `UserRole.Admin | UserRole.Viewer`

---

## 🧩 Component Reference

### UI Components

#### `<ChatInterface />`

Main conversational interface with streaming AI responses.

**Props**:
```typescript
{
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onSend: (query: string) => void;
  onStop: () => void;
  exampleQuestions: string[];
  documentName: string;
}
```

#### `<AdminPortal />`

Administrative dashboard for user and system management.

**Features**:
- User CRUD operations
- API key rotation
- Audit log viewing
- System metrics
- Thermal monitoring

#### `<WorkspaceMonitor />`

Real-time system telemetry display.

**Metrics Tracked**:
- Vault node status (ONLINE | THROTTLED | QUARANTINE)
- Request latency (avg/p95/p99)
- Success/failure rates
- Quota utilization
- Circuit breaker state

#### `<DocumentList />`

Displays ingested documents with metadata.

```typescript
interface DocumentListProps {
  files: File[];
  analysisContext?: DocumentAnalysis;
  onRemove?: (index: number) => void;
}
```

---

## 💻 Development

### Development Workflow

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type checking
npx tsc --noEmit

# Lint code
npx eslint src/

# Format code
npx prettier --write "**/*.{ts,tsx,json,md}"
```

### Project Structure

```
sre-synapse/
├── components/           # React UI components
│   ├── AdminLogin.tsx
│   ├── ChatInterface.tsx
│   ├── WorkspaceMonitor.tsx
│   ├── icons/           # Icon components
│   └── ui/              # Shared UI primitives
├── services/            # Business logic & API integration
│   ├── geminiService.ts
│   └── telemetryService.ts
├── scripts/             # Build & deployment scripts
│   ├── startup.sh
│   ├── shutdown.sh
│   └── health-check.sh
├── App.tsx              # Root application component
├── types.ts             # TypeScript type definitions
├── index.tsx            # Application entry point
├── vite.config.ts       # Vite build configuration
└── tsconfig.json        # TypeScript configuration
```

### Code Style Guidelines

- **TypeScript**: Strict mode enabled
- **Naming**: PascalCase for components, camelCase for functions
- **Comments**: JSDoc for public APIs
- **Imports**: Absolute imports using `@/` alias
- **State**: Prefer hooks (useState, useCallback, useEffect)

### Adding New Features

1. **Create component**: `components/NewFeature.tsx`
2. **Add types**: Update `types.ts`
3. **Integrate service**: Import in `App.tsx`
4. **Add tests**: `services/newFeature.test.ts`
5. **Update docs**: Add to README

---

## 🚢 Deployment

### GitHub Pages Deployment

```bash
# Build for GitHub Pages
GITHUB_PAGES=true npm run build

# Deploy to gh-pages branch
git checkout -b gh-pages
cp -r dist/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force
```

**Enable GitHub Pages**:
1. Go to repository Settings → Pages
2. Source: Deploy from branch `gh-pages`, `/ (root)`
3. Save

**Live URL**: `https://your-username.github.io/repository-name/`

### Production Deployment (Vercel/Netlify)

**Vercel**:
```bash
npm install -g vercel
vercel --prod
```

**Netlify**:
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment-Specific Builds

```bash
# Development
npm run dev

# Production preview
npm run build && npm run preview

# Production with GitHub Pages base path
GITHUB_PAGES=true npm run build
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test services/geminiService.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Structure

```typescript
// Example test
import { analyzeDocumentStructure } from './geminiService';

describe('Document Classification', () => {
  it('should classify financial charts as FINANCIAL_MARKET', async () => {
    const mockFile = [{ text: 'TATSILV RSI MACD chart' }];
    const result = await analyzeDocumentStructure(mockFile);
    expect(result.category).toBe('FINANCIAL_MARKET');
  });
});
```

### Manual Testing Checklist

- [ ] File upload (PDF, images, documents)
- [ ] Document classification accuracy
- [ ] Chat streaming responses
- [ ] Admin login and user management
- [ ] API key rotation
- [ ] Telemetry dashboard updates
- [ ] Mobile responsiveness
- [ ] Error handling (quota exhaustion, network failures)

---

## 🤝 Contributing

We welcome contributions from the community! Please follow these guidelines:

### Contribution Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test`
5. **Commit**: `git commit -m 'feat: add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new document classification category
fix: resolve ETF chart misclassification
docs: update API documentation
chore: upgrade dependencies
refactor: simplify authentication flow
test: add unit tests for telemetry service
```

### Code Review Standards

- **Code Quality**: Pass TypeScript strict mode
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline comments
- **Performance**: No significant performance regressions
- **Security**: No credentials in code

### Development Setup for Contributors

```bash
git clone https://github.com/YOUR_USERNAME/sre-ai-synapse-core.git
cd sre-synapse
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm run dev
```

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for full details.

```
Copyright 2026 Future Tech Vision

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### Third-Party Licenses

This project uses open-source libraries with the following licenses:

- **React** (MIT) - Facebook Inc.
- **TypeScript** (Apache 2.0) - Microsoft Corporation
- **Vite** (MIT) - Evan You
- **Three.js** (MIT) - three.js authors
- **Recharts** (MIT) - Recharts contributors
- **@google/genai** (Apache 2.0) - Google LLC

See `package.json` for complete dependency list.

---

## 📞 Support

### Getting Help

- **Documentation**: [README](README.md) (this file)
- **Issues**: [GitHub Issues](https://github.com/FutureTechVision-IN/sre-ai-synapse-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FutureTechVision-IN/sre-ai-synapse-core/discussions)

### Reporting Bugs

When reporting bugs, please include:

1. **Environment**: OS, Node version, browser
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots** (if applicable)
6. **Console errors**

**Template**:
```markdown
**Environment:**
- OS: macOS 14.2
- Node: 18.16.0
- Browser: Chrome 120

**Steps to Reproduce:**
1. Upload PDF file
2. Click "Ask Question"
3. ...

**Expected:** Document classifies as FINANCIAL_MARKET
**Actual:** Classifies as TECHNICAL_SRE

**Console Errors:**
```
[error details]
```
```

### Security Issues

**DO NOT** open public issues for security vulnerabilities. Instead:

1. Email: security@futuretechvision.in
2. Include detailed description
3. Wait for acknowledgment
4. Coordinate disclosure timeline

---

## 🙏 Acknowledgments

- **Google AI Studio** - For providing the Gemini API
- **React Team** - For the incredible React framework
- **Vite Team** - For blazing-fast build tooling
- **Three.js Community** - For stunning 3D visualizations
- **Open Source Community** - For all the amazing libraries

---

## 🗺️ Roadmap

### Version 1.0 (Current)
- [x] Core AI document analysis
- [x] Multi-category classification
- [x] Real-time chat interface
- [x] Admin portal
- [x] API key management

### Version 1.1 (Planned)
- [ ] Multi-language support
- [ ] Advanced PDF annotations
- [ ] Export chat history
- [ ] Custom classification models
- [ ] WebSocket real-time collaboration

### Version 2.0 (Future)
- [ ] Self-hosted AI models
- [ ] Plugin architecture
- [ ] Mobile applications
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/FutureTechVision-IN/sre-ai-synapse-core)
![GitHub forks](https://img.shields.io/github/forks/FutureTechVision-IN/sre-ai-synapse-core)
![GitHub issues](https://img.shields.io/github/issues/FutureTechVision-IN/sre-ai-synapse-core)
![GitHub pull requests](https://img.shields.io/github/issues-pr/FutureTechVision-IN/sre-ai-synapse-core)

---

<div align="center">

**Built with ❤️ by [Future Tech Vision](https://futuretechvision.in)**

[⬆ Back to Top](#-sre-synapse)

</div>
# Contributing to SRE Synapse

First off, thank you for considering contributing to SRE Synapse! It's people like you that make this platform a great tool for the Service Readiness Engineering community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Environment:**
- OS: [e.g., macOS 14.2, Ubuntu 22.04]
- Node Version: [e.g., 18.16.0]
- Browser: [e.g., Chrome 120, Firefox 115]
- Package Version: [e.g., 1.0.0]

**Description:**
A clear and concise description of the bug.

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Screenshots/Logs:**
If applicable, add screenshots or console logs.

**Additional Context:**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List any alternative solutions** you've considered
- **Include mockups or examples** if applicable

### Pull Requests

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

---

## Development Setup

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0 or yarn ≥ 1.22.0
- Git
- Google Gemini API Key

### Initial Setup

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sre-ai-synapse-core.git
cd sre-synapse

# Add upstream remote
git remote add upstream https://github.com/FutureTechVision-IN/sre-ai-synapse-core.git

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Gemini API key to .env.local
echo "GEMINI_API_KEY=your_api_key_here" >> .env.local

# Start development server
npm run dev
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream changes to your main branch
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

---

## Coding Standards

### TypeScript

We use TypeScript with strict mode enabled. Follow these guidelines:

```typescript
// ✅ Good: Explicit types, clear naming
interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  createdAt: number;
}

function createUser(username: string, role: UserRole): UserProfile {
  return {
    id: generateId(),
    username,
    role,
    createdAt: Date.now()
  };
}

// ❌ Bad: Implicit any, unclear naming
function doStuff(x, y) {
  return x + y;
}
```

### React Components

```typescript
// ✅ Good: Functional component with TypeScript
interface WelcomeProps {
  username: string;
  onLogout: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ username, onLogout }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div>
      <h1>Welcome, {username}</h1>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
};

// ❌ Bad: Class component without types
class Welcome extends React.Component {
  render() {
    return <div>{this.props.username}</div>;
  }
}
```

### File Organization

```
components/
├── AdminLogin.tsx           # Component logic
├── AdminLogin.test.tsx      # Tests (if applicable)
└── AdminLogin.module.css    # Styles (if using CSS modules)
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatInterface`, `AdminPortal` |
| Functions | camelCase | `ingestFiles`, `authenticateUser` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_ENDPOINT` |
| Types/Interfaces | PascalCase | `ChatMessage`, `DocumentAnalysis` |
| Files | PascalCase for components, camelCase for utils | `ChatInterface.tsx`, `apiClient.ts` |

### Code Comments

```typescript
/**
 * Analyzes document structure and classifies into predefined categories.
 * 
 * @param fileParts - Array of file parts containing document content
 * @returns Promise resolving to DocumentAnalysis with category and metadata
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeDocumentStructure([{text: "ETF data"}]);
 * console.log(analysis.category); // "FINANCIAL_MARKET"
 * ```
 */
export async function analyzeDocumentStructure(
  fileParts: any[]
): Promise<DocumentAnalysis> {
  // Implementation
}
```

---

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, missing semi-colons, etc) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Changes to build process or auxiliary tools |
| `ci` | CI/CD configuration changes |
| `revert` | Reverts a previous commit |

### Examples

```bash
# Feature
git commit -m "feat(chat): add streaming response support"

# Bug fix
git commit -m "fix(classification): resolve ETF chart misclassification

- Enhanced financial keyword detection
- Added post-validation for TATSILV/TATAGOLD
- Updated decision tree priority"

# Documentation
git commit -m "docs(readme): update API documentation section"

# Breaking change
git commit -m "feat(auth)!: migrate to OAuth2 authentication

BREAKING CHANGE: API key authentication is no longer supported.
Users must migrate to OAuth2 flow."
```

---

## Pull Request Process

### Before Submitting

1. **Update Documentation**: If you changed APIs or added features
2. **Add Tests**: For new functionality
3. **Run Tests**: Ensure all tests pass
4. **Check Linting**: Run `npm run lint`
5. **Update CHANGELOG**: Add entry under "Unreleased"

### PR Title Format

Follow the same format as commit messages:

```
feat(component): add new feature
fix(service): resolve critical bug
docs(guide): update contribution guidelines
```

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran to verify your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Fixes #(issue number)
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer reviews the code
3. **Discussion**: Address any feedback or questions
4. **Approval**: Maintainer approves the PR
5. **Merge**: PR is merged into main branch

---

## Testing Guidelines

### Writing Tests

```typescript
// services/geminiService.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeDocumentStructure } from './geminiService';

describe('Document Classification', () => {
  describe('Financial Documents', () => {
    it('should classify ETF charts as FINANCIAL_MARKET', async () => {
      const mockFile = [{ text: 'TATSILV ETF RSI MACD chart' }];
      const result = await analyzeDocumentStructure(mockFile);
      
      expect(result.category).toBe('FINANCIAL_MARKET');
      expect(result.metadata.confidence).toBeGreaterThan(0.8);
    });
    
    it('should extract stock tickers from content', async () => {
      const mockFile = [{ text: 'Analysis of NIFTY and SENSEX' }];
      const result = await analyzeDocumentStructure(mockFile);
      
      expect(result.metadata.entities).toContain('NIFTY');
      expect(result.metadata.entities).toContain('SENSEX');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test geminiService.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode (re-run on file changes)
npm test -- --watch
```

### Test Coverage Requirements

- **New Features**: Minimum 80% coverage
- **Bug Fixes**: Add test that reproduces the bug
- **Critical Paths**: 100% coverage for authentication, payment, data integrity

---

## Documentation

### Code Documentation

- **Public APIs**: Must have JSDoc comments
- **Complex Logic**: Inline comments explaining why, not what
- **Examples**: Provide usage examples for non-trivial functions

### README Updates

When adding features, update:
- Feature list
- API documentation
- Usage examples
- Configuration options

### Architecture Documentation

For architectural changes:
- Update architecture diagrams
- Document design decisions
- Explain trade-offs

---

## License

By contributing to SRE Synapse, you agree that your contributions will be licensed under the Apache License 2.0.

---

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: contribute@futuretechvision.in

---

Thank you for contributing to SRE Synapse! 🚀

# Contributing to GitHub Push Workflow

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/YOUR_USERNAME/git-github-workflow/issues) to avoid duplicates
2. Use the issue template
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Git version, etc.)

### Suggesting Features

1. Open an issue with the "enhancement" label
2. Describe the feature and its use case
3. Explain why it would benefit users

### Submitting Pull Requests

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/git-github-workflow.git
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make changes** and commit:
   ```bash
   git commit -m "feat: Add your feature description"
   ```
5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against `main`

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Type     | Description                          |
|----------|--------------------------------------|
| `feat`   | New feature                          |
| `fix`    | Bug fix                              |
| `docs`   | Documentation changes                |
| `style`  | Formatting (no code change)          |
| `refactor` | Code restructuring                 |
| `test`   | Adding/updating tests                |
| `chore`  | Maintenance tasks                    |

**Examples:**
- `feat: Add Windows PowerShell setup script`
- `fix: Resolve SSH key detection on Linux`
- `docs: Clarify branch renaming steps`

## Code Style

- Run `npm run lint` before committing
- Run `npm run format` to auto-format code
- Keep documentation clear and beginner-friendly

## Testing Your Changes

1. Test scripts on your local machine
2. Verify README renders correctly
3. Check links are not broken

## Code of Conduct

Be respectful and constructive. We're all here to learn and help each other.

## Questions?

Open an issue with the "question" label or reach out via discussions.

---

Thank you for contributing! 🎉

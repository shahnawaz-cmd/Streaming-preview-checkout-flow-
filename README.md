# Streaming Preview Checkout Flow Automation

End-to-end (E2E) automation testing for streaming checkout flows using **Playwright**.

## Features
- Automated checkout flow testing, including PayPal scenarios.
- Page Object Model (POM) pattern for maintainable tests.
- CI/CD integration via GitHub Actions.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shahnawaz-cmd/Streaming-preview-checkout-flow-
   cd Streaming-preview-checkout-flow-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running Tests

Run all tests:

```bash
npx playwright test
```

Run tests with UI (useful for debugging):

```bash
npx playwright test --ui
```

Run a specific test:

```bash
npx playwright test tests/streaming-e2e.spec.js
```

## Project Structure

- `tests/`: Contains E2E test specs and Page Object Model files (`tests/pages/`).
- `playwright.config.js`: Playwright configuration.
- `.github/workflows/`: CI pipeline configurations.

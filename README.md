# ChairAI

## Project Description

ChairAI is an innovative web platform that connects creative furniture ideas with artisanal craftsmanship. It addresses the difficulty of visualizing unique furniture concepts and the challenge of finding a qualified artisan to bring them to life.

Using an AI image generator (text-to-image), users can create visualizations of their dream furniture. Based on the generated image, they can then create a listing on a marketplace where verified artisans can submit their bids. ChairAI aims to simplify and structure the process from idea to finalization, building trust and transparency between clients and artisans.

## Tech Stack

- **Framework:** [Astro 5](https://astro.build/)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/)
- **Backend & DB:** [Supabase](https://supabase.com/)
- **Node.js Version:** 22.14.0

## Getting Started Locally

### Prerequisites

- Node.js version `22.14.0`. We recommend using a version manager like `nvm`.

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/chairai.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd chairai
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```

### Running the Development Server

To start the local development server, run the following command:

```sh
npm run dev
```

Open your browser and navigate to `http://localhost:4321` to see the application.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase for errors.
- `npm run lint:fix`: Automatically fixes linting errors.
- `npm run format`: Formats the code using Prettier.
- `npm test`: Runs unit and integration tests in watch mode.
- `npm run test:run`: Runs tests once (CI mode).
- `npm run test:ui`: Runs tests with interactive UI.
- `npm run test:coverage`: Generates code coverage report.
- `npm run test:e2e`: Runs E2E tests using Playwright.
- `npm run test:e2e:ui`: Runs E2E tests in interactive UI mode.
- `npm run test:e2e:debug`: Runs E2E tests in debug mode.
- `npm run test:e2e:report`: Shows the test report.

## Testing

The project uses a comprehensive testing strategy:

### Unit & Integration Tests (Vitest + React Testing Library)

- Tests for utility functions, validation schemas, and API helpers
- Integration tests for React components
- See [tests/UNIT-INTEGRATION-TESTS.md](tests/UNIT-INTEGRATION-TESTS.md) for details

Quick start:

```sh
npm test                  # Watch mode
npm run test:ui          # Interactive UI
npm run test:coverage    # Coverage report
```

### End-to-End Tests (Playwright)

- Full user flow testing across multiple browsers
- See [TESTING.md](TESTING.md) for details

Quick start:

```sh
npm run test:e2e
```

## Project Scope (MVP)

### Included Features:

- **Full User Flow:** From AI image generation to accepting an artisan's offer.
- **User Authentication:** Separate registration and profiles for "Client" and "Artisan" roles.
- **AI Image Generation:** A limit of 10 free generations per client account.
- **Marketplace:** Artisans can browse and bid on open projects.
- **Communication:** An external chat API is used for communication after an offer is accepted.
- **Rating System:** A two-way rating and review system is activated upon project completion.
- **Project History:** Users can track their prompt history, generated images, and accepted quotes.

### Excluded Features:

- Integrated payment processing.
- Monetization features (e.g., commissions, paid plans).
- Advanced image editing tools.
- A native, built-in chat system.
- Advanced verification for artisan portfolios.
- Native mobile applications.

## Project Status

This project is currently in the **MVP development phase**.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

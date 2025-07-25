# E-Commerce API

This is a modern, fast, and scalable E-Commerce backend built with Node.js and Fastify.

> **Developer's Note:** This project is currently in its early stages. I'll be committing changes and adding features regularly. The structure and documentation will evolve as the project grows.

## Core Technologies

This project is built with a modern and robust set of technologies to ensure performance, security, and a great developer experience:

*   **Backend:** [Node.js](https://nodejs.org/)
*   **Framework:** [Fastify](https://www.fastify.io/) - for its high performance and low overhead.
*   **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for object data modeling.
*   **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) using `@fastify/jwt` for secure, stateless authentication.
*   **Security:**
*   Password hashing with `argon2` for its strong, modern, and configurable hashing algorithm.
*   Essential security headers via `@fastify/helmet`.
*   Cross-Origin Resource Sharing (CORS) managed by `@fastify/cors`.
*   Rate limiting to prevent abuse, using `@fastify/rate-limit` with Redis.
*   **Email:** Email verification and notifications using Nodemailer.
*   **Caching & Temporary Storage:** Redis for rate limiting and temporary user data during email verification.
*   **Development:**
*   `nodemon` for automatic server restarts during development, making the workflow smoother.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You'll need to have these installed on your machine:
*   Node.js (v20 or higher is recommended)
*   npm (or your preferred package manager like yarn or pnpm)
*   A running MongoDB instance (local or cloud)
*   A running Redis instance (local or cloud)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd E-Commerce
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. The application uses `@fastify/env` to load these variables, so they are essential for configuration.

    Here's an example `.env` file to get you started:
    ```ini
    PORT=3000
    APP_URL=http://localhost:3000

    # Database
    MONGO_URI=mongodb://localhost:27017/ecommerce
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_KEY=your-redis-password

    # Security
    JWT_KEY=aVeryStrongAndSecretKeyThatYouShouldChange
    ARGON2_MEMORY_COST=65536
    ARGON2_TIME_COST=3
    ARGON2_PARALLELISM=4

    # Email (e.g., using Gmail for development)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your.email@gmail.com
    SMTP_PASS=your-google-app-password
    SMTP_FROM="Your Store <your.email@gmail.com>"
    ```

4.  **Run the development server:**
    I've set up a script to run the server with `nodemon` for a better development experience.
    ```bash
    npm run dev
    ```
    The server should now be running on `http://localhost:3000` (or the port you specified).

---

## Project Structure

The project follows a feature-based, scalable structure for a Fastify API:

```
/
├── src/
│   ├── api/
│   │   ├── controllers/  # Business logic for routes
│   │   ├── models/       # Mongoose schemas (e.g., User.js, Product.js)
│   │   └── routes/       # Route definitions
│   ├── plugins/          # Fastify plugins (e.g., database connection, auth)
│   └── app.js            # Main Fastify server setup
├── .env                  # Environment variables
├── .gitignore
└── package.json
```

## API Endpoints

*(This section will be updated with detailed API documentation as endpoints are developed. It will include information on request/response formats, required parameters, and authentication.)*


This README will be updated as the project moves closer to completion!
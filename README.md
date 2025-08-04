# E-Commerce API

This is a high-performance, secure, and scalable E-Commerce backend built with Node.js and Fastify. It provides all the foundational features required for a modern online store, from user authentication to order processing.

## Key Features

*   **High-Performance & Scalable:** Built on [Fastify](https://www.fastify.io/), one of the fastest Node.js frameworks available. It's designed to handle high traffic with minimal overhead, ensuring a smooth user experience.
*   **Secure by Design:** Security is a top priority. The API includes:
    *   Stateless authentication with **JSON Web Tokens (JWT)**.
    *   Strong password hashing using **Argon2**.
    *   Essential security headers via **`@fastify/helmet`**.
    *   Protection against abuse with **CORS** and **rate-limiting**.
*   **Complete E-commerce Workflow:** The core logic for user registration, product management, cart functionality, and order placement is ready to go.
*   **Payment Integration:** Includes a Stripe integration for processing payments, a critical component for any real-world e-commerce platform.
*   **Transactional Emails:** Uses Nodemailer for sending automated emails like order confirmations, keeping customers informed.
*   **Optimized for Performance:** Leverages an in-memory Redis cache for efficient rate-limiting and temporary data storage, reducing database load.

## Technology Stack

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
*   **Caching & In-Memory Storage:** Redis for rate limiting and temporary user data during email verification.
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
    git clone https://github.com/AlphaTechini/E-Commerce.git
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

The API provides a full suite of endpoints for managing users, products, carts, and orders. For the next steps, I plan to document these endpoints using a tool like Swagger or Postman to make them easy to test and integrate with a frontend.
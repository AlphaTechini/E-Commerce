# E-Commerce API

This is the beginning of a new E-Commerce backend project. I'm building it to be modern, fast, and scalable using Node.js and Fastify.

> **Developer's Note:** This project is currently in its early stages. I'll be committing changes and adding features regularly. The structure and documentation will evolve as the project grows.

## Core Technologies

I'm building this project with a modern and robust set of technologies to ensure performance and security:

*   **Backend:** [Node.js](https://nodejs.org/)
*   **Framework:** [Fastify](https://www.fastify.io/) - for its high performance and low overhead.
*   **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for object data modeling.
*   **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) using `@fastify/jwt` for secure, stateless authentication.
*   **Security:**
*   Password hashing with `argon2` for its strong, modern, and configurable hashing algorithm.
    *   Essential security headers via `@fastify/helmet`.
    *   Cross-Origin Resource Sharing (CORS) managed by `@fastify/cors`.
    *   Rate limiting to prevent abuse, using `@fastify/rate-limit`.
*   **Development:**
    *   `nodemon` for automatic server restarts during development, making the workflow smoother.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You'll need to have these installed on your machine:
*   Node.js (v18 or higher is recommended)
*   npm (or your preferred package manager like yarn or pnpm)
*   A running MongoDB instance (local or cloud)

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
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/ecommerce
    JWT_SECRET=aVeryStrongAndSecretKeyThatYouShouldChange
    ```

4.  **Run the development server:**
    I've set up a script to run the server with `nodemon` for a better development experience.
    ```bash
    npm run dev
    ```
    The server should now be running on `http://localhost:3000` (or whatever port you specified in your `.env` file).

---

## Project Structure

The project follows a standard, scalable structure for a Node.js API:

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

## Roadmap & Future Goals

This is the initial plan for the project's features. This list will grow and change as development progresses.

-   [ ] **User Authentication:** User registration, login, and JWT-based session management.
-   [ ] **Product Management:** Full CRUD operations for products, including categories and search.
-   [ ] **Shopping Cart:** Add, update, and remove items from the cart.
-   [ ] **Order Management:** Create orders from the cart and view order history.

---

**Reminder to self:** Keep this README updated as the project moves closer to completion!
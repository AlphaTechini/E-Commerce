# E-Commerce API

This is a high-performance, secure, and scalable E-Commerce backend built with Node.js and Fastify. It provides all the foundational features required for a modern online store, from user authentication to order processing.

## 🏗️ System Architecture

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   E-Commerce     │    │   External          │
│   (Any Client)  │◄──►│   API (Fastify)  │◄──►│   Services          │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                       │
         │                       │                       ├── Stripe Payment
         │                       │                       ├── Email Service
         │                       │                       └── Analytics
         │                       │
         │                       ├── Authentication Layer
         │                       ├── Rate Limiting Layer  
         │                       ├── Security Middleware
         │                       ├── Business Logic Layer
         │                       └── Data Access Layer
         │                               │
         │                               ├── MongoDB (Primary)
         │                               └── Redis (Cache/Rate Limit)
```

### Data Flow Architecture

**User Registration Flow:**
1. Frontend → POST /auth/register → Validation → Argon2 Hash → MongoDB → JWT Token → Email Verification → Redis Cache (verification token)

**Order Processing Flow:**  
1. Frontend → POST /cart/checkout → Auth Validation → Inventory Check → Payment Intent (Stripe) → Order Creation → MongoDB → Email Notification → Webhook Processing

**Security Layers:**
- **Network Layer**: CORS, Rate Limiting, IP Filtering
- **Application Layer**: JWT Validation, Input Sanitization, Role-Based Access Control  
- **Data Layer**: Encryption at Rest, Secure Connection Strings, Parameterized Queries

## 🔒 Security Architecture

### Threat Model

**High-Risk Threats:**
- **Payment Data Exposure**: Credit card information interception during transmission
- **Account Takeover**: Credential stuffing, session hijacking, password reset abuse
- **Inventory Manipulation**: Race conditions in stock management, price tampering
- **API Abuse**: DDoS attacks, automated scraping, brute force attacks
- **Data Exfiltration**: Unauthorized access to customer PII, order history

**Medium-Risk Threats:**
- **Email Injection**: Malicious content in order confirmations
- **CORS Misconfiguration**: Unauthorized domain access to API endpoints  
- **Dependency Vulnerabilities**: Outdated packages with known exploits
- **Configuration Leaks**: Environment variables exposed in logs or error messages

### Security Implementation

**Authentication & Authorization:**
- **JWT with Strong Claims**: User ID, role, expiration, issued-at timestamp
- **Refresh Token Rotation**: Automatic token rotation on each use
- **Multi-Factor Authentication Ready**: Extensible architecture for MFA integration
- **Role-Based Access Control**: Granular permissions for admin, customer, guest roles

**Data Protection:**
- **Encryption at Rest**: MongoDB encryption for sensitive fields (PII, payment tokens)
- **Secure Password Storage**: Argon2 with configurable memory/time costs
- **Input Validation**: Comprehensive schema validation using Fastify's built-in validators
- **Output Sanitization**: Prevent XSS in email templates and API responses

**Network Security:**
- **Rate Limiting**: Redis-backed rate limiting with sliding window algorithm
- **CORS Policy**: Strict origin whitelisting with credentials support
- **Security Headers**: Helmet middleware with CSP, XSS protection, frame options
- **TLS Enforcement**: HTTPS-only communication in production

## 🛡️ Fault Tolerance Deep Dive

### Failure Scenarios & Mitigation

**Database Failures:**
- **MongoDB Connection Loss**: Circuit breaker pattern with exponential backoff
- **Query Timeouts**: Configurable query timeouts with fallback responses
- **Replica Set Failover**: Automatic primary election handling
- **Data Corruption**: Regular backups with point-in-time recovery capability

**External Service Failures:**
- **Stripe API Downtime**: Payment intent caching with retry queue
- **Email Service Outage**: Local email queue with delivery confirmation
- **Redis Cache Loss**: Graceful degradation to database-only operations
- **Webhook Delivery Failures**: Retry mechanism with dead letter queue

**Application Failures:**
- **Memory Leaks**: Memory usage monitoring with automatic restart thresholds
- **Unhandled Exceptions**: Global error handler with structured logging
- **Race Conditions**: Optimistic locking for inventory updates
- **Deadlocks**: Timeout-based transaction management

### Exactly-Once Delivery Semantics

**Payment Processing:**
- **Idempotency Keys**: Stripe idempotency keys for duplicate prevention
- **Transaction Logging**: Atomic order creation with payment status tracking
- **Reconciliation Jobs**: Daily reconciliation between orders and payments
- **Compensating Transactions**: Automatic refunds for failed order completions

**Email Notifications:**
- **Deduplication**: Redis-set based email deduplication by order ID
- **Delivery Confirmation**: Webhook-based delivery confirmation tracking
- **Retry Strategy**: Exponential backoff with maximum retry limits
- **Fallback Channels**: SMS notifications for critical order updates

## 📊 Operational Excellence

### Monitoring & Observability

**Key Metrics Dashboard:**
- **API Performance**: Request rate, response time percentiles, error rates
- **Business Metrics**: Conversion rate, average order value, cart abandonment rate  
- **Infrastructure Health**: CPU/memory usage, database connection pool, cache hit ratio
- **Security Metrics**: Failed login attempts, blocked requests, suspicious activity

**Alerting Thresholds:**
- **Critical**: Payment failure rate > 5%, API error rate > 1%, Database latency > 500ms
- **Warning**: Memory usage > 80%, Cache hit ratio < 90%, Queue depth > 100
- **Info**: New user registrations, Daily revenue, Inventory low stock alerts

**Logging Strategy:**
- **Structured JSON Logs**: Correlation IDs for request tracing
- **PII Redaction**: Automatic redaction of sensitive data in logs
- **Log Retention**: 30-day retention for application logs, 90-day for audit logs
- **Centralized Logging**: ELK stack or Cloud Logging integration ready

### Backup & Recovery

**Backup Strategy:**
- **Database Backups**: Daily full backups + hourly incremental backups
- **Configuration Backups**: Version-controlled environment configurations
- **Static Assets**: CDN-backed asset storage with versioning
- **Encryption Keys**: Secure key management with rotation capability

**Disaster Recovery:**
- **RTO/RPO**: 4-hour RTO, 1-hour RPO for critical systems
- **Geographic Redundancy**: Multi-region deployment capability
- **Manual Override**: Emergency maintenance mode with admin override
- **Rollback Procedures**: Automated rollback to last known good state

### Capacity Planning

**Scalability Guidelines:**
- **Horizontal Scaling**: Stateless API layer with load balancer support
- **Database Sharding**: Customer-based sharding strategy for large datasets
- **Cache Strategy**: Multi-level caching (Redis + CDN) for high-traffic scenarios
- **Queue Management**: Async processing for non-critical operations

**Performance Benchmarks:**
- **Baseline**: 1000 concurrent users, 50ms p95 response time
- **Peak Load**: 10,000 concurrent users during flash sales
- **Payment Processing**: 100 transactions per second sustained throughput
- **Search Performance**: < 200ms product search response time

## 🚀 Scaling Patterns

### Horizontal Scaling Strategy

**Stateless API Layer:**
- **Container Orchestration**: Kubernetes-ready with health checks and auto-scaling
- **Load Balancing**: Round-robin with sticky sessions for cart persistence
- **Health Checks**: Liveness and readiness probes for orchestration
- **Graceful Shutdown**: Connection draining during pod termination

**Database Scaling:**
- **Read Replicas**: Separate read replicas for reporting and analytics queries
- **Connection Pooling**: Optimized connection pooling with circuit breaking
- **Index Optimization**: Query performance monitoring with index recommendations
- **Archive Strategy**: Cold data archiving for historical orders

**Cache Layer:**
- **Redis Cluster**: Multi-node Redis cluster for high availability
- **Cache Invalidation**: Event-driven cache invalidation for product updates
- **Fallback Strategy**: Graceful degradation when cache is unavailable
- **Memory Management**: LRU eviction policy with memory pressure monitoring

### Queue-Based Processing

**Async Operations:**
- **Order Processing**: Background job queue for order fulfillment
- **Email Delivery**: Dedicated email queue with delivery confirmation
- **Analytics Processing**: Event stream for real-time analytics
- **Image Processing**: Background image optimization and CDN upload

**Queue Architecture:**
- **Priority Queues**: High-priority queues for payment processing
- **Dead Letter Queues**: Failed message handling with manual intervention
- **Batch Processing**: Bulk operations for efficiency during off-peak hours
- **Rate Limiting**: Queue-based rate limiting for external API calls

## 🔌 Integration Patterns

### Payment Gateway Integration

**Stripe Integration Pattern:**
```javascript
// Payment Intent Creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: orderTotal,
  currency: 'usd',
  metadata: { orderId: orderId },
  idempotency_key: `order_${orderId}_${Date.now()}`,
});

// Webhook Handling
app.post('/webhooks/stripe', async (request, reply) => {
  const sig = request.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await processSuccessfulPayment(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
  }
});
```

**Multi-Gateway Support:**
- **Abstract Payment Interface**: Pluggable payment gateway architecture
- **Gateway Selection**: Dynamic gateway selection based on region/currency
- **Fallback Mechanism**: Automatic fallback to alternative gateways
- **Unified Reporting**: Consolidated payment reporting across gateways

### Email Service Integration

**Transactional Email Pattern:**
```javascript
// Email Template System
const emailTemplates = {
  orderConfirmation: {
    subject: 'Your Order #{{orderId}} is Confirmed!',
    template: 'order-confirmation.hbs',
    priority: 'high'
  },
  passwordReset: {
    subject: 'Password Reset Request',
    template: 'password-reset.hbs', 
    priority: 'medium'
  }
};

// Queue-Based Email Delivery
await emailQueue.add('sendEmail', {
  template: 'orderConfirmation',
  data: { orderId, customerName, items },
  to: customerEmail
}, { priority: 'high' });
```

**Multi-Provider Support:**
- **Provider Abstraction**: Generic email service interface
- **Provider Selection**: Configurable provider selection (SendGrid, Mailgun, SES)
- **Delivery Tracking**: Webhook-based delivery confirmation
- **Template Management**: Centralized template management with versioning

### Frontend Integration

**CORS Configuration:**
```javascript
// Secure CORS Configuration
app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

**Authentication Flow:**
- **Token Refresh**: Automatic token refresh before expiration
- **Session Management**: Secure cookie-based session management
- **CSRF Protection**: Anti-CSRF tokens for state-changing operations
- **Mobile Support**: OAuth2-compatible authentication for mobile apps

## 🧪 Testing Strategy

### Test Coverage Requirements

**Unit Tests:**
- **Business Logic**: 90% coverage for core business logic
- **Validation**: 100% coverage for input validation schemas
- **Security**: 100% coverage for authentication and authorization logic
- **Integration Points**: Mock-based testing for external service integrations

**Integration Tests:**
- **API Endpoints**: Full HTTP request/response testing
- **Database Operations**: Real database testing with test data isolation
- **External Services**: Contract testing with external service mocks
- **Error Scenarios**: Comprehensive error handling validation

**Performance Tests:**
- **Load Testing**: Simulated peak traffic scenarios
- **Stress Testing**: Resource exhaustion scenarios
- **Soak Testing**: Long-running stability tests
- **Security Testing**: Penetration testing and vulnerability scanning

## 🚨 Incident Response

### Runbooks

**Payment Processing Failure:**
1. **Detection**: Monitor payment failure rate alerts
2. **Isolation**: Disable affected payment gateway if necessary
3. **Communication**: Notify customers of payment issues
4. **Resolution**: Work with payment provider to resolve issues
5. **Recovery**: Process queued orders once resolved

**Security Breach:**
1. **Containment**: Isolate affected systems immediately
2. **Assessment**: Determine scope and impact of breach
3. **Notification**: Legal notification requirements for data breaches
4. **Remediation**: Patch vulnerabilities and strengthen security
5. **Review**: Post-incident review and process improvement

**Database Performance Degradation:**
1. **Monitoring**: Detect slow query patterns and high CPU usage
2. **Optimization**: Add missing indexes and optimize queries
3. **Scaling**: Scale database resources if necessary
4. **Caching**: Implement additional caching layers
5. **Fallback**: Enable read-only mode if write performance critical

---

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
# Event-Driven Coupon Validation Logging System

## Architecture Overview

Implement asynchronous coupon validation logging using Redis as a message broker to decouple logging from the main API flow, ensuring high performance and scalability.

## Implementation Approach

### 1. **Event Publisher (API Layer)**

- Publish validation events to Redis queue immediately after validation logic
- Use Redis LPUSH to add events to `coupon_validation_events` queue
- Include event payload: `{ coupon_code, user_id, validation_status, timestamp, metadata }`
- Non-blocking operation - API responds immediately without waiting for logging

### 2. **Redis Message Broker Setup**

- Configure Redis as message queue with persistence enabled
- Use Redis Lists for simple FIFO queue implementation
- Set up Redis connection pooling for high throughput
- Configure appropriate memory policies and TTL for event retention

### 3. **Event Consumer (Background Worker)**

- Separate Node.js worker process using `BRPOP` to consume events from Redis
- Process events in batches for database efficiency
- Implement retry mechanism with exponential backoff for failed writes
- Use worker clustering for horizontal scaling

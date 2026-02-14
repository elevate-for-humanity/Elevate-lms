# API Documentation

**Platform:** Elevate for Humanity Workforce Marketplace  
**Version:** 2.0.0  
**Base URL:** `https://www.elevateforhumanity.org/api`  
**Last Updated:** January 4, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core APIs](#core-apis)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Webhooks](#webhooks)

---

## Overview

### API Architecture

- **Type:** RESTful API
- **Format:** JSON
- **Runtime:** Edge (Netlify)
- **Authentication:** JWT Bearer tokens
- **Total Endpoints:** 200+

### Base URLs

- **Production:** `https://www.elevateforhumanity.org/api`
- **Development:** `http://localhost:3000/api`

### Request Format

```http
POST /api/endpoint HTTP/1.1
Host: www.elevateforhumanity.org
Content-Type: application/json
Authorization: Bearer <token>

{
  "key": "value"
}
```

### Response Format

```json
{
  "data": {},
  "error": null,
  "timestamp": "2026-01-04T21:00:00.000Z"
}
```

---

## Authentication

### Overview

Authentication uses Supabase Auth with JWT tokens stored in HTTP-only cookies.

### Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Signup

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "student"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Verification email sent"
}
```

### Logout

**Endpoint:** `POST /api/auth/logout`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Get Session

**Endpoint:** `GET /api/auth/session`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student"
  },
  "session": {
    "expires_at": "2026-01-05T21:00:00.000Z"
  }
}
```

---

## Core APIs

### Courses

#### List Courses

**Endpoint:** `GET /api/courses`

**Query Parameters:**
- `status` - Filter by status (published, draft, archived)
- `level` - Filter by level (beginner, intermediate, advanced)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Request:**
```http
GET /api/courses?status=published&level=beginner&page=1&limit=20
```

**Response:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "slug": "cna-training",
      "title": "Certified Nursing Assistant Training",
      "subtitle": "Start your healthcare career",
      "description": "Complete CNA training program...",
      "instructor_id": "uuid",
      "instructor_name": "Jane Smith",
      "thumbnail_url": "/images/cna.jpg",
      "price": 0,
      "is_free": true,
      "level": "beginner",
      "duration_hours": 120,
      "status": "published",
      "enrollment_count": 150,
      "rating_average": 4.8,
      "rating_count": 45,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

#### Get Course

**Endpoint:** `GET /api/courses/[courseId]`

**Response:**
```json
{
  "course": {
    "id": "uuid",
    "slug": "cna-training",
    "title": "Certified Nursing Assistant Training",
    "description": "Complete CNA training program...",
    "modules": [
      {
        "id": "uuid",
        "title": "Introduction to Patient Care",
        "order_index": 1,
        "lessons": [
          {
            "id": "uuid",
            "title": "Patient Safety",
            "content_type": "video",
            "duration_minutes": 30,
            "order_index": 1
          }
        ]
      }
    ]
  }
}
```

#### Create Course (Admin)

**Endpoint:** `POST /api/courses`

**Request:**
```json
{
  "title": "New Course",
  "subtitle": "Course subtitle",
  "description": "Course description",
  "level": "beginner",
  "duration_hours": 40,
  "price": 0,
  "is_free": true,
  "status": "draft"
}
```

**Response:**
```json
{
  "course": {
    "id": "uuid",
    "slug": "new-course",
    "title": "New Course",
    "status": "draft",
    "created_at": "2026-01-04T21:00:00.000Z"
  }
}
```

### Enrollments

#### List Enrollments

**Endpoint:** `GET /api/enrollments`

**Response:**
```json
{
  "enrollments": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "course_id": "uuid",
      "status": "active",
      "progress_percentage": 65,
      "enrolled_at": "2026-01-01T00:00:00.000Z",
      "courses": {
        "id": "uuid",
        "title": "CNA Training",
        "duration_hours": 120
      }
    }
  ]
}
```

#### Create Enrollment

**Endpoint:** `POST /api/enrollments`

**Request:**
```json
{
  "courseId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "course_id": "uuid",
  "status": "active",
  "progress_percentage": 0,
  "enrolled_at": "2026-01-04T21:00:00.000Z"
}
```

**Error Response (Already Enrolled):**
```json
{
  "error": "Already enrolled in this course"
}
```

### Progress

#### Get Progress

**Endpoint:** `GET /api/progress?userId=uuid&courseId=uuid`

**Response:**
```json
{
  "userId": "uuid",
  "courseId": "uuid",
  "overallProgress": 65,
  "completedLessons": 13,
  "totalLessons": 20,
  "timeSpent": 1250,
  "lastActivity": "2026-01-04T21:00:00.000Z",
  "modules": [
    {
      "id": "uuid",
      "title": "Introduction to Patient Care",
      "progress": 100,
      "status": "completed",
      "lessons": 5,
      "completedLessons": 5
    }
  ]
}
```

#### Update Progress

**Endpoint:** `POST /api/progress`

**Request:**
```json
{
  "userId": "uuid",
  "courseId": "uuid",
  "lessonId": "uuid",
  "status": "completed"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "courseId": "uuid",
  "lessonId": "uuid",
  "status": "completed",
  "updatedAt": "2026-01-04T21:00:00.000Z"
}
```

### Payments

#### Create Checkout Session

**Endpoint:** `POST /api/stripe/create-checkout-session`

**Request:**
```json
{
  "courseId": "uuid",
  "priceId": "price_xxx",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx"
}
```

#### Stripe Webhook

**Endpoint:** `POST /api/stripe/webhook`

**Headers:**
```
stripe-signature: t=xxx,v1=xxx
```

**Events Handled:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.failed`
- `charge.refunded`

**Response:**
```json
{
  "received": true
}
```

### Partner APIs

#### Partner Enrollment

**Endpoint:** `POST /api/partner/enroll`

**Request:**
```json
{
  "studentEmail": "student@example.com",
  "courseId": "uuid",
  "partnerCode": "PARTNER123"
}
```

**Response:**
```json
{
  "enrollment": {
    "id": "uuid",
    "student_id": "uuid",
    "course_id": "uuid",
    "partner_id": "uuid",
    "status": "active"
  }
}
```

#### Partner Attendance

**Endpoint:** `POST /api/partner/attendance`

**Request:**
```json
{
  "enrollmentId": "uuid",
  "date": "2026-01-04",
  "status": "present",
  "notes": "Completed module 1"
}
```

**Response:**
```json
{
  "attendance": {
    "id": "uuid",
    "enrollment_id": "uuid",
    "date": "2026-01-04",
    "status": "present",
    "recorded_at": "2026-01-04T21:00:00.000Z"
  }
}
```

### Admin APIs

#### Get All Students

**Endpoint:** `GET /api/admin/students`

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search by name or email
- `status` - Filter by status

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "full_name": "John Doe",
      "role": "student",
      "created_at": "2026-01-01T00:00:00.000Z",
      "enrollments_count": 3,
      "completed_courses": 1
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

#### Generate Report

**Endpoint:** `POST /api/admin/reports/generate`

**Request:**
```json
{
  "type": "wioa_compliance",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "format": "pdf"
}
```

**Response:**
```json
{
  "report": {
    "id": "uuid",
    "type": "wioa_compliance",
    "status": "generating",
    "downloadUrl": null
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2026-01-04T21:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Errors

#### Unauthorized

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "status": 401
}
```

#### Validation Error

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  },
  "status": 422
}
```

#### Not Found

```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "status": 404
}
```

#### Rate Limit Exceeded

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "status": 429
}
```

---

## Rate Limiting

### Limits

- **Anonymous:** 100 requests per 15 minutes
- **Authenticated:** 1000 requests per 15 minutes
- **Admin:** 5000 requests per 15 minutes

### Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704398400
```

### Handling Rate Limits

```javascript
const response = await fetch('/api/endpoint');

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  // Wait and retry
}
```

---

## Webhooks

### Stripe Webhooks

**Endpoint:** `POST /api/stripe/webhook`

**Events:**
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment processed
- `payment_intent.failed` - Payment failed
- `charge.refunded` - Refund processed

**Verification:**
```javascript
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Custom Webhooks

**Endpoint:** `POST /api/webhooks/[provider]`

**Headers:**
```
X-Webhook-Signature: signature
X-Webhook-Timestamp: timestamp
```

**Verification:**
```javascript
const signature = request.headers.get('X-Webhook-Signature');
const timestamp = request.headers.get('X-Webhook-Timestamp');
const isValid = verifyWebhookSignature(body, signature, timestamp);
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize client
const client = {
  baseUrl: 'https://www.elevateforhumanity.org/api',
  token: 'your_jwt_token'
};

// Get courses
async function getCourses() {
  const response = await fetch(`${client.baseUrl}/courses`, {
    headers: {
      'Authorization': `Bearer ${client.token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Create enrollment
async function createEnrollment(courseId: string) {
  const response = await fetch(`${client.baseUrl}/enrollments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${client.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ courseId })
  });
  return response.json();
}
```

### Python

```python
import requests

class ElevateClient:
    def __init__(self, token):
        self.base_url = 'https://www.elevateforhumanity.org/api'
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_courses(self):
        response = requests.get(
            f'{self.base_url}/courses',
            headers=self.headers
        )
        return response.json()
    
    def create_enrollment(self, course_id):
        response = requests.post(
            f'{self.base_url}/enrollments',
            headers=self.headers,
            json={'courseId': course_id}
        )
        return response.json()
```

### cURL

```bash
# Get courses
curl -X GET https://www.elevateforhumanity.org/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create enrollment
curl -X POST https://www.elevateforhumanity.org/api/enrollments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "uuid"}'
```

---

## Testing

### Test Environment

**Base URL:** `http://localhost:3000/api`

### Test Accounts

```
Student:
  Email: student@test.com
  Password: Test123!

Instructor:
  Email: instructor@test.com
  Password: Test123!

Admin:
  Email: admin@test.com
  Password: Test123!
```

### Postman Collection

Import the Postman collection:
```
https://www.elevateforhumanity.org/api/postman-collection.json
```

---

## Changelog

### Version 2.0.0 (2026-01-04)
- Initial API documentation
- 200+ endpoints documented
- Authentication flow documented
- Error handling standardized

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Maintained By:** Engineering Team

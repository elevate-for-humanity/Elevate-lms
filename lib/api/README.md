# API Error Handling Guide

## Quick Start

All new API routes should use the `withErrorHandling` wrapper:

```typescript
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api/error-handler';

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();

  // Your logic here
  const result = await someOperation(body);

  return successResponse(result);
});
```

## Benefits

✅ Automatic error catching and logging  
✅ Consistent error responses  
✅ User-friendly error messages  
✅ No exposed stack traces  
✅ Handles common error types automatically

## Examples

### Basic GET Route

```typescript
export const GET = withErrorHandling(async (req: Request) => {
  const data = await fetchData();
  return successResponse(data);
});
```

### POST with Validation

```typescript
import { withErrorHandling, validateRequired, errorResponse } from '@/lib/api/error-handler';

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();

  const validationError = validateRequired(body, ['name', 'email']);
  if (validationError) {
    return errorResponse(validationError, 400);
  }

  const result = await createUser(body);
  return successResponse(result, 201);
});
```

### With Authentication

```typescript
export const POST = withErrorHandling(async (req: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse('Unauthorized', 401);
  }

  // Your authenticated logic
  return successResponse({ success: true });
});
```

## Error Types Handled Automatically

- **Duplicate Key**: Returns 409 Conflict
- **Foreign Key**: Returns 400 Bad Request
- **Not Found**: Returns 404 Not Found
- **Unauthorized**: Returns 401 Unauthorized
- **Forbidden**: Returns 403 Forbidden
- **All Others**: Returns 500 Internal Server Error

## Migration Guide

### Before (No Error Handling)

```typescript
export async function POST(req: Request) {
  const body = await req.json(); // Can throw!
  const result = await db.insert(body); // Can throw!
  return NextResponse.json(result);
}
```

### After (With Error Handling)

```typescript
export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json();
  const result = await db.insert(body);
  return successResponse(result);
});
```

## Best Practices

1. **Always use withErrorHandling** for new routes
2. **Use successResponse/errorResponse** for consistent formatting
3. **Validate input** before processing
4. **Log errors** with context (already done by wrapper)
5. **Never expose** sensitive error details to users

## Testing

```typescript
// Test error handling
const response = await POST(
  new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ invalid: 'data' }),
  }),
);

expect(response.status).toBe(400);
const json = await response.json();
expect(json.error).toBeDefined();
```

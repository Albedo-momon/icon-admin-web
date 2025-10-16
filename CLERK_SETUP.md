# Clerk JWT Authentication Setup

This document outlines the steps to configure Clerk for JWT authentication with the Icon Admin application.

## Prerequisites

1. A Clerk account and application set up
2. Access to the Clerk Dashboard

## Configuration Steps

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
VITE_CLERK_JWT_TEMPLATE_NAME=icon-admin-api
```

### 2. Clerk Dashboard Configuration

#### Create JWT Template

1. Go to your Clerk Dashboard
2. Navigate to **JWT Templates** in the sidebar
3. Click **New template**
4. Configure the template:
   - **Name**: `icon-admin-api` (or match your `VITE_CLERK_JWT_TEMPLATE_NAME`)
   - **Token lifetime**: 60 minutes (recommended)
   - **Claims**: Add the following custom claims:
     ```json
     {
       "sub": "{{user.id}}",
       "email": "{{user.primary_email_address.email_address}}",
       "name": "{{user.full_name}}",
       "iat": {{date.now}},
       "exp": {{date.now_plus_minutes(60)}}
     }
     ```

#### Configure Allowed Origins

1. In your Clerk Dashboard, go to **Domains**
2. Add your development and production domains:
   - `http://localhost:5173` (development)
   - Your production domain

### 3. Backend Configuration

Ensure your backend API is configured to:

1. **Verify JWT tokens** from Clerk using your Clerk secret key
2. **Accept the audience/template name** you configured
3. **Handle the `/auth/handshake` endpoint** to sync users
4. **Implement the `/me` endpoint** to return user profile with role

### 4. Testing the Integration

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Sign in with a test user
4. Check the browser's Network tab to verify:
   - JWT tokens are being attached to protected requests
   - `/auth/handshake` is called once after login
   - `/me` endpoint returns user profile with role

## Troubleshooting

### Common Issues

1. **"Missing Clerk Publishable Key" error**
   - Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in your `.env` file
   - Restart your development server after adding environment variables

2. **JWT token not being generated**
   - Verify the JWT template name matches between your environment variable and Clerk Dashboard
   - Check that the template is active in Clerk Dashboard

3. **401 Unauthorized errors**
   - Ensure your backend is properly configured to verify Clerk JWT tokens
   - Check that the JWT template includes the required claims

4. **Handshake failing**
   - Verify the `/auth/handshake` endpoint is implemented on your backend
   - Check that the endpoint accepts and processes Clerk JWT tokens

### Debug Tips

- Enable debug logging in the browser console to see authentication flow
- Use Clerk's Dashboard logs to monitor authentication events
- Check the JWT token payload using jwt.io to verify claims

## Security Notes

- Never expose your Clerk secret key in frontend code
- Use HTTPS in production
- Regularly rotate your Clerk keys
- Implement proper CORS configuration on your backend
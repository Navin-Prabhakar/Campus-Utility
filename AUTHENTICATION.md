# IIT Patna Student Authentication System

## Overview

This document describes the authentication system implemented for the Campus Utility app, which restricts access to IIT Patna students using their official college email addresses.

## Features Implemented

### 1. **Email-Based Authentication**
- Students must sign in using their IIT Patna email address
- Email format validation: `name_rollnumber@iitp.ac.in`
- Example: `navin_2503ai02@iitp.ac.in`

### 2. **Sign-In Flow**
- **Before Login**: Users see a "Sign In" button in the header
- **After Login**: Users see a profile button with their name/initials and a colored avatar
- **Sign-Out**: Users can click on the profile button to access a dropdown menu with sign-out option

### 3. **User Profile Display**
- Shows user's name extracted from their email
- Displays a colored avatar with user initials (first letter of first and last name)
- Consistent color generation based on email
- Includes email address in the profile tooltip

### 4. **Session Management**
- Secure session handling using NextAuth.js
- JWT-based token storage
- Automatic session refresh on page load
- Protected user data in session callbacks

## Technical Stack

- **Framework**: Next.js 16.2.6
- **Authentication**: next-auth v4.24.0
- **UI Framework**: React 19.2.4
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript 5

## Project Structure

```
campus-utility/
├── app/
│   ├── api/auth/
│   │   ├── [auth]/route.ts          # NextAuth API handler
│   │   ├── session/route.ts         # Session endpoint
│   │   └── signout/route.ts         # Sign-out endpoint
│   ├── components/
│   │   ├── Header.tsx               # Header with auth UI
│   │   ├── ProfileAvatar.tsx        # User avatar component
│   │   └── BottomTabs.tsx           # Navigation tabs
│   ├── signin/page.tsx              # Sign-in page
│   ├── page.tsx                     # Home page
│   ├── layout.tsx                   # Root layout with SessionProvider
│   ├── globals.css                  # Global styles
│   └── providers.tsx                # SessionProvider wrapper
├── types/
│   └── next-auth.d.ts              # TypeScript definitions
├── auth.ts                          # NextAuth configuration
├── .env.local                       # Environment variables
└── package.json                     # Dependencies
```

## Environment Variables

Create or update `.env.local` with:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
```

**Important**: For production, generate a strong secret using:
```bash
openssl rand -base64 32
```

## How It Works

### Sign-In Flow
1. User clicks "Sign In" button in the header
2. Navigates to `/signin` page
3. Enters their IIT Patna email (e.g., `name_21108001@iitp.ac.in`)
4. Email is validated against the regex pattern: `/^[a-zA-Z0-9._]+_\d+@iitp\.ac\.in$/`
5. If valid, a session is created with their user data
6. User is redirected to the home page

### User Data Extraction
From email `navin_2503ai02@iitp.ac.in`:
- **Name**: "navin" (extracted and capitalized)
- **Roll Number**: "2503ai02" (extracted but not currently used) 

### Session Management
- Sessions are managed via JWT tokens
- User data is stored in the JWT token
- Session data is available via `useSession()` hook in client components
- Automatic session refresh on page load

## Components

### Header.tsx
- Displays sign-in or profile button based on authentication status
- Shows user profile with avatar and name
- Dropdown menu with sign-out option
- Uses `useSession()` hook from next-auth

### ProfileAvatar.tsx
- Generates colored avatar with user initials
- Color is consistent based on user email
- Falls back to user image if available
- Supports multiple sizes (sm, md, lg)

### SignIn Page
- Email input with validation
- Error messages for invalid email format
- Loading state during sign-in
- Example email format display

## Authentication Flow Diagram

```
User visits app
    ↓
Header.tsx checks session via useSession()
    ↓
No session? → Show "Sign In" button
Session exists? → Show Profile button
    ↓
User clicks "Sign In"
    ↓
Navigates to /signin page
    ↓
User enters email
    ↓
Validates email format
    ↓
Valid? → Sign in via NextAuth
Invalid? → Show error message
    ↓
Session created
    ↓
Redirect to home page
    ↓
Header shows profile button
```

## Key Files and Functions

### auth.ts
- Credentials provider configuration
- Email validation logic
- JWT and session callbacks
- Session customization with user ID

### app/api/auth/[auth]/route.ts
- Main NextAuth API handler
- Handles all authentication endpoints

### app/api/auth/session/route.ts
- Returns current user session
- Used by client components to fetch session data

## Security Considerations

1. **Email Validation**: Only accepts emails matching IIT Patna domain
2. **CSRF Protection**: Handled by NextAuth automatically
3. **Secure Tokens**: JWT tokens used for session storage
4. **HTTPOnly Cookies**: Session cookies are HTTPOnly by default
5. **Environment Secrets**: NEXTAUTH_SECRET must be set in production

## Running the Application

### Development
```bash
npm install
npm run dev
```
App runs on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## Testing the Authentication

1. Start the dev server
2. Click "Sign In" button
3. Try these test emails:
   - Valid: `john_21108001@iitp.ac.in`
   - Valid: `alice_21104050@iitp.ac.in`
   - Invalid: `john@gmail.com` (wrong domain)
   - Invalid: `john_abc@iitp.ac.in` (roll number must be digits)

## Future Enhancements

- [ ] User profile page
- [ ] Profile picture upload
- [ ] Email verification
- [ ] OAuth2 with college authentication system
- [ ] Role-based access control
- [ ] User preferences and settings
- [ ] Audit logs

## Troubleshooting

### Session not persisting after page refresh
- Check if `.env.local` has `NEXTAUTH_SECRET` set
- Verify `NEXTAUTH_URL` matches your deployment URL

### Sign-in redirects to sign-in again
- Clear browser cookies
- Check browser console for CSRF errors
- Verify SessionProvider is wrapping the app in layout.tsx

### Email validation failing
- Ensure email format is exactly: `name_rollnumber@iitp.ac.in`
- Roll number must be all digits
- Domain must be exactly `iitp.ac.in`

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript with React](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html)

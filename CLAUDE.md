# Landing Page Builder

A Next.js TypeScript application for creating and managing landing pages with AI assistance, featuring comprehensive authentication (Google OAuth + Email/Password) and per-user data storage.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with auth-aware UI
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx           # Multi-provider login page
│   │   └── register/
│   │       └── page.tsx           # Email/password registration
│   ├── dashboard/
│   │   └── page.tsx               # Protected dashboard with user projects
│   ├── preview/
│   │   └── [id]/
│   │       └── page.tsx           # Landing page preview with SSR
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts       # NextAuth.js with multiple providers
│   │   │   └── register/
│   │   │       └── route.ts       # User registration API
│   │   └── projects/
│   │       └── route.ts           # User-specific projects API with landing page data
│   ├── layout.tsx                 # Root layout with session provider
│   └── globals.css                # Global styles
├── components/
│   ├── AuthProvider.tsx           # NextAuth session provider wrapper
│   └── landing-page/
│       ├── Navbar1.tsx            # Responsive navbar component
│       ├── Layout1.tsx            # Hero header section component
│       └── BlockRenderer.tsx      # Dynamic component renderer
├── lib/
│   └── userService.ts             # User management and authentication
└── types/
    └── next-auth.d.ts             # TypeScript declarations for NextAuth
```

## Features

### Authentication System
- **Dual Authentication Methods**:
  - **Google OAuth**: Secure sign-in with Google accounts
  - **Email/Password**: Traditional registration and login system
- **Security Features**:
  - bcrypt password hashing with salt rounds
  - JWT-based session management
  - Client and server-side validation
  - Protected routes with automatic redirects
- **User Experience**:
  - Seamless switching between authentication methods
  - Real-time form validation with error handling
  - Success messages and loading states
  - Responsive design for all devices

### Page 1 - Landing Page (`/`)
- Header with "Landing Page Builder" title and dynamic launch button
- Launch button shows "Launch" for unauthenticated users, "Dashboard" for authenticated users
- Main content area with:
  - Project description textarea input
  - Generate button that requires authentication
  - Auth-aware messaging ("Sign In to Generate" when not logged in)
- Automatic redirect to login page if user tries to generate without authentication

### Page 2 - Dashboard (`/dashboard`)
- **Protected Route**: Automatically redirects to login if not authenticated
- **Sidebar Layout**:
  - Navigation with Projects, Settings, Analytics
  - User profile section with avatar, name, and email (supports both Google and local accounts)
  - Sign out functionality
- **Header**: "Your Projects" title and "+ New Project" button
- **Project Management**:
  - User-specific project cards with real-time status updates
  - Loading states with animated spinners for generating projects
  - Status badges (generating → completed with 3-second simulation)
  - Actions (Edit/Preview for completed projects)
  - Preview functionality opens generated landing pages in new tab
- **Empty State**: Call-to-action for users with no projects

### Authentication Pages

#### Login Page (`/auth/signin`)
- **Email/Password Form**:
  - Email and password input fields
  - Real-time validation and error handling
  - Loading states during authentication
  - Clear error messages for invalid credentials
- **Google OAuth Section**:
  - Official Google branding and styling
  - "Continue with Google" button
  - Preserved existing OAuth functionality
- **Navigation**:
  - Link to registration page for new users
  - Success message display (e.g., after registration)
  - Back to home option

#### Registration Page (`/auth/register`)
- **Registration Form**:
  - Full name, email, password, and confirm password fields
  - Comprehensive client-side validation:
    - Email format validation
    - Password strength requirements (minimum 6 characters)
    - Password confirmation matching
    - Required field validation
- **User Experience**:
  - Real-time validation feedback
  - Clear error messages with specific guidance
  - Loading states during registration
  - Automatic login after successful registration
- **Security**:
  - Server-side validation and sanitization
  - Duplicate email prevention
  - Secure password hashing before storage

### Page 3 - Landing Page Preview (`/preview/[id]`)
- **Server-Side Rendered Landing Pages**: Dynamic rendering of generated landing pages
- **Component-Based Architecture**: Modular blocks rendered from structured data
- **Real-Time Content**: Live preview of user-generated landing pages
- **Responsive Design**: Mobile-first responsive components
- **Error Handling**: Graceful fallbacks for missing data or components

## Data Flow & Security

### Authentication Flow
1. **User Registration**:
   - User visits `/auth/register`
   - Completes registration form with validation
   - Server creates user with bcrypt-hashed password
   - Automatic authentication and redirect to dashboard
2. **User Login** (Two methods):
   - **Credentials**: Email/password validation against stored users
   - **Google OAuth**: Third-party authentication with Google
3. **Session Management**:
   - JWT-based sessions with NextAuth.js
   - Persistent sessions across browser tabs and reloads
   - Secure session validation on all protected routes
4. **Protected Access**:
   - Dashboard requires valid session
   - Project creation requires authentication
   - Automatic redirects for unauthenticated users

### Server-Side Data Storage
- **User Management**:
  - In-memory user storage with TypeScript interfaces
  - bcrypt password hashing for security
  - User validation and authentication methods
  - Support for both OAuth and credentials users
- **Project Isolation**:
  - Projects are stored per-user using session user ID
  - API security with session validation before access
  - Real-time updates with dashboard polling
- **Data Persistence**: In-memory storage (ready for database integration)

### Project Creation Flow
1. Authenticated user enters project description
2. Client sends POST request to `/api/projects` with session token
3. Server validates session and creates project with "generating" status
4. User redirected to dashboard showing new project with loading spinner
5. Server simulates generation (3 seconds) then updates status to "completed" with landing page data
6. Dashboard polls and updates UI when project is ready
7. User can click "Preview" to view generated landing page at `/preview/[id]`

### Landing Page Generation & Rendering
1. **Data Structure**: Projects include structured landing page data with sitemap, blocks, and content
2. **Component Mapping**: Dynamic component rendering based on block types (Navbar1, Layout1, etc.)
3. **Server-Side Rendering**: Preview pages are rendered server-side for optimal performance
4. **Real-Time Preview**: Instant access to generated landing pages through preview links

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Language**: TypeScript with strict type checking
- **Authentication**: 
  - NextAuth.js with Google OAuth and Credentials providers
  - bcryptjs for password hashing
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React useState + server-side session management
- **API**: Next.js API routes with comprehensive session validation
- **Development**: Hot reloading with Turbopack

## Environment Configuration

### Required Environment Variables
```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secure-random-secret

# Google OAuth Configuration (Optional - only needed for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Google OAuth Setup (Optional)
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3002/api/auth/callback/google`
5. Update environment variables with real credentials

**Note**: The app works fully with just email/password authentication if Google OAuth credentials are not configured.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Development Server

The app runs on:
- **Local**: http://localhost:3002 (auto-detects available port)
- **Network**: http://192.168.168.15:3002

## Data Models

### User (Local Authentication)
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  password: string; // bcrypt hashed
  image?: string;
  createdAt: string;
}
```

### Session (NextAuth.js)
```typescript
interface Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  }
}
```

### Project
```typescript
interface LandingPageBlock {
  type: string;
  subtype: string;
  content: string;
}

interface LandingPageContent {
  [key: string]: any;
}

interface LandingPageData {
  sitemap: string[];
  blocks: {
    [key: string]: LandingPageBlock;
  };
  block_contents: {
    [key: string]: LandingPageContent;
  };
}

interface Project {
  id: string;
  userId: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  name?: string;
  createdAt: string;
  updatedAt: string;
  landing_page_data?: LandingPageData;
}
```

### Landing Page Components

#### Navbar1 Component
```typescript
interface Navbar1Props {
  logo_src: string;
  button: string;
}
```

#### Layout1 Component  
```typescript
interface Layout1Props {
  title: string;
  desc: string;
  button1: string;
  button2: string;
}
```

## Security Features

### Authentication Security
- **Password Protection**: bcrypt hashing with 12 salt rounds
- **Session Security**: JWT-based sessions with secure HTTP-only cookies
- **Input Validation**: Client and server-side validation for all forms
- **CSRF Protection**: Built-in NextAuth.js CSRF protection
- **Error Handling**: Secure error messages without sensitive data exposure

### Authorization & Access Control
- **Route Protection**: All project operations require valid session
- **User Isolation**: Users can only access their own projects and data
- **API Security**: Server-side session validation on all protected endpoints
- **Automatic Redirects**: Unauthenticated users redirected to login

### Data Protection
- **Password Storage**: Never store plain text passwords
- **Session Management**: Secure token-based authentication
- **API Validation**: Comprehensive input sanitization and validation

## API Endpoints

### Authentication APIs
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/signin` - Credentials authentication
- `GET /api/auth/session` - Current session information
- `POST /api/auth/signout` - User logout

### Project APIs
- `GET /api/projects` - Get user's projects (protected)
- `POST /api/projects` - Create new project with landing page data generation (protected)

### Preview APIs
- `GET /preview/[id]` - Server-side rendered landing page preview

### NextAuth.js APIs
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler
- `GET /api/auth/providers` - Available auth providers
- `GET /api/auth/csrf` - CSRF token

## Key Components

### Authentication Components
- **AuthProvider**: NextAuth session provider wrapper
- **Registration Form**: Full validation with error handling
- **Login Form**: Multi-provider authentication interface
- **Protected Routes**: Automatic redirect logic for unauthenticated users

### UI Components
- **Landing Page**: Auth-aware interface with dynamic states
- **Dashboard**: Full web app layout with user profile and preview functionality
- **Forms**: Comprehensive validation and error states
- **Loading States**: Animated feedback for async operations

### Landing Page Components
- **Navbar1**: Responsive navigation bar with logo and CTA button
- **Layout1**: Hero header section with title, description, and dual CTAs
- **BlockRenderer**: Dynamic component mapper for rendering different block types
- **Preview System**: Server-side rendered landing page previews

### Backend Services
- **UserService**: User management, validation, and password hashing
- **Projects API**: CRUD operations with user isolation and landing page data generation
- **NextAuth Configuration**: Multi-provider authentication setup
- **Landing Page Engine**: Component-based rendering system with structured data

## Testing Results

Based on server logs, all authentication flows and landing page generation are working correctly:
- ✅ User registration (POST /api/auth/register 201)
- ✅ Credentials login (POST /api/auth/callback/credentials 200)
- ✅ Dashboard access (GET /dashboard 200)
- ✅ Project creation with landing page data (POST /api/projects 201)
- ✅ Session management (GET /api/auth/session 200)
- ✅ User logout (POST /api/auth/signout 200)
- ✅ Landing page preview rendering (GET /preview/[id] 200)

## Known Issues

- **Development OAuth**: Google OAuth may have timeout errors with demo credentials (expected)
- **In-Memory Storage**: Users and projects reset on server restart (database integration needed)
- **Port Auto-detection**: Server automatically uses available ports (3000, 3001, 3002, etc.)

## Future Enhancements

### Database Integration
- **User Storage**: PostgreSQL/MongoDB for persistent user accounts
- **Project Storage**: Relational database for project management
- **Session Storage**: Database-backed session management

### Advanced Features
- **Password Reset**: Email-based password recovery system
- **Email Verification**: Account verification workflow
- **Two-Factor Authentication**: Enhanced security options
- **Social Logins**: Additional OAuth providers (GitHub, Facebook, etc.)

### Application Features
- **Real AI Integration**: Connect to actual AI services for landing page generation
- **More Component Types**: Expand beyond Navbar1 and Layout1 (Footer, Features, Testimonials, etc.)
- **Project Templates**: Pre-built templates and themes
- **Advanced Editor**: Visual page builder with drag-and-drop
- **Export Functionality**: Download generated pages as HTML/React components
- **Team Collaboration**: Shared projects and user management
- **Analytics Dashboard**: Usage tracking and performance metrics
- **Payment Integration**: Subscription plans and usage limits
- **SEO Optimization**: Meta tags, structured data, and performance optimization
- **Custom Domains**: Allow users to publish on custom domains

### Developer Experience
- **Testing Suite**: Comprehensive test coverage for authentication flows
- **Documentation**: API documentation and developer guides
- **Deployment**: Production deployment guides and configurations
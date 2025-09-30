# Landing Page Builder

A Next.js 15.5.4 TypeScript application for creating and managing landing pages with AI assistance, featuring comprehensive authentication (Google OAuth + Email/Password), persistent JSON file-based data storage, and full deployment functionality with React project generation.

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
│   ├── deployed/
│   │   └── [subdomain]/
│   │       └── page.tsx           # Deployed project viewer
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts       # NextAuth.js with multiple providers
│   │   │   └── register/
│   │   │       └── route.ts       # User registration API
│   │   ├── projects/
│   │   │   ├── route.ts           # User-specific projects API with landing page data
│   │   │   └── [id]/
│   │   │       └── deploy/
│   │   │           └── route.ts   # Project deployment API
│   │   └── deployed/
│   │       └── [...slug]/
│   │           └── route.ts       # Static asset serving for deployed projects
│   ├── layout.tsx                 # Root layout with session provider
│   └── globals.css                # Global styles with Geist fonts
├── components/
│   ├── AuthProvider.tsx           # NextAuth session provider wrapper
│   └── landing-page/
│       ├── Navbar1.tsx            # Responsive navbar component
│       ├── Layout1.tsx            # Hero header section component
│       └── BlockRenderer.tsx      # Dynamic component renderer
├── lib/
│   ├── userService.ts             # User management and authentication with database operations
│   ├── projectService.ts          # Project management and CRUD operations
│   └── database.ts                # JSON file-based database layer
└── types/
    └── next-auth.d.ts             # TypeScript declarations for NextAuth
data/                              # JSON database files (auto-created)
├── users.json                    # User accounts and authentication data
├── projects.json                 # Project data with landing page content
└── deployment_status.json        # Deployment status tracking
template/                          # React project template for deployment
├── package.json                   # Template dependencies (React 18, Vite 4)
├── vite.config.ts                # Vite build configuration with SWC
├── src/
│   ├── App.tsx                   # Template app component
│   ├── main.tsx                  # React entry point
│   └── components/               # Reusable components (generated from main project)
└── public/                       # Static assets
generated-sites/                   # Generated project builds
├── [projectId]/                  # Individual project directories
│   ├── dist/                     # Built static files
│   └── src/                      # Source code with adapted components
middleware.ts                     # Subdomain routing middleware
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
  - Actions (Edit/Deploy/View for completed projects)
  - Edit functionality opens generated landing pages for editing
  - **Deploy functionality**: Full deployment with progress tracking
  - **View functionality**: Access deployed landing pages via subdomain/path
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
- **Edit Mode Access**: Accessible via Edit button from dashboard for project modification

### Page 4 - Deployed Projects (`/deployed/[subdomain]`)
- **Independent Landing Pages**: Fully deployed React applications
- **Optimized Performance**: Static HTML generation with CDN resources
- **Responsive Design**: Mobile-first components with Tailwind CSS
- **Asset Management**: Proper static file serving and caching
- **Path Independence**: All resources load correctly regardless of access method

## Deployment System

### Project Generation Engine
- **React+TypeScript+Tailwind Template**: Complete project template with modern tooling
- **Dynamic Component Generation**: Converts landing page data into React components
- **Component Adaptation**: Automatically adapts components from main app to standalone versions
- **Vite Build System**: Fast development and optimized production builds
- **Asset Optimization**: Automatic asset bundling and optimization

### Build Process
1. **Template Copying**: Copies base React project template from `/template` directory
2. **Component Generation**: Creates React components from landing page data structure
3. **Component Adaptation**: Transforms main app components (Navbar1, Layout1) to standalone versions
4. **Build Compilation**: Generates optimized static HTML with CDN resources for browser compatibility
5. **Asset Management**: Handles static assets with proper caching headers

### Component Transformation Process
- **Navbar1 → Navbar**: Interface renaming (`Navbar1Props` → `NavbarProps`), prop mapping (`logo_src` → `logoSrc`)
- **Layout1 → HeroSection**: Interface transformation (`Layout1Props` → `HeroSectionProps`), export name changes
- **Dynamic Import Mapping**: Generates proper component imports in App.tsx based on landing page structure

### Access Methods
- **Development Environment**: 
  - Main app: `http://localhost:3003`
  - Deployed projects: `http://localhost:3003/deployed/project-{id}`
- **Production Environment**:
  - Main app: `https://yourdomain.com`
  - Deployed projects: `https://project-{id}.yourdomain.com` (via middleware subdomain routing)

### Generated Project Structure
```
generated-sites/[projectId]/
├── dist/                         # Built static files
│   └── index.html               # Standalone HTML with CDN resources
├── src/
│   ├── App.tsx                  # Generated app component
│   └── components/
│       ├── Navbar.tsx           # Adapted from Navbar1
│       └── HeroSection.tsx      # Adapted from Layout1
├── package.json                 # React 18 + Vite 4 dependencies
└── vite.config.ts               # SWC build configuration
```

### Deployment Features
- **Progress Tracking**: Real-time deployment status with UI feedback using polling mechanism
- **Asynchronous Processing**: Non-blocking deployment with status tracking via Map storage
- **Error Handling**: Comprehensive error handling and user feedback
- **Resource Independence**: All assets load correctly in any environment via CDN resources
- **Subdomain Routing**: Middleware-based routing for both development paths and production subdomains

## Data Storage & Persistence

### JSON File-Based Database System
- **Zero-Dependency Storage**: No external database setup required, uses native Node.js file system
- **Persistent Data**: All user accounts, projects, and deployment status survive server restarts
- **Type-Safe Operations**: Full TypeScript interfaces for all data operations
- **Atomic File Updates**: Thread-safe write operations with proper error handling
- **Human-Readable Format**: JSON files that can be easily inspected, backed up, and migrated

### Database Structure
```
data/
├── users.json                    # User accounts with authentication data
├── projects.json                 # Project content and metadata
└── deployment_status.json        # Deployment progress tracking
```

### Data Models

#### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;           // bcrypt hashed for credentials users
  image_url?: string;               // Profile image from OAuth
  provider: string;                 // 'credentials' | 'google'
  created_at: string;
  updated_at: string;
}
```

#### Project Model  
```typescript
interface Project {
  id: string;
  user_id: string;
  name?: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  deployed: boolean;
  subdomain?: string;
  landing_page_data?: any;          // Complete landing page structure
  created_at: string;
  updated_at: string;
}
```

#### Deployment Status Model
```typescript
interface DeploymentStatus {
  project_id: string;
  status: 'deploying' | 'completed' | 'failed';
  subdomain?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

### Database Operations
- **User Management**: Registration, authentication, OAuth account linking
- **Project CRUD**: Create, read, update, delete with user isolation
- **Deployment Tracking**: Real-time status updates with error handling
- **Data Integrity**: Referential consistency between users, projects, and deployment status

### Authentication Flow
1. **User Registration**:
   - User visits `/auth/register`
   - Completes registration form with validation
   - Server creates user with bcrypt-hashed password in `users.json`
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

### Data Persistence & Reliability
- **File System Persistence**: Data survives server restarts and deployments
- **Backup Strategy**: Simple file copying for data backup and restoration
- **Migration Ready**: Easy conversion to SQL databases when scaling requirements change
- **Development Friendly**: Data can be inspected and modified directly in JSON files
- **Error Recovery**: Graceful handling of corrupted files with fallback to empty state

### Server-Side Data Storage
- **User Management**:
  - JSON file-based user storage with TypeScript interfaces
  - bcrypt password hashing for security
  - User validation and authentication methods
  - Support for both OAuth and credentials users
- **Project Isolation**:
  - Projects are stored per-user using session user ID
  - API security with session validation before access
  - Real-time updates with dashboard polling
- **Data Persistence**: JSON file storage with atomic write operations

### Service Layer Architecture
- **UserService**: Complete user lifecycle management (registration, authentication, OAuth)
- **ProjectService**: Project CRUD operations with user isolation and status management
- **JsonDatabase**: Singleton database manager with type-safe operations
- **Error Handling**: Comprehensive logging and graceful error recovery

### Project Creation & Deployment Flow
1. Authenticated user enters project description
2. Client sends POST request to `/api/projects` with session token
3. Server validates session and creates project with "generating" status in `projects.json`
4. User redirected to dashboard showing new project with loading spinner
5. Server simulates generation (3 seconds) then updates status to "completed" with landing page data
6. Dashboard polls and updates UI when project is ready
7. User can click "Edit" to modify the generated landing page at `/preview/[id]`
8. **User can click "Deploy" to start deployment process**:
   - Generates independent React project from landing page data
   - Builds optimized HTML/CSS/JS files
   - Updates deployment status in `deployment_status.json`
   - Sets up subdomain routing
   - Updates project status and provides access URL
9. **User can click "View" to access deployed landing page**

### Landing Page Generation & Rendering
1. **Data Structure**: Projects include structured landing page data with sitemap, blocks, and content
2. **Component Mapping**: Dynamic component rendering based on block types (Navbar1, Layout1, etc.)
3. **Server-Side Rendering**: Preview pages are rendered server-side for optimal performance
4. **Real-Time Preview**: Instant access to generated landing pages through preview links
5. **Independent Deployment**: Standalone React applications with optimized builds

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Language**: TypeScript with strict type checking
- **Authentication**: 
  - NextAuth.js with Google OAuth and Credentials providers
  - bcryptjs for password hashing (12 salt rounds)
- **Styling**: Tailwind CSS 4 with responsive design and Geist fonts
- **State Management**: React useState + server-side session management
- **API**: Next.js API routes with comprehensive session validation
- **Build System**: Vite 4 with SWC for deployed project builds
- **Template Engine**: React 18 + TypeScript + Tailwind template system
- **Development**: Hot reloading with Turbopack

## Core Dependencies

### Main Application
```json
{
  "next": "15.5.4",
  "react": "19.1.0", 
  "react-dom": "19.1.0",
  "next-auth": "^4.24.11",
  "bcryptjs": "^3.0.2",
  "tailwindcss": "^4"
}
```

### Generated Projects Template
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0", 
  "vite": "^4.4.0",
  "@vitejs/plugin-react-swc": "^3.3.0",
  "tailwindcss": "^3.3.0"
}
```

## Environment Configuration

### Required Environment Variables
```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your-secure-random-secret

# Google OAuth Configuration (Optional - only needed for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Google OAuth Setup (Optional)
1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3003/api/auth/callback/google`
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
- **Local**: http://localhost:3003 (auto-detects available port)
- **Network**: http://192.168.3.30:3003

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
  deployed?: boolean;
  subdomain?: string;
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

### Deployment APIs
- `POST /api/projects/[id]/deploy` - Deploy landing page to independent React app
- `GET /api/projects/[id]/deploy` - Get deployment status and subdomain info

### Preview APIs
- `GET /preview/[id]` - Server-side rendered landing page preview and edit mode

### Static Asset APIs
- `GET /api/deployed/[...slug]` - Serve static assets for deployed projects with proper caching

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
- **Dashboard**: Full web app layout with user profile and deployment management
- **Forms**: Comprehensive validation and error states
- **Loading States**: Animated feedback for async operations

### Landing Page Components
- **Navbar1**: Responsive navigation bar with logo and CTA button
- **Layout1**: Hero header section with title, description, and dual CTAs
- **BlockRenderer**: Dynamic component mapper for rendering different block types
- **Edit System**: Landing page editing through preview interface
- **Deployment System**: Full deploy/view functionality with progress tracking

### Backend Services
- **UserService**: User management, validation, and password hashing
- **Projects API**: CRUD operations with user isolation and landing page data generation
- **ProjectGenerator**: React project generation and build service
- **NextAuth Configuration**: Multi-provider authentication setup
- **Landing Page Engine**: Component-based rendering system with structured data

### Deployment Services
- **Project Template**: React+TypeScript+Tailwind template with Vite build system
- **Component Generator**: Converts landing page data to React components
- **Build Service**: Compiles projects to optimized HTML/CSS/JS
- **Asset Server**: Serves static files with proper caching and content types
- **Subdomain Router**: Handles both development path and production subdomain routing

## Current Implementation Status

### ✅ Completed Features
- **Authentication System**: Multi-provider login (Google OAuth + Email/Password) with persistent sessions
- **Data Persistence**: JSON file-based database with user accounts, projects, and deployment status
- **Project Management**: Complete CRUD operations with user isolation and real-time status updates
- **Landing Page Generation**: Component-based rendering system with Navbar1 and Layout1 components
- **Deployment System**: Full React project generation with Vite builds and subdomain routing
- **User Interface**: Responsive dashboard with project cards, status tracking, and deployment controls
- **Security**: bcrypt password hashing, session validation, and secure API endpoints

### 🔄 In Progress
- **Component Library Expansion**: Adding more landing page components and templates
- **AI Integration**: Connecting to actual AI services for landing page content generation
- **Performance Optimization**: Query optimization and caching strategies

### 📋 Planned Enhancements
- **Database Migration**: Upgrade path to SQLite/PostgreSQL for production scaling
- **Advanced Features**: Custom domains, team collaboration, analytics dashboard
- **Developer Tools**: Comprehensive testing, API documentation, deployment automation

## Known Issues & Current Limitations

- **Development OAuth**: Google OAuth may have timeout errors with demo credentials (expected behavior)
- **JSON File Storage**: Suitable for small to medium scale applications (< 10,000 users)
- **Port Auto-detection**: Server automatically uses available ports (3000, 3001, 3003, etc.)
- **Simplified Build Process**: Currently using HTML generation with CDN resources instead of full Vite builds for development speed
- **Component Library**: Limited to Navbar1 and Layout1 components (expandable architecture in place)
- **Asset Serving**: Static assets served through API routes rather than dedicated CDN in development
- **Concurrent Access**: JSON file writes are atomic but not optimized for high-concurrency scenarios

## Future Enhancements

### Database Integration & Scaling
- **SQLite Migration**: Easy upgrade path to SQLite for better performance and ACID compliance
- **PostgreSQL Integration**: Enterprise-grade database with Prisma ORM for large-scale deployments
- **Connection Pooling**: Database connection optimization for high-traffic scenarios
- **Session Storage**: Database-backed session management for distributed deployments
- **Backup & Recovery**: Automated backup strategies and point-in-time recovery

### Advanced Features
- **Password Reset**: Email-based password recovery system
- **Email Verification**: Account verification workflow
- **Two-Factor Authentication**: Enhanced security options
- **Social Logins**: Additional OAuth providers (GitHub, Facebook, etc.)

### Application Features
- **Real AI Integration**: Connect to actual AI services for landing page generation (currently simulated)
- **Full Vite Build Pipeline**: Implement actual npm install and Vite builds for production deployments
- **Custom Domains**: Allow users to deploy on custom domains with DNS management
- **Expanded Component Library**: Add Footer, Features, Testimonials, Gallery, Contact forms, etc.
- **Component Variants**: Multiple styles for each component type (Navbar2, Layout2, etc.)
- **Project Templates**: Pre-built templates and themes for different industries
- **Advanced Visual Editor**: Drag-and-drop page builder with live preview
- **Export Functionality**: Download generated pages as ZIP files with source code
- **Team Collaboration**: Shared projects, user roles, and project permissions
- **Analytics Dashboard**: Usage tracking, performance metrics, and conversion analytics
- **Payment Integration**: Subscription plans, usage limits, and billing management
- **SEO Optimization**: Meta tags, structured data, sitemap generation, and performance optimization
- **Version Control**: Track changes, rollback capabilities, and change history
- **A/B Testing**: Multiple page variants and performance comparison tools

### Developer Experience
- **Testing Suite**: Comprehensive test coverage for authentication, database operations, and deployment flows
- **API Documentation**: OpenAPI/Swagger documentation for all endpoints
- **Database Migrations**: Automated migration scripts from JSON to SQL databases
- **Performance Monitoring**: Application metrics and database query optimization
- **CI/CD Pipeline**: Automated testing, building, and deployment workflows
- **Docker Support**: Containerization for consistent deployment environments
- **Backup Automation**: Scheduled data backups and integrity verification
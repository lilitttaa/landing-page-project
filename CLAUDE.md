# Landing Page Builder

A Next.js 15.5.4 TypeScript application for creating and managing landing pages with AI assistance, featuring comprehensive authentication (Google OAuth + Email/Password), persistent JSON file-based data storage, **iframe-based editing system with isolated styling**, **automated component metadata generation**, **server-side data validation**, and full deployment functionality with React project generation.

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
│   │       └── page.tsx           # iframe-based editing interface with toolbar
│   ├── edit-frame/
│   │   ├── [id]/
│   │   │   └── page.tsx           # Isolated editing environment (iframe content)
│   │   └── layout.tsx             # Custom layout with isolated Tailwind config
│   ├── preview-static/
│   │   ├── [id]/
│   │   │   └── page.tsx           # Static preview mode (non-editable)
│   │   └── layout.tsx             # Custom layout with identical Tailwind config as edit-frame
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
│   └── globals.css                # Global styles with Tailwind CSS v4
├── components/
│   ├── AuthProvider.tsx           # NextAuth session provider wrapper
│   ├── landing-page/
│   │   ├── Navbar1.tsx            # Advanced Relume-style navbar with animations
│   │   └── Layout1.tsx            # Enhanced hero section with image support
│   ├── renderers/                 # Component rendering tools
│   │   ├── BlockRenderer.tsx      # Dynamic component renderer
│   │   └── ValidatedBlockRenderer.tsx # Server-validated component renderer
│   ├── meta/                      # Auto-generated component metadata
│   │   ├── Navbar1.meta.json      # Navbar1 component schema and defaults
│   │   └── Layout1.meta.json      # Layout1 component schema and defaults
│   ├── common/                    # Comprehensive UI component library
│   │   ├── Button.tsx             # Multi-variant button component
│   │   ├── Dialog.tsx             # Modal dialog system
│   │   ├── Accordion.tsx          # Collapsible content sections
│   │   ├── Carousel.tsx           # Image/content carousel with Embla
│   │   ├── Sidebar.tsx            # Navigation sidebar component
│   │   └── [20+ other components] # Complete UI component ecosystem
│   └── utils/
│       ├── cn.ts                  # Class name utility functions
│       └── colorUtils.ts          # Color manipulation utilities
├── config/
│   ├── tailwind.custom.config.js  # Isolated Tailwind configuration for editing
│   └── tailwind.utils.js          # Config utilities for reuse (editing + deploy)
├── lib/
│   ├── userService.ts             # User management and authentication with database operations
│   ├── projectService.ts          # Project management with data validation integration
│   ├── database.ts                # JSON file-based database layer
│   ├── componentMetaGenerator.ts  # TypeScript-based component metadata generator
│   └── componentDataValidator.ts  # Server-side data validation and merging
├── types/
│   ├── next-auth.d.ts             # TypeScript declarations for NextAuth
│   └── component-meta.ts          # Component metadata type definitions
└── scripts/                       # Automation and utility scripts
    ├── generate-meta.ts           # Generate component metadata from source
    ├── test-validation.ts         # Test data validation functionality
    └── clean-project-data.ts      # Clean and normalize existing project data
data/                              # JSON database files (auto-created, git-ignored)
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
generated-sites/                   # Generated project builds (git-ignored)
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

### Page 3 - Advanced iframe-based Editing System (`/preview/[id]`)
- **iframe Isolation Architecture**: Complete style and script isolation using iframe sandboxing
- **Dual-Mode Interface**:
  - **Edit Mode**: iframe loads `/edit-frame/[id]` with custom Tailwind configuration
  - **Preview Mode**: iframe loads `/preview-static/[id]` with identical styling for consistency
- **Interactive Editing Toolbar**:
  - Mode toggle (Edit ↔ Preview)
  - Save changes functionality
  - Close/exit controls
- **Real-time Visual Editing**:
  - Click-to-edit functionality with visual indicators
  - Contextual edit tooltips on hover
  - Modal editing dialogs for text and image content
- **PostMessage Communication**: Secure bidirectional communication between parent and iframe
- **Unified Styling System**: Both edit and preview modes use identical custom Tailwind configuration via CDN

### Page 4 - Isolated Edit Frame (`/edit-frame/[id]`)
- **Complete Style Isolation**: Independent Tailwind configuration without affecting main app
- **Server-Side Rendered Components**: Uses existing SSR system with BlockRenderer
- **Interactive Elements**: All content marked as editable with visual feedback
- **Communication Layer**: PostMessage API for edit requests and content updates
- **Custom Layout**: Dedicated layout with isolated styling environment using `tailwind.custom.config.js`

### Page 5 - Static Preview (`/preview-static/[id]`)
- **Consistent Styling**: Uses identical custom Tailwind configuration as edit mode for perfect visual alignment
- **Read-Only Mode**: Non-editable preview without edit interaction overhead
- **Unified Layout**: Dedicated layout matching edit-frame styling system
- **Performance Optimized**: Lightweight rendering with consistent visual appearance

### Page 6 - Deployed Projects (`/deployed/[subdomain]`)
- **Independent Landing Pages**: Fully deployed React applications
- **Optimized Performance**: Static HTML generation with CDN resources
- **Responsive Design**: Mobile-first components with Tailwind CSS
- **Asset Management**: Proper static file serving and caching
- **Path Independence**: All resources load correctly regardless of access method

## Component Metadata System

### Automated Metadata Generation
- **TypeScript Source Analysis**: Automatically extracts component props, types, and documentation from source code
- **Schema Generation**: Creates comprehensive JSON schemas for each component with property definitions
- **Default Value Extraction**: Automatically captures default values from component exports
- **Type Safety**: Full TypeScript integration with proper type definitions and validation

### Data Validation & Integrity
- **Server-Side Validation**: All user data validated against component schemas before storage
- **Property Filtering**: Only valid properties defined in component metadata are preserved
- **Default Value Merging**: Missing properties automatically filled with component defaults
- **Schema Enforcement**: Ensures data consistency across edit, preview, and deployed modes

### Automated Toolchain
- **Metadata Generation**: `npm run generate-meta` - Generates component metadata from TypeScript source
- **Data Validation Testing**: `npm run test-validation` - Comprehensive validation system testing
- **Data Cleaning**: `npm run clean-data` - Normalizes existing project data to current schemas
- **Version Control**: Git-ignored data directories prevent accidental commits of user data

### Component Schema Structure
```typescript
interface ComponentMetaData {
  componentName: string;
  version: string;
  description?: string;
  properties: Record<string, PropertyDefinition>;
  types: Record<string, Record<string, PropertyDefinition>>;
  defaults: Record<string, any>;
}

interface PropertyDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
  // Validation constraints
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
}
```

### Integration Points
- **ProjectService**: Automatic data validation and merging on all CRUD operations
- **Edit/Preview Modes**: Server-validated content ensures consistent rendering
- **Component Rendering**: ValidatedBlockRenderer uses pre-validated, complete data
- **Future Extensions**: Ready for property panels, AI content generation, and advanced editing tools

## Deployment System

### Project Generation Engine
- **React+TypeScript+Tailwind Template**: Complete project template with modern tooling and comprehensive dependencies
- **Configuration-Driven Component Cloning**: Universal system that intelligently extracts and adapts components from main app
- **Smart Dependency Detection**: Automatic scanning and import generation for external libraries (React Icons, Framer Motion, etc.)
- **Vite Build System**: Fast development and optimized production builds with relaxed TypeScript strictness
- **Asset Optimization**: Automatic asset bundling and optimization with CDN fallback support

### Build Process
1. **Template Copying**: Copies base React project template from `/template` directory with full dependency stack
2. **Universal Component Cloning**: Extracts needed components (Navbar1, Layout1) preserving original names and structures
3. **Smart Import Resolution**: Automatically detects JSX usage and generates missing import statements for external dependencies
4. **Dependency Adaptation**: Maps external libraries through configuration-driven system (react-icons, framer-motion, colord)
5. **Build Compilation**: Dual-path compilation (Vite build with fallback to optimized static HTML generation)
6. **Asset Management**: Handles static assets with proper caching headers and CDN resources

### Configuration-Driven Dependency System
- **External Library Mappings**: Configurable system for handling react-icons, framer-motion, and other external dependencies
- **Intelligent Import Detection**: JSX-based scanning that only imports actually used components (avoids false positives)
- **Category-Based Icon Grouping**: Automatically groups React Icons by category (rx, bi, io5, etc.) for optimal imports
- **Global Type Generation**: Dynamic TypeScript declaration generation based on detected dependencies
- **Component Name Preservation**: Maintains original component names (Navbar1, Layout1) throughout entire pipeline

### Data Format Compatibility
- **Dual Format Support**: Handles both legacy (`logo_src`, `button`) and modern (`logo: {url, src, alt}`) data structures
- **Automatic Prop Conversion**: Intelligent conversion between data formats with proper JSX serialization
- **Backward Compatibility**: Seamless migration path for existing projects with different data schemas

### Access Methods
- **Development Environment**: 
  - Main app: `http://localhost:3000` (auto-detects available port)
  - Deployed projects: `http://localhost:3000/deployed/project-{id}`
- **Production Environment**:
  - Main app: `https://yourdomain.com`
  - Deployed projects: `https://project-{id}.yourdomain.com` (via middleware subdomain routing)

### Generated Project Structure
```
generated-sites/[projectId]/
├── dist/                         # Built static files
│   └── index.html               # Standalone HTML with CDN resources or Vite build output
├── src/
│   ├── App.tsx                  # Generated app component with proper imports
│   ├── global.d.ts              # Auto-generated TypeScript declarations
│   └── components/
│       ├── Navbar1.tsx          # Original component with smart imports
│       ├── Layout1.tsx          # Original component with smart imports
│       ├── common/              # Complete UI component library
│       └── utils/               # Utility functions and helpers
├── package.json                 # React 18 + Vite 4 + full Radix UI dependencies
├── tsconfig.json                # Relaxed TypeScript configuration
└── vite.config.ts               # SWC build configuration
```

### Deployment Features
- **Progress Tracking**: Real-time deployment status with UI feedback using polling mechanism
- **Asynchronous Processing**: Non-blocking deployment with status tracking via Map storage
- **Comprehensive Error Handling**: TypeScript compilation error resolution and user feedback
- **Resource Independence**: All assets load correctly in any environment via CDN resources
- **Subdomain Routing**: Middleware-based routing for both development paths and production subdomains
- **Next.js 15 Compatibility**: Full support for Next.js 15 async params and modern features

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
- **Styling**: 
  - **Main App**: Tailwind CSS v4 with native CSS variables
  - **Edit Mode**: Isolated Tailwind configuration via CDN
  - **Custom Theme**: Comprehensive design system with spacing, colors, typography
- **Authentication**: 
  - NextAuth.js with Google OAuth and Credentials providers
  - bcryptjs for password hashing (12 salt rounds)
- **UI Components**:
  - **Radix UI**: Comprehensive component primitives (20+ components)
  - **Framer Motion**: Advanced animations and transitions
  - **React Icons**: Icon library integration
  - **Embla Carousel**: Touch-friendly carousel system
- **Editing System**:
  - **iframe Isolation**: Complete style and script sandboxing
  - **PostMessage API**: Secure parent-iframe communication
  - **Visual Feedback**: Click-to-edit with hover states and tooltips
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
  "tailwindcss": "^4",
  "@radix-ui/react-*": "^1.x.x",
  "framer-motion": "^12.23.22",
  "react-icons": "^5.5.0",
  "embla-carousel-react": "^8.6.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
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

# Component metadata and validation tools
npm run generate-meta      # Generate component metadata from TypeScript source
npm run test-validation    # Test data validation functionality
npm run clean-data         # Clean and normalize existing project data
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

### Landing Page Components (Enhanced with Relume Integration)

#### Navbar1 Component (Advanced)
```typescript
interface Navbar1Props {
  logo: {
    url?: string;
    src: string;
    alt?: string;
  };
  navLinks: {
    url: string;
    title: string;
    subMenuLinks?: { url: string; title: string; }[];
  }[];
  buttons: ButtonProps[];
}
```

#### Layout1 Component (Enhanced)  
```typescript
interface Layout1Props {
  tagline: string;
  heading: string;
  description: string;
  buttons: ButtonProps[];
  image: {
    src: string;
    alt?: string;
  };
}
```

### UI Component Library (`src/components/common/`)
- **Button**: Multi-variant button with size and style options
- **Dialog**: Modal system with overlay and focus management
- **Accordion**: Collapsible content with animations
- **Carousel**: Image/content carousel using Embla Carousel
- **Sidebar**: Navigation sidebar with responsive behavior
- **Checkbox/RadioGroup**: Form input components with validation
- **Select/Input/Textarea**: Form controls with consistent styling
- **Badge/Separator**: UI accent and layout components
- **Tooltip/Sheet**: Interactive overlay components
- **Tabs/Pagination**: Navigation and content organization
- **Switch**: Toggle controls with animations

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
- **Advanced Component System**: 
  - Enhanced Navbar1 and Layout1 with complex prop structures
  - Comprehensive UI component library (20+ Radix UI components)
  - Framer Motion animations and micro-interactions
- **iframe-based Editing System**:
  - Complete style isolation using iframe sandboxing
  - Dual-mode interface (Edit/Preview) with toolbar controls
  - Real-time visual editing with click-to-edit functionality
  - PostMessage communication between parent and iframe
  - Unified Tailwind configuration ensuring consistent styling between edit and preview modes
- **Production-Ready Deployment System**: 
  - **Configuration-Driven Component Cloning**: Universal system supporting hundreds of components
  - **Smart Dependency Resolution**: Automatic import detection and generation for external libraries
  - **Next.js 15 Compatibility**: Full async params support and modern features
  - **Dual Data Format Support**: Seamless handling of legacy and modern prop structures
  - **Comprehensive Error Handling**: TypeScript compilation error resolution with relaxed build strictness
  - **Full Radix UI Integration**: Complete component library with proper dependency management
  - **Vite Build System**: Fast compilation with CDN fallback for maximum compatibility
- **Component Metadata System**:
  - **Automated Schema Generation**: TypeScript source code analysis with automatic metadata extraction
  - **Server-Side Data Validation**: Comprehensive validation with schema enforcement and property filtering
  - **Default Value Integration**: Automatic merging of user data with component defaults
  - **Data Integrity Tools**: Automated scripts for metadata generation, validation testing, and data cleaning
  - **Type-Safe Architecture**: Full TypeScript integration with proper type definitions
- **User Interface**: Responsive dashboard with project cards, status tracking, and deployment controls
- **Security**: bcrypt password hashing, session validation, and secure API endpoints

### 🔄 In Progress
- **Save Functionality**: Persistent content updates from edit mode to database
- **Advanced Component Editor**: Rich editing interface for complex component properties
- **Performance Optimization**: Caching strategies for iframe content and component rendering

### 📋 Planned Enhancements
- **Component Library Expansion**: Additional Relume-style components and templates with automatic metadata generation
- **AI Integration**: Connecting to actual AI services for landing page content generation
- **Database Migration**: Upgrade path to SQLite/PostgreSQL for production scaling
- **Advanced Features**: Custom domains, team collaboration, analytics dashboard
- **Developer Tools**: Comprehensive testing, API documentation, deployment automation

## Known Issues & Current Limitations

- **Development OAuth**: Google OAuth may have timeout errors with demo credentials (expected behavior)
- **JSON File Storage**: Suitable for small to medium scale applications (< 10,000 users)
- **Port Auto-detection**: Server automatically uses available ports (3000, 3001, 3003, etc.)
- **Save Functionality**: Edit changes are visual-only, not yet persisted to database
- **Component Library**: Currently optimized for Navbar1 and Layout1, expandable architecture in place
- **iframe Performance**: Slight rendering overhead due to dual-environment architecture
- **Complex Property Editing**: Advanced component properties (arrays, objects) need enhanced UI
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
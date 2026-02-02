## Project Summary
A comprehensive AI-powered hub called Invideo AI Studio that provides multiple creative tools including video generation (KIE AI), background removal, and image upscaling (Cloudinary). The project aims to be a unified workspace for professional AI creative workflows.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **Styling**: Tailwind CSS, Framer Motion, Lucide React
- **API Clients**: Axios, Form-data
- **Services**:
  - **Video Generation**: KIE AI (Sora 2)
  - **Image Upscaling**: Cloudinary
  - **Background Removal**: Remove.bg / Cloudinary (depending on route)
  - **Database**: Supabase
  - **Authentication**: Supabase Auth

## Architecture
- `src/app/invideo`: Main hub page with tabbed interface for different tools.
- `src/app/api/invideo`: Backend API routes for proxying requests to AI services.
- `src/lib`: Shared utility functions.
- `components/ui`: Reusable UI components (Shadcn UI).

## User Preferences
- Prefers functional components and modern React patterns.
- No comments in code unless explicitly requested.

## Project Guidelines
- Follow Next.js App Router conventions.
- Keep client components minimal; use React Server Components where possible.
- Wrap `useSearchParams` in `Suspense` boundaries.

## Common Patterns
- **Video Generation**: Uses KIE AI's task API with polling for completion.
- **Image Processing**: Integrates with Cloudinary for upscaling and Remove.bg for background removal.

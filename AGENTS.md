## Project Summary
A comprehensive AI-powered hub called Invideo AI Studio that provides multiple creative tools including video generation (Wan-2.1), background removal, image upscaling (Cloudinary), and face swapping (Piktid). The project aims to be a unified workspace for professional AI creative workflows.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **Styling**: Tailwind CSS, Framer Motion, Lucide React
- **API Clients**: Axios, Form-data
- **Services**:
  - **Face Swapping**: Piktid API
  - **Video Generation**: Replicate (Wan-2.1)
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
- **Piktid Integration**: Uses a multi-step async flow:
  1. Upload target image to `/api/consistent_identities/upload_target` (field name: `file`).
  2. Upload source face to `/api/consistent_identities/upload_face` (field name: `file`).
  3. Start generation with `/api/consistent_identities/generate`.
  4. Poll `/api/consistent_identities/notification/read` with `id_image`.
  5. Cleanup with `/api/consistent_identities/notification/delete`.

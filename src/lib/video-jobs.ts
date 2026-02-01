// Use a global variable to store jobs so it persists across hot reloads and different API routes
const globalForJobs = global as unknown as { activeJobs: Map<string, { status: string; output?: string; error?: string }> };
export const activeJobs = globalForJobs.activeJobs || new Map<string, { status: string; output?: string; error?: string }>();
if (process.env.NODE_ENV !== "production") globalForJobs.activeJobs = activeJobs;

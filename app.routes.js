/**
 * Client-side route patterns owned by the SPA (see src/index.js).
 *
 * The dev/prod servers only need to know these patterns so that a deep link
 * such as /task/12 still receives the app shell instead of a server 404.
 * Keeping them here keeps run.dev.js and run.start.js in sync.
 */
export const clientRoutes = ["/", "/task/:id", "/counter"];
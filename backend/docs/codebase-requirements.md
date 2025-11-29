## A Multi-Tenant SaaS Task Manager Codebase - Validation, Correction, Completion Uncompleted By Strictly Following The Requirements To Make The Codebase Production-Ready.

### Phase Execution Requirements

1. Phase 1 (Backend) MUST be 100% complete before proceeding to Phase 2 (Frontend)
2. Each phase must be blocking - no skipping or parallelization allowed
3. Phase 1.1 must complete before Phase 1.2 begins
4. All backend tests must pass before starting Phase 2
5. Cascade deletion/restoration must work flawlessly before Phase 2
6. Every validation and correction must be addressed with no shortcuts
7. All changes must be documented in backend/docs
8. Production readiness and best practices must be considered at all times
9. The system must act with senior software engineer, team lead, architect, and validator mindset
10. Existing codebase must be searched for issues before correcting
11. Available docs, utils, middlewares, constants, models, controllers, routes, services must be searched

### Task Execution Requirements

12. All tests must be placed in backend/tests folder
13. All documentation must be placed in backend/docs folder
14. After each task completion, all tests must be run and must pass
15. After each task completion, all changes must be documented
16. After each task completion, steering documents must be updated
17. Upon starting each new task, existing docs in backend/docs must be referenced

### Configuration Requirements

18. Helmet CSP directives must include all necessary sources including Cloudinary CDN
19. CORS configuration must align with allowed origins and support credentials
20. Request payload limits must use appropriate limits for production (10mb)
21. Rate limiting must apply to all API routes
22. MongoDB connection must include proper pooling, timeouts, and retry logic
23. Environment variables must be validated on startup
24. Request ID middleware must be added for tracing
25. Compression threshold must be configured (1KB)
26. Health check endpoint must be implemented
27. Graceful shutdown must be implemented for HTTP, Socket.IO, and MongoDB connections

### Model and Data Integrity Requirements

28. Soft delete plugin must prevent hard deletes completely
29. Cascade delete on Organization must soft-delete all child resources (departments, users, tasks, materials, vendors)
30. Cascade delete on Department must soft-delete all tasks and users in that department
31. Cascade delete on Task must soft-delete all comments, activities, and attachments
32. Cascade delete on User must soft-delete all user's tasks, comments, and activities
33. Restore operations must validate parent existence before restoring children
34. Cascade operations must use MongoDB transactions to ensure atomicity
35. Attachment hard-delete must delete the file from Cloudinary, unlink from all where attached to, on task create/update failure uploaded attachments must be deleted from Cloudinary
36. Proper TTL initialization and cleanup must permanently delete soft-deleted records after expiry period
37. Circular dependencies must be handled without infinite loops
38. Cascade depth limits must prevent stack overflow

### Security Requirements

39. Protected routes must verify JWT authentication
40. Authorization must use permissions from authorization matrix
41. Middleware order must follow: auth → validate → authorize → controller
42. Rate limiting must limit expensive operations appropriately
43. Route parameters must validate MongoDB ObjectId format
44. JWT tokens must use proper secrets and expiry times
45. Refresh tokens must rotate on each refresh
46. Passwords must use bcrypt hashing with ≥12 salt rounds
47. Brute-force protection must be implemented on login
48. Authorization must respect role hierarchy (SuperAdmin > Admin > Manager > User)
49. Platform SuperAdmin must be allowed cross-organization access (only for read operation on all resources of customer organization and delete and restore operation on customer organization)
50. Customer organization SuperAdmin/Admin/Manager/User must be limited to own organization
51. User input must be sanitized against NoSQL injection
52. Responses must include proper security headers via Helmet
53. Cookies must set httpOnly and secure flags
54. Production mode must enforce HTTPS via HSTS
55. Sensitive data must be excluded from queries (password, refreshToken, refreshTokenExpiry)

### Testing Requirements

56. Unit tests must test each controller, model, utils, services and middleware function
57. Integration tests must test complete request/response cycles
58. Property-based tests must use the existing test setup (to be corrected if there is any issue) for model validation
59. Test coverage must achieve >80%
60. All tests must pass without failures
61. Tests must be isolated using transactions for database cleanup
62. External dependencies must be mocked (database, emails, Cloudinary)

### Performance Requirements

63. Frequently queried fields must have database indexes
64. List endpoints must implement pagination
65. Read-only queries must use lean()
66. Responses must apply compression
67. MongoDB must use proper connection pooling
68. N+1 queries must be optimized with proper population

### Authentication Requirements

69. JWT secrets must be the same for both HTTP and Socket.IO
70. Tokens must use centralized token generation for both user and socket authentication. On both backend and frontend, they must authenticated once together and token must be refreshed together
71. Access token expiry must refresh both HTTP and Socket.IO tokens simultaneously
72. Token refresh must synchronize timing between frontend HTTP client and Socket.IO client
73. Socket.IO must authenticate using the same JWT token as HTTP requests
74. Token refresh failure must logout user from both HTTP and Socket.IO sessions
75. User logout must invalidate tokens for both HTTP and Socket.IO connections

### Authorization Requirements

76. "Own" permission for tasks must verify user is in createdBy, or assignees array
77. "Own" permission for attachments must verify user is uploadedBy
78. "Own" permission for comments must verify user is createdBy
79. "Own" permission for activities must verify user is createdBy
80. "Own" permission for notifications must verify user is in recipients array
81. "Own" permission for materials must verify user is createdBy or uploadedBy
82. "Own" permission for vendors must verify user is createdBy
83. Authorization middleware must identify all ownership fields (createdBy, uploadedBy, assignees, recipients, watchers)

### Frontend Error Handling Requirements

84. ErrorBoundary must use react-error-boundary package
85. Root-level errors must be caught and display user-friendly error page
86. Nested component errors must be caught at nearest error boundary without crashing entire app
87. RouteError must handle API response errors (4xx, 5xx)
88. API errors must display appropriate error messages via toast notifications
89. Error boundaries must log errors for debugging
90. Error recovery must provide reset/retry options when possible

### File Upload Requirements

91. File upload must use react-dropzone for file selection
92. Files must upload directly to Cloudinary from client
93. Cloudinary upload success must send Cloudinary URL to backend
94. Backend receiving Cloudinary URL must store URL in database
95. Image display must use react-photo-album for gallery view
96. Image lightbox must use yet-another-react-lightbox
97. Profile picture upload must follow client → Cloudinary → backend flow
98. Organization logo upload must follow client → Cloudinary → backend flow
99. Task attachment upload must follow client → Cloudinary → backend flow

### Platform Organization Requirements

100. Organization schema must include isPlatformOrg boolean field
101. User schema must include isPlatformUser boolean field
102. User schema must include isHod boolean field (Head of Department)
103. Platform organization must be queried by isPlatformOrg=true instead of PLATFORM_ORGANIZATION_ID env var
104. Platform user must be checked by isPlatformUser=true instead of comparing with env var
105. HOD must be checked by isHod=true for users with SuperAdmin or Admin role and unique departmental position
106. Backend logic using PLATFORM_ORGANIZATION_ID must be replaced with isPlatformOrg query
107. Frontend logic using VITE_PLATFORM_ORG must be replaced with isPlatformOrg field check
108. PLATFORM_ORGANIZATION_ID must be removed from backend/.env
109. VITE_PLATFORM_ORG must be removed from client/.env

### Timezone Management Requirements

110. Backend server must set process.env.TZ to 'UTC' on startup
111. Dayjs must be configured with utc and timezone plugins
112. Mongoose schemas must store all dates as UTC
113. Dates saved to database must be automatically converted to UTC
114. API responses including dates must return dates in ISO format
115. Controllers processing incoming dates must convert to UTC before saving
116. Frontend must detect user's local timezone
117. Frontend displaying dates must convert UTC to local time
118. Frontend sending dates to API must convert local time to UTC
119. DateTimePicker must handle timezone conversion transparently
120. Date utility functions must provide UTC ↔ local conversion methods
121. Date formatting must use consistent dayjs setup across frontend/backend

### Frontend Code Quality Requirements

122. Constants must be mapped from backend/utils/constants.js to client/src/utils/constants.js
123. TASK_STATUS, TASK_PRIORITY, USER_ROLES must be imported from constants instead of hardcoding
124. Components must NEVER use hardcoded styling values
125. Theme values must use theme.palette, theme.typography, theme.spacing
126. Custom styling must use MUI styled() API
127. Responsive design must use theme breakpoints
128. Spacing must use theme spacing units
129. React Hook Form must NEVER use watch() method
130. Form fields must ALWAYS use value and onChange when controlled
131. Complex form fields must use Controller with control prop
132. Grid component must NEVER use item prop
133. Grid sizing must use size prop: `<Grid size={{ xs: 12, md: 6 }}>`
134. MUI Autocomplete must NEVER use deprecated renderTags
135. Custom rendering must use slots API
136. MUI v7 components must follow v7 syntax and deprecation guidelines

### Documentation Requirements

137. All changes must be documented in backend/docs
138. Errors must be logged with proper context and log/unlog flag in backend/.env
139. Audit events must be logged for compliance
140. API must include OpenAPI/Swagger documentation
141. Steering documents must be updated after test completion

### Architecture Requirements

142. The system must implement layered architecture: Client → API Gateway → Authentication → Authorization → Controller → Service → Data → Database
143. Client uploads must flow directly to Cloudinary, then send URL to backend
144. React-error-boundary must be used for component errors, separate handler for API errors
145. Constants synchronization must maintain identical values between backend and frontend
146. Theme-first approach must be enforced across all components
147. Cascade operations must use recursive cascade delete/restore with MongoDB transactions
148. Timezone management must store dates in UTC and convert at boundaries
149. Platform organization identification must use database fields instead of environment variables
150. Ownership-based authorization must check multiple ownership fields dynamically

### Critical Execution Rules

151. For any change/update to be made, it must be questioned WHAT, WHY AND HOW, it must be first identified what exist in codebase (backend and frontend (client)) and the codebase must be respected
152. There is no create organization route at all
153. On frontend, the installed packages in client/packages.json must be utilized effectively
154. On backend, the routes -> validators -> controllers for each resource, for each route for a given resource with all possible operation and edge cases by simulating the frontend a comprehensive tests must be done
155. Each and everything must be scopped to organization and department (req.user.organization.\_id and req.user.department.\_id) except read operation for different resource and to create user a given department to be accepted organizationId for read/delete/restore operation by platform user
156. Who what operation can do is must and completely determined by Authorization matrix dynamically
157. All 403 errors must be unauthorize and all 401 errors must be authenticated
158. On frontend 401 errors must automatically logout the user but not 403

### Backend Configuration Requirements

159. Verify helmet CSP directives cover all necessary sources
160. Check CORS configuration aligns with allowedOrigins.js
161. Validate request payload limits (10mb) are appropriate for production
162. Confirm rate limiting is applied to /api routes
163. Verify global error handler is last middleware
164. Check production static file serving path is correct
165. Add rate limiting middleware before API routes if missing
166. Ensure CSP allows Cloudinary CDN for images (https://res.cloudinary.com)
167. Add request ID middleware for tracing
168. Implement API versioning in route paths (/api/\*)
169. Add compression threshold configuration
170. Add security headers validation
171. Validate all required env vars (MONGODB_URI, JWT secrets, Cloudinary, Email)
172. Check graceful shutdown handles all connections (HTTP, Socket.IO, MongoDB)
173. Verify email service initialization doesn't block server startup
174. Confirm seed data only runs in development
175. Check Socket.IO instance is set before use
176. Validate timezone is UTC globally
177. Add health check for database connection status
178. Implement retry logic for MongoDB connection failures
179. Add readiness/liveness probes for K8s
180. Ensure all process handlers (SIGINT, SIGTERM) are tested
181. Add structured logging (consider Winston or Pino)
182. Validate PORT environment variable parsing
183. Check MongoDB connection options are production-ready
184. Verify connection pooling is properly configured
185. Validate retry logic handles transient failures
186. Check indexes are created on schema initialization
187. Add connection timeout configurations
188. Implement connection health monitoring
189. Add read/write concern configurations for production
190. Ensure proper handling of replica set failures
191. Verify origins match production frontend URLs
192. Check credentials are enabled for cookie-based auth
193. Validate preflight caching is appropriate
194. Add environment-specific origin lists
195. Implement origin validation logging
196. Add proper error handling for disallowed origins
197. Confirm all production/staging/dev origins are listed
198. Verify no wildcard origins in production
199. Add regex pattern support for dynamic subdomains if needed
200. Document each origin's purpose

### Model Validation Requirements

201. Verify soft delete prevents hard deletes completely
202. Check withDeleted() and onlyDeleted() query helpers work
203. Validate aggregate pipeline filtering for isDeleted
204. Confirm deletedBy tracks user who deleted
205. Check restore functionality clears all soft-delete fields
206. Validate TTL index creation for auto-cleanup
207. Test cascade soft-delete across ALL relationships
208. Ensure softDeleteMany works with filters
209. Add validation hooks to prevent isDeleted manipulation outside methods
210. Implement audit trail for restore operations
211. Add bulk restore method if missing
212. Test transaction support for all soft-delete operations
213. Validate password hashing uses bcrypt with proper salt rounds (≥12)
214. Check email validation and uniqueness (scoped to organization)
215. Verify role enum values match authorization matrix
216. Confirm sensitive fields (password, refreshToken) are excluded from queries
217. Validate comparePassword method is secure
218. Check token generation/validation methods
219. Add index on email + organization for multi-tenancy
220. Implement password complexity validation
221. Add account lockout after failed login attempts
222. Validate email verification workflow
223. Add lastLogin tracking
224. Ensure cascade soft-delete handles user's tasks, comments, activities
225. Validate organization name uniqueness
226. Check owner reference integrity
227. Verify subscription/billing fields are indexed
228. Validate settings schema completeness
229. Add cascade soft-delete for ALL child resources (departments, users, tasks, materials, vendors)
230. Implement organization archival workflow
231. Add billing/subscription validation hooks
232. Ensure owner cannot be deleted while owning organization
233. Add organization transfer functionality validation
234. Validate department belongs to organization (multi-tenancy)
235. Check manager reference integrity
236. Verify unique constraint on name + organization
237. Add cascade soft-delete for tasks and users in department
238. Validate manager is part of same organization
239. Add hierarchy validation if departments have parent/child
240. Ensure restore checks organization existence
241. Validate discriminator pattern implementation
242. Check all task types inherit base fields correctly
243. Verify timestamps and status transitions
244. Validate assignees are scoped to organization
245. Check priority, status enum values
246. Implement cascade soft-delete for TaskComment, TaskActivity, Attachment
247. Add validation for status workflow (e.g., can't go from completed to pending)
248. Ensure assignees/watchers are validated against organization membership
249. Add due date validation logic
250. Implement recurrence logic validation for RoutineTask
251. Validate project milestones for ProjectTask
252. Add bulk operations with transaction support
253. Validate author belongs to task's organization
254. Check task reference integrity
255. Verify activity type enum coverage
256. Add cascade soft-delete when task is deleted
257. Add cascade soft-delete when author (user) is deleted
258. Validate comment edit/delete permissions
259. Add mentions/notifications integration
260. Ensure restore validates parent task existence
261. Validate Cloudinary URL format
262. Check file size and type restrictions
263. Verify uploader is org member
264. Validate reference integrity (task, material, etc.)
265. Delete from Cloudinary when attachment is hard-deleted
266. Add virus scanning validation hook
267. Implement storage quota validation per organization
268. Add cascade delete when parent resource (task/material) is deleted
269. Validate supported file types against whitelist
270. Add thumbnail generation for images
271. Validate material belongs to organization
272. Check quantity/unit validations
273. Verify supplier/vendor references
274. Add cascade soft-delete for attachments
275. Validate vendor belongs to same organization
276. Add inventory tracking validation
277. Implement audit trail for quantity changes
278. Validate vendor scoped to organization
279. Check contact information format
280. Verify email/phone validation
281. Add cascade handling for materials using this vendor
282. Validate unique constraint on name + organization
283. Add vendor rating/status validation
284. Validate recipient is org member
285. Check notification type enum
286. Verify read status tracking
287. Add cascade soft-delete when recipient is deleted
288. Implement notification expiry/cleanup
289. Add batch mark-as-read functionality
290. Validate notification payload structure

### Routes Requirements

291. Verify authentication middleware applied to protected routes
292. Check authorization middleware uses correct permissions from matrix
293. Validate request validation middleware order (validate → auth → authorize → controller)
294. Confirm rate limiting on expensive operations
295. Verify route parameter validation (e.g., MongoDB ObjectId format)
296. Add request logging middleware for audit trail
297. Ensure consistent error responses (use CustomError)
298. Add pagination validation for list endpoints
299. Implement field filtering/selection validation
300. Add query sanitization for search endpoints
301. Validate bulk operation endpoints use transactions
302. Add OpenAPI/Swagger documentation comments
303. Check all routes are properly mounted
304. Verify route ordering (specific before generic)
305. Add API versioning support
306. Implement route deprecation warnings
307. Add health check routes

### Controllers Requirements

308. Verify all async operations use async/await or proper promise handling
309. Check error handling wraps operations (express-async-handler or try/catch)
310. Validate input sanitization before database operations
311. Confirm multi-tenancy: all queries filter by organization
312. Verify pagination uses mongoose-paginate-v2 correctly
313. Check soft-delete operations use plugin methods
314. Validate transaction usage for multi-document operations
315. Implement cascade deletion validation in delete operations
316. Add transaction rollback on cascade delete failures
317. Ensure all responses use consistent format (responseTransform)
318. Add input validation for edge cases (empty strings, null, undefined)
319. Implement proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 429, 500)
320. Add logging for all errors with context
321. Validate socket emission for real-time updates
322. Add rate limiting for sensitive operations (create, update, delete)
323. Implement idempotency keys for create operations if needed
324. Add proper authorization checks (req.user permissions)
325. Validate task assignment logic checks assignee organization membership
326. Implement task status workflow validation
327. Add validation for task type-specific fields
328. Ensure subtask handling works correctly
329. Validate task dependencies (can't delete if blocking other tasks)
330. Add bulk import/export validation
331. Validate user deletion checks for task ownership/assignment
332. Implement user deactivation vs deletion logic
333. Add password change validation (old password verification)
334. Ensure email change requires verification
335. Validate role changes respect authorization matrix
336. Add audit logging for permission changes
337. Validate JWT refresh token rotation
338. Implement token blacklisting on logout
339. Add brute-force protection on login
340. Validate password reset token expiry
341. Ensure email verification workflow
342. Add OAuth integration validation if applicable

### Middleware Requirements

343. Verify JWT verification uses correct secrets
344. Check token expiry handling
345. Validate refresh token logic
346. Add token blacklist check for logged-out tokens
347. Implement token refresh logic
348. Add request context (req.user) population
349. Validate token payload structure
350. Add graceful handling for expired tokens
351. Check authorization matrix covers all roles and resources
352. Verify permission checking logic
353. Validate organization-scoped authorization
354. Add dynamic permission loading
355. Implement resource-level permissions (e.g., own tasks vs all tasks)
356. Add logging for authorization failures
357. Validate role hierarchy (e.g., admin > manager > member)
358. Check rate limit thresholds are production-appropriate
359. Verify rate limit storage (memory vs Redis)
360. Validate rate limit headers are sent
361. Implement Redis-based rate limiting for distributed systems
362. Add configurable rate limits per endpoint
363. Implement rate limit bypass for trusted IPs
364. Add rate limit monitoring/alerting
365. Verify all required fields are validated
366. Check data type validations
367. Validate sanitization methods
368. Confirm custom validators work correctly
369. Add comprehensive error messages for validation failures
370. Implement conditional validations (e.g., field required if another is present)
371. Add cross-field validations
372. Validate array/nested object structures
373. Add custom validators for business logic
374. Ensure validation error responses are user-friendly

### Utils Requirements

375. Verify all helper functions have proper error handling
376. Check cascadeDelete implementation handles all relationships
377. Ensure cascadeDelete recursive logic covers ALL models and relationships
378. Add cascade restore functionality
379. Implement transaction support for cascade operations
380. Add cascade operation logging
381. Validate circular dependency handling
382. Verify Socket.IO authentication
383. Check room/namespace isolation by organization
384. Validate event emission patterns
385. Implement proper error handling for socket events
386. Add socket connection logging
387. Validate organization-based room isolation
388. Add reconnection handling
389. Implement socket event validation
390. Verify all enums match model definitions
391. Check constant values are immutable
392. Add JSDoc for all constants
393. Validate enum completeness
394. Export constants in structured format

### Testing Requirements

395. Verify MongoDB memory server setup
396. Check test database isolation
397. Validate test data seeding
398. Ensure all tests use transactions for isolation
399. Add comprehensive test fixtures
400. Implement test data factories
401. Add test coverage reporting
402. Validate cleanup after each test
403. Create unit tests for each controller, model, middleware
404. Create integration tests for complete request/response cycles
405. Create property-based tests using fast-check for model validation
406. Create cascade deletion tests for organization, department, task, user deletion scenarios
407. Run all tests with npm test and npm run test:coverage
408. Apply SQL/NoSQL injection prevention (mongoose sanitization)
409. Apply XSS protection (input sanitization, CSP headers)
410. Apply CSRF protection (SameSite cookies, CSRF tokens if needed)
411. Implement rate limiting on all endpoints
412. Apply Helmet.js security headers
413. Implement JWT secret rotation strategy
414. Apply HTTPS in production (enforce with HSTS)
415. Implement sensitive data encryption at rest
416. Ensure environment variable security (.env not committed)
417. Run dependency vulnerability scan (npm audit)
418. Create database indexes on frequently queried fields
419. Implement pagination for all list endpoints
420. Apply query optimization (avoid N+1, use lean())
421. Implement response compression
422. Create caching strategy for static data (consider Redis)
423. Configure connection pooling
424. Implement Cloudinary image optimization
425. Replace existing authorization matrix with new configuration
426. Validate and update all occurrences of authorization matrix usage

### Frontend Configuration Requirements

427. Verify all dependencies are up-to-date and secure
428. Check no unused dependencies
429. Validate build scripts work correctly
430. Run npm audit and fix vulnerabilities
431. Add production build optimization
432. Ensure dev dependencies are only in devDependencies
433. Add bundle size analysis script
434. Verify production build settings
435. Check environment variable handling
436. Validate proxy configuration for API
437. Add bundle splitting for optimal loading
438. Configure chunk size warnings
439. Implement tree-shaking optimization
440. Add source map generation for debugging
441. Configure Terser for production minification
442. Verify all required env vars are present
443. Check API URL formatting
444. Add validation in main.jsx for missing vars
445. Document all environment variables
446. Separate configs for dev/staging/production
447. Verify env variable validation works
448. Check error boundary for missing config
449. Validate Redux store and persist setup
450. Add performance monitoring initialization
451. Implement error tracking (Sentry integration if needed)
452. Add service worker registration for PWA
453. Validate strict mode compatibility with all dependencies
454. Verify provider hierarchy is correct
455. Check theme provider wraps all components
456. Validate router setup
457. Add global error boundary
458. Implement loading states for provider initialization
459. Add accessibility announcements for route changes
460. Verify all routes are defined
461. Check protected route authentication logic
462. Validate route lazy loading
463. Confirm 404 fallback route
464. Add route-based code splitting
465. Implement route transition animations
466. Add breadcrumb support
467. Validate nested route authorization
468. Add route meta tags for SEO
469. Implement route guards for role-based access

### Theme Requirements

470. Ensure all components use theme tokens (not hardcoded colors/spacing)
471. Verify responsive design uses theme breakpoints
472. Check dark mode compatibility

### Authentication Components Requirements

473. Verify token refresh logic
474. Check logout cleanup (clear tokens, Redux state)
475. Validate authentication state persistence
476. Add automatic token refresh before expiry
477. Implement logout on 401 responses globally
478. Add session timeout warning
479. Validate token storage security (httpOnly cookies vs localStorage)
480. Add multi-tab logout synchronization
481. Verify authentication check logic
482. Check redirect behavior
483. Validate loading states
484. Add role-based route protection
485. Implement intended destination after login
486. Add permission checking for nested routes
487. Validate organization context for routes

### Pages Requirements

488. Validate alignment with backend APIs for all pages
489. Implement error handling for all pages
490. Add loading states for all pages
491. Implement empty states for all pages
492. Add pagination for all list pages
493. Implement filtering for all list pages
494. Ensure responsive design for all pages
495. Verify data fetching uses correct Redux slices
496. Check error handling for failed API calls
497. Validate loading skeletons/spinners
498. Implement dashboard widgets with real-time updates via Socket.IO
499. Add data visualization using MUI X Charts
500. Implement filters and date range selectors
501. Add export functionality
502. Validate responsive layout for all screen sizes
503. Add empty state for new organizations
504. Verify CRUD operations align with backend API
505. Check multi-tenancy handling (org switching)
506. Validate permission-based UI rendering
507. Implement organization switcher in header
508. Add organization creation workflow (wizard)
509. Validate organization deletion confirmation with cascade warning
510. Add organization settings page
511. Implement billing/subscription UI if applicable
512. Verify department list filtered by current organization
513. Check CRUD operations use correct API endpoints
514. Validate manager selection limited to org members
515. Add department hierarchy visualization if applicable
516. Implement drag-and-drop reordering
517. Add department member management
518. Validate empty state for new organizations
519. Add bulk operations (import/export)
520. Verify user list scoped to organization
521. Check role assignment UI matches authorization matrix
522. Validate user invitation workflow
523. Implement user invitation via email
524. Add user deactivation vs deletion UI
525. Validate role change confirmation dialogs
526. Add user filtering by role, department, status
527. Implement user profile editing
528. Add password reset functionality
529. Validate user avatar upload with Cloudinary
530. Verify task list filtered by organization
531. Check task type-specific forms (project, routine, assigned)
532. Validate task assignment UI shows only org members
533. Confirm task status workflow in UI
534. Implement Kanban board view with drag-and-drop
535. Add task filtering (status, priority, assignee, department, dates)
536. Validate task creation wizard for different types
537. Implement task comments with real-time updates
538. Add task activity timeline
539. Validate file attachment upload/preview
540. Implement subtask management
541. Add task dependencies visualization
542. Validate recurrence UI for routine tasks
543. Add milestone tracking for project tasks
544. Implement bulk task operations (assign, update status)
545. Add task export functionality
546. Verify material list scoped to organization
547. Check vendor selection limited to org vendors
548. Validate inventory tracking display
549. Add material search and filtering
550. Implement quantity adjustment workflow
551. Validate material categorization
552. Add low stock alerts
553. Implement material attachments (images, specs)
554. Add bulk import/export
555. Verify vendor list scoped to organization
556. Check vendor contact validation (email, phone)
557. Validate vendor-material relationship display
558. Add vendor search and filtering
559. Implement vendor rating system UI
560. Validate vendor contact management
561. Add vendor performance metrics
562. Implement vendor document attachments
563. Verify landing page for unauthenticated users
564. Check login/signup navigation
565. Add compelling landing page copy
566. Implement feature showcase
567. Add pricing/plans display if applicable
568. Validate responsive mobile design
569. Verify 404 page displays correctly
570. Check navigation back to app
571. Add helpful navigation links
572. Implement search suggestion for mistyped routes
573. Add back to dashboard button
574. Verify email submission workflow
575. Check success message display
576. Validate error handling
577. Add email format validation
578. Implement rate limiting UI feedback
579. Validate redirect after password reset
580. Add resend link functionality

### Components Requirements

581. Validate prop types for all common components
582. Ensure accessibility for all common components
583. Implement error boundaries for all common components
584. Add loading states for all common components
585. Ensure theme integration for all common components
586. Add PropTypes or TypeScript interfaces for all components
587. Implement comprehensive error handling for all components
588. Add loading/skeleton states for all components
589. Validate accessibility (ARIA labels, keyboard navigation) for all components
590. Ensure responsive design for all components
591. Add unit tests for reusable components
592. Validate form validation using react-hook-form for all forms
593. Implement error display for all forms
594. Add submission handling for all forms
595. Implement field dependencies for all forms
596. Add reset behavior for all forms
597. Implement proper form validation rules matching backend validators
598. Add client-side validation for UX (before API call)
599. Validate form submission error handling (network errors, 400/422 responses)
600. Add form field dependencies (conditional fields)
601. Implement form auto-save for drafts
602. Add form reset after successful submission
603. Validate file upload forms integrate with Cloudinary
604. Add form progress indicators for multi-step forms
605. Validate data display for all card components
606. Implement actions (edit, delete, view) for all card components
607. Ensure responsive layout for all card components
608. Add empty states for all card components
609. Add skeleton loading states for all card components
610. Implement card actions with permission checks
611. Validate responsive grid layout for all card components
612. Add card hover effects (theme-based)
613. Implement card selection for bulk operations
614. Validate MUI DataGrid column configs for all column definitions
615. Implement custom renderers for all column definitions
616. Add sorting for all column definitions
617. Implement filtering for all column definitions
618. Add action columns for all column definitions
619. Add custom cell renderers for complex data (status chips, avatars)
620. Implement action columns with permission-based visibility
621. Validate sortable/filterable columns
622. Add column resize/reorder functionality
623. Implement column visibility toggles
624. Verify filters update URL query params
625. Check filter state persists on navigation
626. Validate filter reset functionality
627. Implement advanced filter builder
628. Add filter presets (saved filters)
629. Validate filter debouncing for performance
630. Add filter count badges
631. Verify list rendering performance (virtualization if needed)
632. Check empty state display
633. Validate infinite scroll or pagination
634. Add skeleton loading for lists
635. Implement pull-to-refresh for mobile
636. Validate list item actions

### Redux Requirements

637. Verify Redux persist configuration
638. Check middleware setup
639. Validate reducer combination
640. Add Redux DevTools extension for development
641. Implement state migration for persist upgrades
642. Validate state shape consistency
643. Add performance monitoring middleware
644. Verify async thunks use correct API endpoints for all feature slices
645. Check loading/error state handling for all feature slices
646. Validate optimistic updates for better UX for all feature slices
647. Confirm state normalization for relational data for all feature slices
648. Validate selector memoization for all feature slices
649. Implement proper error serialization for all feature slices
650. Add retry logic for failed API calls for all feature slices
651. Validate state cleanup on logout for all feature slices
652. Add cache invalidation logic for all feature slices
653. Implement optimistic updates with rollback on error for all feature slices
654. Validate organization-scoped state isolation for all feature slices
655. Add real-time state updates via Socket.IO integration for all feature slices
656. Implement pagination state management for all feature slices
657. Add filter/search state persistence for all feature slices

### Services Requirements

658. Verify Socket.IO connection uses JWT authentication
659. Check organization room joining
660. Validate event handlers update Redux state
661. Confirm reconnection logic
662. Add connection error handling
663. Implement exponential backoff for reconnections
664. Validate event payload structure
665. Add socket connection status indicator in UI
666. Implement heartbeat/ping-pong
667. Validate event unsubscription on component unmount
668. Verify upload uses correct Cloudinary preset
669. Check file size/type validation
670. Validate progress tracking
671. Confirm upload error handling
672. Add image transformation (resize, crop) before upload
673. Implement upload cancellation
674. Validate upload retry logic
675. Add preview generation
676. Implement secure upload signatures if needed

### Utils Requirements

677. Verify all utility functions are pure and testable
678. Check date formatting uses dayjs consistently
679. Validate API client (axios) configuration
680. Add axios interceptors for auth tokens
681. Implement global error handling for API calls
682. Validate request/response transformations
683. Add request retry logic
684. Implement request deduplication
685. Add API client logging for debugging

### Global Frontend Requirements

686. Implement global error boundary
687. Add toast notifications for API errors (react-toastify)
688. Validate user-friendly error messages
689. Add error logging/reporting service integration
690. Implement offline detection and UI
691. Add skeleton loaders for all data-dependent components
692. Implement global loading indicator
693. Validate suspense boundaries for lazy-loaded routes
694. Add progressive loading for large lists
695. Validate mobile-first approach
696. Check tablet layout (768px-1024px)
697. Validate desktop optimization (>1024px)
698. Add touch-friendly UI elements
699. Implement mobile navigation (hamburger menu)
700. Validate WCAG 2.1 AA compliance
701. Add proper ARIA labels and roles
702. Implement keyboard navigation
703. Validate color contrast ratios
704. Add screen reader support
705. Implement focus management
706. Add code splitting for routes
707. Implement lazy loading for heavy components
708. Validate bundle size (<500KB initial)
709. Add image optimization (WebP, lazy loading)
710. Implement virtual scrolling for long lists
711. Add performance monitoring (Web Vitals)
712. Validate XSS prevention (sanitize user-generated content)
713. Implement CSP compliance
714. Validate secure token storage
715. Add HTTPS enforcement
716. Implement rate limiting feedback in UI
717. Validate input sanitization before API calls
718. Implement notification bell with real-time updates
719. Add online user indicator
720. Validate task updates broadcast to relevant users
721. Implement collaborative editing indicators
722. Add typing indicators for comments
723. Validate no prop drilling (use Redux for shared state)
724. Implement local state for UI-only concerns
725. Validate state persistence (Redux persist)
726. Add state reset on logout
727. Implement undo/redo for critical operations
728. Add unit tests for utility functions
729. Implement component tests with React Testing Library
730. Add integration tests for critical flows
731. Validate E2E tests with Playwright or Cypress
732. Don't limit yourself to the provided requirements, validation and correction, always think of production readiness and best practices
733. Always act as if you are a senior software engineer, team lead, architect and validator
734. Always search the existing codebase for any existing issues before correcting them
735. Always search the available docs, utils, middlewares, constants, models, controllers, routes, services, etc.

## A strictly sequential phases following all the above 735 requirements.

## Architecture

This is a **multi-tenant SaaS application** designed for an industry with a strict hierarchy:

### Tenant Hierarchy

**Organization → Department → User**

- Each **User** must belong to exactly one **Department** within one **Organization**
- Users are assigned a **role** (one of: `SuperAdmin`, `Admin`, `Manager`, `User`) and a specific **position** (for example, `"Chief Engineer"`, `"Electrician"`)
- A User **position** (job title hired to the organization) is **unique for an HOD (SuperAdmin and Admin) within their department**
- The **Head of Department (HOD)** is a user whose role is either `SuperAdmin` or `Admin` and who leads that department
- The number of departments in an organization equals the number of HODs (i.e., count of users with role `SuperAdmin` + `Admin`)

### Onboarding and Authentication Flow

During onboarding, the creation sequence is **sequential**:

1. **Create and save the Organization** - Organization document created
2. **Create and save the Department** - Department created within organization
3. **Create and save the User** - Typically the `SuperAdmin` (HOD)
4. **Update createdBy fields** - Organization and Department `createdBy` updated to reference the User

**Authentication** is implemented using **JWT-based authentication with httpOnly cookies**.

### User Roles and Responsibilities

- **SuperAdmin**: The first user created during onboarding. Has organization-level privileges to create additional departments and users. The SuperAdmin is also the HOD of their department
- **Admin**: The HOD of a specific department, with administrative privileges scoped to that department
- **Manager**: Includes assistant heads and supervisors within a department
- **User**: Regular department members with limited privileges

### Platform Organization vs. Customer Organizations

> [!IMPORTANT] > **Critical Distinction: Platform vs Customer Organizations**

#### Platform Organization

The **platform organization** is the organization that _owns_ this Multi-tenant SaaS MERN Stack task manager application.

**Characteristics:**

- Structured exactly like any other (customer) organization: Organization → Department → User hierarchy
- Created during **initial project setup** (seed data)
- Seed data includes:
  - One organization with `_id` matching `process.env.PLATFORM_ORGANIZATION_ID`
  - One department within that organization
  - One user as the platform organization's `SuperAdmin`
- **Identified by:**
  - Environment variable `PLATFORM_ORGANIZATION_ID` used to SET `isPlatformOrg: true` on organization creation
  - Database field `isPlatformOrg` stores the platform status
  - User field `isPlatformUser` is set based on organization's `isPlatformOrg`
- **In request context:** `req.user.isPlatformUser` indicates platform user
- Platform users may have any role: `SuperAdmin`, `Admin`, `Manager`, or `User`

**Platform Organization/User Identification:**

```javascript
// ✅ CORRECT - Using user field (already populated)
if (req.user.isPlatformUser === true) {
  // User is from platform organization
  // Access to cross-organization features
}

// ✅ CORRECT - Check if user is platform SuperAdmin
if (req.user.isPlatformUser === true && req.user.role === "SuperAdmin") {
  // Platform SuperAdmin - full system access
}

// ❌ WRONG - Field not populated in authMiddleware
if (req.user.organization.isPlatformOrg === true) {
  // This will be undefined!
  // authMiddleware only selects: 'name isDeleted' from organization
}
```

**How Platform Identification Works:**

1. **Organization Creation:** Pre-save hook compares `_id` with `process.env.PLATFORM_ORGANIZATION_ID` and sets `isPlatformOrg`
2. **User Creation:** Pre-save hook checks organization's `isPlatformOrg` and sets user's `isPlatformUser`
3. **Authentication:** Auth middleware populates `req.user` with user document (includes `isPlatformUser`)
4. **Controllers:** Check `req.user.isPlatformUser` for platform-specific logic

#### Customer Organizations

|--------|----------------------|------------------------|
| **Identification** | `isPlatformOrg: true` | `isPlatformOrg: false` |
| **Creation** | Seed data at setup | Created via application |
| **SuperAdmin Scope** | Can view/manage all customer orgs | Limited to own organization |
| **Cross-Org Access** | Platform users can see all orgs | Cannot see other customer orgs |
| **Purpose** | Owns and manages the SaaS platform | Uses the SaaS platform |

#### Authorization Matrix Behavior

**Platform SuperAdmin:**

```javascript
// Can read across ALL organizations
scope: {
  crossOrg: ["read", "write", "delete"];
}

// Can delete/restore customer organizations
resources: {
  organizations: ["read", "update", "delete", "restore"];
}
```

**Customer Organization SuperAdmin:**

```javascript
// Limited to own organization
scope: {
  crossOrg: []; // No cross-org access
}

// Cannot delete their own organization
resources: {
  organizations: ["read", "update"]; // No delete
}
```

#### Important Notes

- **Platform organization CANNOT be deleted** - Enforced in controller logic
- **Customer organizations CAN be deleted** - Only by platform SuperAdmin
- All users follow the same authentication flow
- All users follow the same role-based permissions within their scope
- Platform users have additional cross-organization capabilities

---

### Authorization Matrix Configuration

> [!IMPORTANT] > **This is the DEFINITIVE authorization matrix to be used in implementation**
>
> Replace any existing authorization matrix with this configuration.

**File:** [backend/config/authorizationMatrix.json](backend/config/authorizationMatrix.json)

**Complete Authorization Matrix:**

```javascript
const AUTHORIZATION_MATRIX = {
  // SuperAdmin: Full organization access on their own organization, department and department within own organization. Read on task related
  [USER_ROLES.SUPER_ADMIN]: {
    own: ["read", "write", "delete"],
    ownDept: ["read", "write", "delete"],
    crossDept: ["read"],
    crossOrg: ["read", "write", "delete"], // Only for platform SuperAdmins
    resources: {
      users: ["create", "read", "update", "delete", "restore"],
      departments: ["create", "read", "update", "delete", "restore"],
      organizations: ["create", "read", "update", "delete", "restore"], // Platform only
      tasks: ["create", "read", "update", "delete", "restore"],
      materials: ["create", "read", "update", "delete", "restore"],
      vendors: ["create", "read", "update", "delete", "restore"],
      notifications: ["read", "update", "delete"],
      attachments: ["create", "read", "delete"],
    },
  },

  // Admin: Department head with cross-department read access
  [USER_ROLES.ADMIN]: {
    own: ["read", "write", "delete"],
    ownDept: ["read", "write", "delete"],
    crossDept: ["read"], // Can view other departments in same org
    crossOrg: [], // No cross-organization access
    resources: {
      users: ["create", "read", "update", "delete"], // Within department
      departments: ["read"], // Can view all departments in org
      organizations: ["read"], // Can view own organization only
      tasks: ["create", "read", "update", "delete"],
      materials: ["create", "read", "update", "delete"],
      vendors: ["create", "read", "update", "delete"],
      notifications: ["read", "update", "delete"],
      attachments: ["create", "read", "delete"],
    },
  },

  // Manager: Assistant department head with limited cross-department access
  [USER_ROLES.MANAGER]: {
    own: ["read", "write", "delete"],
    ownDept: ["read", "write"],
    crossDept: ["read"], // Limited read access to other departments
    crossOrg: [], // No cross-organization access
    resources: {
      users: ["read", "update"], // Can view and update users in department
      departments: ["read"], // Can view departments in org
      organizations: ["read"], // Can view own organization
      tasks: ["create", "read", "update", "delete"],
      materials: ["create", "read", "update"],
      vendors: ["read", "update"],
      notifications: ["read", "update"],
      attachments: ["create", "read", "delete"],
    },
  },

  // User: Regular employee with own data and department task access
  [USER_ROLES.USER]: {
    own: ["read", "write"],
    ownDept: ["read"], // Can view department data
    crossDept: [], // No cross-department access
    crossOrg: [], // No cross-organization access
    resources: {
      users: ["read"], // Can view users in department
      departments: ["read"], // Can view own department
      organizations: ["read"], // Can view own organization
      tasks: ["create", "read", "update"], // Can manage assigned tasks
      materials: ["read"],
      vendors: ["read"],
      notifications: ["read", "update"],
      attachments: ["create", "read"],
    },
  },
};
```

**Scope Definitions:**

- **own**: Resources created by the user themselves
- **ownDept**: Resources within user's own department
- **crossDept**: Resources in other departments within same organization
- **crossOrg**: Resources in other organizations (Platform SuperAdmin only)

**Key Differences by Role:**

| Role           | Own        | Own Dept   | Cross Dept | Cross Org            | Organizations CRUD   |
| -------------- | ---------- | ---------- | ---------- | -------------------- | -------------------- |
| **SuperAdmin** | Full       | Full       | Read       | Full (Platform only) | Full (Platform only) |
| **Admin**      | Full       | Full       | Read       | None                 | Read only            |
| **Manager**    | Full       | Read+Write | Read       | None                 | Read only            |
| **User**       | Read+Write | Read       | None       | None                 | Read only            |

**Platform vs Customer SuperAdmin:**

```javascript
// Platform SuperAdmin
if (req.user.isPlatformUser && req.user.role === "SuperAdmin") {
  // crossOrg: ["read", "write", "delete"] - ENABLED
  // organizations: ["create", "read", "update", "delete", "restore"] - ENABLED
  // Can manage ALL organizations
}

// Customer SuperAdmin
if (!req.user.isPlatformUser && req.user.role === "SuperAdmin") {
  // crossOrg: [] - DISABLED (set to empty array)
  // organizations: ["read"] - LIMITED (read only, no delete/restore)
  // Can only read own organization
}
```

**Critical Implementation Rules:**

1. Platform SuperAdmin gets `crossOrg` permissions; Customer SuperAdmin gets empty array
2. Only Platform SuperAdmin can `create/delete/restore` organizations
3. Customer SuperAdmin can only `read` organizations (their own)
4. `crossDept` enables read access across departments within same org
5. Authorization middleware MUST check both `req.user.isPlatformUser` AND `req.user.role`

## User Review Required

> [!WARNING] > **Phase Execution is Strictly Sequential**
>
> - Phase 1 (Backend) MUST be 100% complete before Phase 2 (Frontend) begins
> - Phase 1.1 MUST complete before Phase 1.2 begins
> - No shortcuts or parallelization allowed
> - All tests must pass before proceeding to next phase

> [!IMPORTANT] > **Critical Implementation Rules (STRICTLY ENFORCED)**
>
> **#1 MANDATORY: WHAT-WHY-HOW Analysis (APPLIES TO EVERY CHANGE)**
>
> Before making ANY change/update to ANY file:
>
> 1. **WHAT exists?** - First identify what currently exists in the codebase (both backend and frontend)
>
>    - Read the existing file completely
>    - Understand current implementation
>    - Identify current patterns and structure
>    - Document current behavior
>
> 2. **WHY change?** - Justify the change
>
>    - What requirement necessitates this change?
>    - What problem does it solve?
>    - What will break if we don't change it?
>    - Is it aligned with production readiness requirements?
>
> 3. **HOW to change?** - Plan the implementation
>    - How will the change be implemented?
>    - How does it respect existing codebase structure?
>    - How does it integrate with existing patterns?
>    - What tests will verify the change?
>
> **The existing codebase MUST be respected.** Do not impose arbitrary patterns. Work WITH the existing architecture, not against it.
>
> ---
>
> **Other Critical Rules:**
>
> 2. No create organization route (doesn't exist)
> 3. All operations scoped to organization and department
> 4. Authorization matrix controls all permissions dynamically
> 5. 401 = unauthenticated (logout user), 403 = unauthorized (show error, don't logout)
> 6. Backend validators are the ONLY source of truth for field names
> 7. Constants must be synchronized between backend and frontend
> 8. All tests in backend/tests, all docs in backend/docs
> 9. Platform organization identified by database fields (isPlatformOrg), not environment variables
> 10. Phase 1 (Backend) MUST be 100% complete before Phase 2 (Frontend) begins

---

## Task Execution Requirements (STRICTLY ENFORCED)

> [!IMPORTANT] > **After EVERY task completion, the following MUST be done (NO EXCEPTIONS):**

### 1. Test Placement

**✅ REQUIRED:** All tests MUST be placed in `backend/tests/` folder

- Unit tests: `backend/tests/unit/`
- Integration tests: `backend/tests/integration/`
- Property-based tests: `backend/tests/property/`
- Scenario tests: `backend/tests/scenarios/`

**❌ NEVER** place tests outside `backend/tests/`

### 2. Documentation Placement

**✅ REQUIRED:** All documentation MUST be placed in `backend/docs/` folder

- Validation reports
- Change logs
- API documentation
- Architecture decisions
- Configuration guides

**❌ NEVER** place documentation outside `backend/docs/`

### 3. Test Execution After Each Task

**✅ REQUIRED:** After completing ANY task:

1. Run ALL tests: `cd backend && npm test  `
2. Run coverage report: `npm run test:coverage`
3. **ALL tests MUST pass** - NO failing tests allowed
4. Coverage MUST be >80%
5. Fix any failing tests IMMEDIATELY before proceeding

**❌ NEVER** proceed to next task with failing tests

### 4. Change Documentation After Each Task

**✅ REQUIRED:** After completing ANY task:

1. Create/update validation report in `backend/docs/`
2. Document WHAT was changed
3. Document WHY it was changed
4. Document HOW it was implemented
5. Document test results
6. Document any issues encountered and resolutions

Example documentation structure:

```
backend/docs/
├── phase-1.1/
│   ├── 01-configuration-validation.md
│   ├── 02-model-validation.md
│   └── ...
├── phase-1.2/
│   ├── 01-auth-module-validation.md
│   ├── 02-material-module-validation.md
│   └── ...
└── phase-2/
    └── ...
```

### 5. Steering Document Updates After Each Task

**✅ REQUIRED:** After completing ANY task, update steering documents if they are affected:

- `steering/components.md` - If component patterns changed
- `steering/product.md` - If business logic changed
- `steering/structure.md` - If architecture changed
- `steering/tech.md` - If technology stack changed

**Document:**

- What changed in the steering documents
- Why it changed
- How it affects existing patterns

### 6. Reference Existing Docs Before Starting New Task

**✅ REQUIRED:** Before starting ANY new task:

1. **Search and read** existing docs in `backend/docs/`
2. **Identify** what has already been done
3. **Review** previous validation reports
4. **Check** for related changes
5. **Build upon** existing work, don't duplicate effort

**❌ NEVER** start a task without reviewing existing documentation

---

## Task Completion Checklist

Before marking any task as complete, verify:

- [ ] All code changes implemented
- [ ] All tests written and placed in `backend/tests/`
- [ ] All tests passing (`npm test`)
- [ ] Coverage >80% (`npm run test:coverage`)
- [ ] Changes documented in `backend/docs/`
- [ ] Steering documents updated (if applicable)
- [ ] Existing docs reviewed and referenced
- [ ] WHAT-WHY-HOW analysis documented
- [ ] No breaking changes to existing functionality
- [ ] Codebase remains consistent with existing patterns

---

## Request Object Patterns (CRITICAL UNDERSTANDING)

> [!IMPORTANT] > **Understanding req.user and req.validated is MANDATORY for all backend development**

### req.user Structure (Populated by authMiddleware)

**Source:** `backend/middlewares/authMiddleware.js`

**How req.user is populated:**

```javascript
// In authMiddleware.js (lines 171-201)
const user = await User.findById(decoded.userId)
  .populate({ path: "organization", select: "name isDeleted" })
  .populate({ path: "department", select: "name organization isDeleted" });

req.user = user;
```

**Complete req.user structure:**

```javascript
req.user = {
  // User Direct Fields
  _id: ObjectId,
  firstName: String,
  lastName: String,
  position: String,
  role: String, // "SuperAdmin", "Admin", "Manager", "User"
  email: String,
  isPlatformUser: Boolean, // ✅ AVAILABLE - Use this for platform checks
  employeeId: Number,
  skills: Array,
  profilePicture: Object,
  emailPreferences: Object,
  createdAt: Date,
  updatedAt: Date,

  // Populated organization (LIMITED fields)
  organization: {
    _id: ObjectId, // ✅ AVAILABLE
    name: String, // ✅ AVAILABLE
    isDeleted: Boolean, // ✅ AVAILABLE
    // ❌ isPlatformOrg NOT SELECTED - Not available!
  },

  // Populated department (LIMITED fields)
  department: {
    _id: ObjectId, // ✅ AVAILABLE
    name: String, // ✅ AVAILABLE
    organization: ObjectId, // ✅ AVAILABLE
    isDeleted: Boolean, // ✅ AVAILABLE
  },
};
```

**Critical Understanding:**

> [!CAUTION] > **`req.user.organization.isPlatformOrg` is UNDEFINED!**
>
> The authMiddleware only selects `"name isDeleted"` from organization.
> The `isPlatformOrg` field is NOT included in the select.
>
> **Always use `req.user.isPlatformUser` instead!**

**Correct Usage Patterns:**

```javascript
// ✅ CORRECT - Access user info
const userId = req.user._id;
const userRole = req.user.role;
const userEmail = req.user.email;

// ✅ CORRECT - Access organization/department IDs
const orgId = req.user.organization._id;
const deptId = req.user.department._id;

// ✅ CORRECT - Check platform user
if (req.user.isPlatformUser === true) {
  // User from platform organization
}

// ✅ CORRECT - Check platform SuperAdmin
if (req.user.isPlatformUser === true && req.user.role === "SuperAdmin") {
  // Platform SuperAdmin - full system access
}

// ✅ CORRECT - Check customer SuperAdmin
if (req.user.isPlatformUser === false && req.user.role === "SuperAdmin") {
  // Customer SuperAdmin - limited to own org
}

// ❌ WRONG - Field not populated
if (req.user.organization.isPlatformOrg === true) {
  // This will always be undefined!
}

// ❌ WRONG - Never use req.body/req.params directly
const { name } = req.body; // Use req.validated.body instead
const { id } = req.params; // Use req.validated.params instead
```

### req.validated Structure (Populated by Validators)

**Source:** `backend/middlewares/validators/*Validators.js`

**How req.validated is populated:**

```javascript
// In validators (example from materialValidators.js)
body().custom((_, { req }) => {
  req.validated = req.validated || {};
  req.validated.body = {
    name: b.name?.trim(),
    unit: b.unit,
    price: Number(b.price),
    category: b.category,
  };
  return true;
});

param().custom((_, { req }) => {
  req.validated.params = { materialId: req.params.materialId };
});

query().custom((_, { req }) => {
  req.validated.query = {
    page: req.query.page || 1,
    limit: req.query.limit || 10,
    search: req.query.search?.trim(),
  };
});
```

**Complete req.validated structure:**

```javascript
req.validated = {
  body: {
    // Sanitized and validated body fields
    // Type-converted, trimmed, validated
  },
  params: {
    // Sanitized and validated route params
    // Format validated (e.g., MongoDB IDs)
  },
  query: {
    // Sanitized and validated query params
    // Type-converted, defaults applied
  },
};
```

**Correct Usage in Controllers:**

```javascript
// ✅ CORRECT - Always use req.validated
export const createMaterial = asyncHandler(async (req, res, next) => {
  // Get user context
  const orgId = req.user.organization._id;
  const deptId = req.user.department._id;
  const callerId = req.user._id;

  // Get validated data
  const { name, unit, price, category } = req.validated.body;

  // Use in operations
  const material = await Material.create(
    [
      {
        name,
        unit,
        price,
        category,
        organization: orgId,
        department: deptId,
        addedBy: callerId,
      },
    ],
    { session }
  );
});

// ✅ CORRECT - Params and Query
export const getMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.validated.params;
  const { includeUsage, includeTasks } = req.validated.query;
  const orgId = req.user.organization._id;

  const material = await Material.findOne({
    _id: materialId,
    organization: orgId,
  });
});

// ❌ WRONG - Direct access to req.body/req.params/req.query
export const wrongExample = asyncHandler(async (req, res, next) => {
  const { name } = req.body; // ❌ Not validated/sanitized
  const { resourceId } = req.params; // ❌ Not validated
  const { page } = req.query; // ❌ Not type-converted
});
```

### Common Patterns Summary

**Extract User Context:**

```javascript
const orgId = req.user.organization._id;
const deptId = req.user.department._id;
const callerId = req.user._id;
const userRole = req.user.role;
const isPlatform = req.user.isPlatformUser;
```

**Extract Validated Data:**

```javascript
const { field1, field2 } = req.validated.body;
const { resourceId } = req.validated.params;
const { page, limit, search } = req.validated.query;
```

**Scoping Queries:**

```javascript
// Standard scoping
const filter = {
  organization: req.user.organization._id,
  department: req.user.department._id,
  isDeleted: false,
};

// Platform SuperAdmin - cross-org access
if (req.user.isPlatformUser && req.user.role === "SuperAdmin") {
  // Remove organization filter for cross-org access
  delete filter.organization;
}

// Customer SuperAdmin - cross-dept within org
if (!req.user.isPlatformUser && req.user.role === "SuperAdmin") {
  // Remove department filter, keep organization
  delete filter.department;
}
```

---

## Technical Implementation Requirements (STRICTLY ENFORCED)

> [!CAUTION] > **These technical rules are MANDATORY for ALL backend development**

### 1. Organization and Department Scoping

**✅ REQUIRED:** All operations MUST be scoped to organization and department

**Default Scoping Rule:**

```javascript
// ✅ Correct - ALL operations scoped by default
const query = {
  organization: req.user.organization._id,
  department: req.user.department._id,
  isDeleted: false,
};
```

**Exceptions to Scoping:**

**Exception 1: Read Operations for Different Resources (Cross-Department/Cross-Org)**

```javascript
// Platform SuperAdmin can read across organizations
if (req.user.isPlatformUser && req.user.role === "SuperAdmin") {
  // Can read across all organizations
  query = { isDeleted: false };
}

// Non-platform SuperAdmin can read cross-department within own org
if (!req.user.isPlatformUser && req.user.role === "SuperAdmin") {
  query = {
    organization: req.user.organization._id,
    isDeleted: false,
  };
}

// Admin can read cross-department within own org
if (req.user.role === "Admin") {
  query = {
    organization: req.user.organization._id,
    isDeleted: false,
  };
}
```

```javascript
// Platform users accept organizationId for read/delete/restore
const getResource = async (req, res) => {
  const { organizationId } = req.query;

  if (req.user.isPlatformUser && organizationId) {
    query.organization = organizationId;
  } else {
    query.organization = req.user.organization._id;
  }
};
```

**❌ NEVER:**

- Omit organization/department scoping on create/update/delete
- Allow non-platform users to specify organizationId
- Skip scoping validation

---

### 2. SoftDelete Plugin Methods Usage

**✅ REQUIRED:** Use ONLY softDelete plugin methods, NEVER native Mongoose methods

**Plugin Methods Provided:**

- `withDeleted()` - Include soft-deleted in query
- `onlyDeleted()` - Query only soft-deleted
- `softDeleteById(id)` - Soft delete by ID
- `softDeleteMany(filter)` - Soft delete multiple
- `restoreById(id)` - Restore by ID
- `restoreMany(filter)` - Restore multiple

**Controller Usage Examples:**

```javascript
// ✅ Correct - List with soft-deleted excluded (default)
const materials = await Material.find({
  organization: req.user.organization._id,
  department: req.user.department._id,
});

// ✅ Correct - List including soft-deleted
const materialsWithDeleted = await Material.find({
  organization: req.user.organization._id,
  department: req.user.department._id,
}).withDeleted();

// ✅ Correct - List only soft-deleted
const deletedMaterials = await Material.find({
  organization: req.user.organization._id,
  department: req.user.department._id,
}).onlyDeleted();

// ✅ Correct - Soft delete by ID
await Material.softDeleteById(id);

// ✅ Correct - Soft delete many
await Material.softDeleteMany({
  organization: req.user.organization._id,
  department: req.user.department._id,
  category: "obsolete",
});

// ✅ Correct - Restore by ID
await Material.restoreById(resourceId);

// ❌ WRONG - Using native methods
await Material.findByIdAndDelete(resourceId); // Hard delete!
await Material.deleteOne({ _id: resourceId }); // Hard delete!
await Material.deleteMany(filter); // Hard delete!
```

**Validator Usage:**

```javascript
// Validate restore operation
body("id").custom(async (resourceId) => {
  const doc = await Material.findById(resourceId).onlyDeleted();
  if (!doc) {
    throw new Error("Resource not deleted or does not exist");
  }
  return true;
});
```

**Service Usage:**

```javascript
// Email service: Check if recipient is not deleted
const user = await User.findById(recipientId); // Auto-excludes deleted
if (!user) {
  throw new CustomError("Recipient not found", 404);
}
```

**❌ NEVER:**

- Use `remove()`, `delete()`, `deleteOne()`, `deleteMany()`, `findByIdAndDelete()`
- Manually set `isDeleted` field
- Query without considering soft delete state

---

### 3. Resource-Specific Schema Methods, Statics, and Virtuals

**✅ REQUIRED:** Use ALL model-defined methods, statics, and virtuals in controllers

**Example Schema with Custom Methods:**

```javascript
// In Material model
MaterialSchema.methods.checkStock = function () {
  return this.quantity > this.minimumStock;
};

MaterialSchema.statics.findLowStock = function (orgId, deptId) {
  return this.find({
    organization: orgId,
    department: deptId,
    $expr: { $lte: ["$quantity", "$minimumStock"] },
  });
};

MaterialSchema.virtual("stockStatus").get(function () {
  return this.quantity > this.minimumStock ? "Sufficient" : "Low";
});
```

**Controller Usage:**

```javascript
// ✅ Correct - Using instance method
const material = await Material.findById(id);
const hasStock = material.checkStock();

// ✅ Correct - Using static method
const lowStockMaterials = await Material.findLowStock(
  req.user.organization._id,
  req.user.department._id
);

// ✅ Correct - Using virtuals in response
const materials = await Material.find(query).select("+stockStatus");
res.json({ materials }); // stockStatus included
```

**Common Model Methods to Use:**

- User: `matchPassword(password)`, `generateAuthToken()`, `sanitize()`
- Task: `addComment()`, `updateStatus()`, `assignUser()`
- Material: `checkStock()`, `updateQuantity()`
- Vendor: `addMaterial()`, `removeMaterial()`

**❌ NEVER:**

- Implement business logic in controllers that belongs in models
- Ignore existing schema methods
- Duplicate logic that exists in model methods

---

### 4. Schema Ref Path Population

**✅ REQUIRED:** Populate ALL ref paths and include ALL fields in response

**Population Rules:**

1. Always populate referenced documents
2. Select ALL fields (don't limit to specific fields unless required)
3. Populate nested references
4. Include populated data in response

**Example:**

```javascript
// ✅ Correct - Full population
const task = await Task.findById(id)
  .populate("organization") // All org fields
  .populate("department") // All dept fields
  .populate("createdBy") // All user fields
  .populate("assignees") // All user fields
  .populate("materials") // All material fields
  .populate({
    path: "comments",
    populate: {
      path: "createdBy", // Nested population
      select: "firstName lastName email profilePicture",
    },
  });

// Return with all populated data
res.json({
  success: true,
  task, // Fully populated
});

// ✅ Correct - List with population
const tasks = await Task.find(query)
  .populate("organization department createdBy assignees")
  .populate({
    path: "materials",
    populate: "vendor", // Nested
  });

// ❌ WRONG - Not populating
const task = await Task.findById(id); // Returns only IDs

// ❌ WRONG - Limited fields
const task = await Task.findById(id).populate(
  "createdBy",
  "firstName lastName"
); // Too limited
```

**Response Structure:**

```javascript
// ✅ Correct response
{
  success: true,
  task: {
    _id: "...",
    title: "...",
    organization: {
      _id: "...",
      name: "...",
      // ... all org fields
    },
    createdBy: {
      _id: "...",
      firstName: "...",
      lastName: "...",
      email: "...",
      // ... all user fields (except select: false)
    }
  }
}
```

**❌ NEVER:**

- Return unpopulated references (just IDs)
- Limit populated fields without justification
- Skip nested population

---

### 5. Synchronized HTTP and Socket.IO Authentication

**✅ REQUIRED:** HTTP and Socket.IO MUST authenticate together and refresh together

**Authentication Flow:**

**Backend - Unified Token Generation:**

```javascript
// utils/generateTokens.js
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      organization: user.organization,
      department: user.department,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
```

**Backend - HTTP Authentication:**

```javascript
// middlewares/authMiddleware.js
export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    throw new CustomError("Unauthorized", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.userId).populate(
      "organization department"
    );
    next();
  } catch (error) {
    throw new CustomError("Unauthorized - Token expired", 401);
  }
};
```

**Backend - Socket.IO Authentication:**

```javascript
// utils/socket.js
io.use(async (socket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.cookie?.match(/accessToken=([^;]+)/)?.[1];

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = await User.findById(decoded.userId).populate(
      "organization department"
    );
    next();
  } catch (error) {
    return next(new Error("Unauthorized - Token expired"));
  }
});
```

**Frontend - Unified Authentication:**

```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const [login, { data }] = useLoginMutation();
  const socket = useSocket();

  const handleLogin = async (credentials) => {
    // 1. HTTP login
    const response = await login(credentials).unwrap();

    // 2. Socket.IO authenticate with same token
    socket.auth = { token: response.accessToken };
    socket.connect();

    return response;
  };

  return { handleLogin };
};
```

**Frontend - Synchronized Token Refresh:**

```javascript
// services/api.js
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    // Token in httpOnly cookie
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // 1. Refresh HTTP token
    const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);

    if (refreshResult.data) {
      // 2. Refresh Socket.IO token
      const socket = getSocket();
      socket.auth = { token: refreshResult.data.accessToken };
      socket.disconnect().connect(); // Reconnect with new token

      // 3. Retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // 4. Both logout if refresh fails
      const socket = getSocket();
      socket.disconnect();
      api.dispatch(logout());
    }
  }

  return result;
};
```

**Critical Rules:**

- ✅ Both HTTP (user) and Socket.IO must login/init on login, logout and must httpOnly token refreshed on token expire at the same time. Never the HTTP (user) httpOnly token refreshed before/after Socket.IO or vice versa.
- ✅ Refresh BOTH when 401 occurs
- ✅ Logout BOTH when refresh fails
- ✅ Authenticate BOTH on login
- ❌ NEVER have separate authentication for HTTP and Socket.IO
- ❌ NEVER allow Socket.IO to remain connected after HTTP 401

---

### 6. TTL (Time To Live) Cleanup for Soft-Deleted Records

**✅ REQUIRED:** Soft-deleted records MUST be permanently deleted after TTL expiry period

**TTL Implementation Strategy:**

**1. Model-Level TTL Configuration:**

```javascript
// In model schemas with TTL requirement
const MaterialSchema = new mongoose.Schema({
  // ... other fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

// TTL index: Permanently delete soft-deleted records after 90 days
MaterialSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { isDeleted: true }, // Only for soft-deleted
  }
);
```

**2. Soft Delete Plugin Integration:**

```javascript
// backend/models/plugins/softDelete.js
```

**3. TTL Expiry Periods by Resource:**

```javascript
// backend/utils/constants.js
export const TTL_EXPIRY = {
  // Soft-deleted resources
  MATERIALS: 90 * 24 * 60 * 60, // 90 days
  VENDORS: 90 * 24 * 60 * 60, // 90 days
  TASKS: 180 * 24 * 60 * 60, // 180 days (6 months)
  USERS: 365 * 24 * 60 * 60, // 365 days (1 year)
  DEPARTMENTS: 365 * 24 * 60 * 60, // 365 days (1 year)
  ORGANIZATIONS: null, // Never auto-delete
  ATTACHMENTS: 30 * 24 * 60 * 60, // 30 days
  COMMENTS: 180 * 24 * 60 * 60, // 180 days
  ACTIVITIES: 90 * 24 * 60 * 60, // 90 days

  // Notifications (always expire)
  NOTIFICATIONS: 30 * 24 * 60 * 60, // 30 days (read or unread)
};
```

**4. Model Configuration Examples:**

```javascript
// Material Model
MaterialSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: TTL_EXPIRY.MATERIALS,
    partialFilterExpression: { isDeleted: true },
  }
);

// Task Model
TaskSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: TTL_EXPIRY.TASKS,
    partialFilterExpression: { isDeleted: true },
  }
);

// Notification Model (expires regardless of soft delete)
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: TTL_EXPIRY.NOTIFICATIONS }
);

// Organization Model (NO TTL - never auto-delete)
// No TTL index for organizations
```

**5. Attachment Special Handling:**

```javascript
// Attachment Model - TTL + Cloudinary cleanup
AttachmentSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: TTL_EXPIRY.ATTACHMENTS,
    partialFilterExpression: { isDeleted: true },
  }
);

// Pre-remove hook to delete from Cloudinary
AttachmentSchema.pre("remove", async function () {
  if (this.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(this.cloudinaryPublicId);
  }
});
```

**6. TTL Monitoring and Logging:**

```javascript
// backend/utils/ttlMonitor.js
import logger from "./logger.js";

// Log TTL deletions for audit trail
const setupTTLMonitoring = (models) => {
  models.forEach((Model) => {
    // MongoDB change streams to monitor TTL deletions
    const changeStream = Model.watch([{ $match: { operationType: "delete" } }]);

    changeStream.on("change", (change) => {
      logger.info("TTL deletion occurred", {
        collection: Model.collection.name,
        documentId: change.documentKey._id,
        timestamp: new Date(),
      });
    });
  });
};

export default setupTTLMonitoring;
```

**7. Manual Cleanup Utility (Backup):**

```javascript
// backend/utils/cleanupExpiredRecords.js
import mongoose from "mongoose";
import { TTL_EXPIRY } from "./constants.js";

// Manual cleanup if TTL indexes fail
export const cleanupExpiredRecords = async () => {
  const models = [Material, Vendor, Task, User, Department, Attachment];

  for (const Model of models) {
    const resourceName = Model.collection.name;
    const ttl = TTL_EXPIRY[resourceName.toUpperCase()];

    if (!ttl) continue; // Skip if no TTL

    const expiryDate = new Date(Date.now() - ttl * 1000);

    // Hard delete expired soft-deleted records
    const result = await Model.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: expiryDate },
    });

    console.log(`Cleaned up ${result.deletedCount} expired ${resourceName}`);
  }
};

// Run daily at midnight
import cron from "node-cron";
cron.schedule("0 0 * * *", cleanupExpiredRecords);
```

**8. Testing TTL Cleanup:**

```javascript
// backend/tests/unit/ttl.test.js
describe("TTL Cleanup", () => {
  it("should permanently delete material after 90 days", async () => {
    const material = await Material.create({
      name: "Test Material",
      organization: orgId,
      department: deptId,
    });

    // Soft delete
    await Material.softDeleteById(material._id);

    // Set deletedAt to 91 days ago (simulate expiry)
    await Material.findByIdAndUpdate(material._id, {
      deletedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000),
    });

    // Wait for MongoDB TTL index to process (up to 60 seconds)
    await new Promise((resolve) => setTimeout(resolve, 65000));

    // Verify hard deleted
    const deleted = await Material.findById(material._id).withDeleted();
    expect(deleted).toBeNull();
  });

  it("should NOT delete material before 90 days", async () => {
    const material = await Material.create({
      name: "Test Material",
      organization: orgId,
      department: deptId,
    });

    // Soft delete
    await Material.softDeleteById(material._id);

    // Set deletedAt to 89 days ago (not expired yet)
    await Material.findByIdAndUpdate(material._id, {
      deletedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000),
    });

    // Verify still exists
    const exists = await Material.findById(material._id).withDeleted();
    expect(exists).toBeTruthy();
    expect(exists.isDeleted).toBe(true);
  });

  it("should clear deletedAt on restore", async () => {
    const material = await Material.create({
      name: "Test Material",
      organization: orgId,
      department: deptId,
    });

    // Soft delete
    await Material.softDeleteById(material._id);

    // Restore
    await Material.restoreById(material._id);

    // Verify deletedAt is null
    const restored = await Material.findById(material._id);
    expect(restored.isDeleted).toBe(false);
    expect(restored.deletedAt).toBeNull();
  });
});
```

**Critical Rules:**

- ✅ Add `deletedAt` field to ALL models (via softDelete plugin)
- ✅ Set `deletedAt` on soft delete operations
- ✅ Clear `deletedAt` on restore operations
- ✅ Create TTL indexes with `partialFilterExpression: { isDeleted: true }`
- ✅ Use appropriate TTL periods per resource type
- ✅ Organizations NEVER have TTL (preserve data integrity)
- ✅ Notifications expire after 30 days regardless of deletion
- ✅ Attachments trigger Cloudinary cleanup before hard delete
- ✅ Log TTL deletions for audit trail
- ✅ Test TTL cleanup in integration tests
- ❌ NEVER set TTL on Organizations
- ❌ NEVER hard delete without TTL expiry
- ❌ NEVER omit `deletedAt` timestamp on soft delete

---

## Summary of Technical Requirements

Before implementing ANY backend code, verify:

1. ✅ Organization and department scoping applied (except documented exceptions)
2. ✅ SoftDelete plugin methods used exclusively
3. ✅ All schema methods, statics, virtuals utilized
4. ✅ All ref paths populated with all fields
5. ✅ HTTP and Socket.IO authentication synchronized
6. ✅ TTL cleanup configured for soft-deleted records

---

## Phase 1: Backend Production Readiness (BLOCKING)

### Phase 1.1: Backend Core Components

> [!CAUTION] > **MANDATORY: Before changing ANY file in Phase 1.1**
>
> 1. **Read the ENTIRE existing file first** - Understand what currently exists
> 2. **Document current behavior** - Note patterns, structure, dependencies
> 3. **Justify the change** - Why is this change necessary for production readiness?
> 4. **Respect existing architecture** - Work WITH the codebase, not against it
> 5. **Plan integration** - How will changes integrate with existing code?
>
> **Do NOT:**
>
> - Skip reading existing files
> - Make assumptions about current implementation
> - Impose arbitrary new patterns
> - Break existing functionality
>
> Each subsection below follows **WHAT-WHY-HOW** format.

#### 1. Configuration and Application Setup

##### [backend/app.js](backend/app.js)

**WHAT:** Validate middleware order and security configuration

**WHY:** Proper middleware order is critical for security. Helmet must be first to set security headers, CORS second to handle cross-origin requests, sanitization after parsing to prevent NoSQL injection.

**HOW:**

1. Verify middleware order: helmet → cors → cookieParser → express.json → mongoSanitize → compression → rateLimiter
2. Configure Helmet CSP to include Cloudinary CDN
3. Verify CORS credentials support
4. Set request size limit to 10mb
5. Add request ID middleware for tracing
6. Set compression threshold to 1KB
7. Verify rate limiting on all API routes

**Tests:**

- Test middleware order execution
- Test security headers in responses
- Test CORS with credentials
- Test rate limiting enforcement

##### [backend/server.js](backend/server.js)

**WHAT:** Implement graceful shutdown and environment validation

**WHY:** Graceful shutdown prevents data loss and connection leaks. Environment validation catches configuration errors early. Health checks enable monitoring.

**HOW:**

1. Add environment variable validation on startup
2. Implement graceful shutdown handlers for HTTP, Socket.IO, MongoDB
3. Add health check endpoint (`/health`)
4. Set timezone to UTC (`process.env.TZ = 'UTC'`)

**Tests:**

- Test graceful shutdown on SIGTERM/SIGINT
- Test health check endpoint
- Test environment validation with missing vars

##### [backend/config/db.js](config/db.js)

**WHAT:** Configure MongoDB for production

**WHY:** Production databases require connection pooling for performance, timeouts to prevent hanging, and retry logic for resilience.

**HOW:**

1. Configure connection pooling (minPoolSize, maxPoolSize)
2. Set connection timeouts (serverSelectionTimeoutMS, socketTimeoutMS)
3. Implement retry logic with exponential backoff
4. Add error handling

**Tests:**

- Test successful connection
- Test connection failure and retry
- Test connection pool limits

##### CORS Configuration

**Files:** [backend/config/corsOptions.js](backend/config/corsOptions.js), [backend/config/allowedOrigins.js](backend/config/allowedOrigins.js)

**WHAT:** Validate CORS configuration for production

**WHY:** CORS misconfigurations can block legitimate requests or allow unauthorized cross-origin access.

**HOW:**

1. Verify allowed origins include CLIENT_URL from env
2. Ensure credentials: true
3. Verify methods (GET, POST, PUT, PATCH, DELETE)
4. Verify headers (Content-Type, Authorization)

---

#### 2. Model Layer and Soft Delete Plugin

##### [backend/models/plugins/softDelete.js](backend/models/plugins/softDelete.js)

**WHAT:** Implement universal soft delete plugin

**WHY:** Soft delete is the foundation of data recovery. Hard deletes must be prevented to ensure data can be restored.

**HOW:**

1. Override `remove()` to throw error (prevent hard delete)
2. Implement `pre('find')` middleware to filter `isDeleted: false`
3. Add `restore()` method to set `isDeleted: false`
4. Add `findDeleted()` static method to query deleted records

**Tests:**

- Property-based test: Verify hard delete is prevented
- Test queries filter soft-deleted by default
- Test restore functionality

##### [backend/models/Organization.js](backend/models/Organization.js)

**WHAT:** Add platform organization identification field

**WHY:** `isPlatformOrg` field enables platform organization identification without environment variables, improving configurability.

**HOW:**

1. Add `isPlatformOrg: { type: Boolean, default: false }` to schema
2. Add index on `isPlatformOrg`
3. Verify softDelete plugin applied
4. Implement cascade delete hooks for all children (departments, users, tasks, materials, vendors)

**Tests:**

- Test `isPlatformOrg` field
- Test cascade delete to all children

##### [backend/models/User.js](backend/models/User.js)

**WHAT:** Add user role identification fields and secure password handling

**WHY:** `isPlatformUser` and `isHod` (Head of Department) fields enable role-based identification. Password hashing with ≥12 rounds ensures security. Query exclusion prevents accidental password leaks.

**HOW:**

1. Add `isPlatformUser: { type: Boolean, default: false }`
2. Add `isHod: { type: Boolean, default: false }`
3. Verify password hashing in `pre('save')` with `bcrypt.hash(password, 12)`
4. Add `select: false` to password, refreshToken, refreshTokenExpiry
5. Verify indexes on email+organization (unique), organization, department
6. Implement cascade delete hooks (user's tasks, comments, activities)

**Tests:**

- Test password hashing on create/update
- Test sensitive fields excluded from queries
- Test cascade delete to user's resources

##### Task Models

**Files:** [BaseTask.js](backend/models/BaseTask.js), [ProjectTask.js](backend/models/ProjectTask.js), [RoutineTask.js](backend/models/RoutineTask.js), [AssignedTask.js](backend/models/AssignedTask.js)

**WHAT:** Validate discriminator pattern and cascade delete

**WHY:** Discriminator pattern enables inheritance. Cascade delete ensures orphaned resources are soft-deleted.

**HOW:**

1. Verify BaseTask uses `discriminatorKey: 'taskType'`
2. Verify ProjectTask, RoutineTask, AssignedTask extend BaseTask
3. Implement cascade delete hooks (comments, activities, attachments)
4. Verify indexes on organization, department, createdBy

**Tests:**

- Test discriminator inheritance
- Test type-specific validation
- Test cascade delete to comments, activities, attachments

##### Supporting Models

**Files:** [TaskComment.js](backend/models/TaskComment.js), [TaskActivity.js](backend/models/TaskActivity.js), [Attachment.js](backend/models/Attachment.js), [Material.js](backend/models/Material.js), [Vendor.js](backend/models/Vendor.js), [Notification.js](backend/models/Notification.js)

**WHAT:** Apply soft delete and special constraints

**WHY:** Supporting models require soft delete for recovery. Special constraints ensure data integrity.

**HOW:**

1. Verify softDelete plugin on all models
2. Add indexes on organization, department
3. Special handling:
   - TaskComment: max depth 3 validation
   - Attachment: Cloudinary integration
   - Notification: TTL implementation

**Tests:**

- Test soft delete on all models
- Test TaskComment max depth 3 enforcement
- Test Notification TTL expiry

---

#### 3. Utility Functions and Helpers

##### [backend/utils/helpers.js](backend/utils/helpers.js) - Cascade Delete/Restore

**WHAT:** Implement cascade soft delete and restore with transactions

**WHY:** Cascade operations ensure referential integrity. Transactions prevent partial deletes. Depth limits prevent infinite loops.

**HOW:**

```
Cascade Relationships:

Organization (soft delete)
  ├── Departments (cascade)
  │   ├── Users (cascade)
  │   │   ├── Tasks (cascade)
  │   │   ├── Comments (cascade)
  │   │   └── Activities (cascade)
  │   └── Tasks (cascade)
  ├── Users (cascade)
  ├── Tasks (cascade)
  │   ├── Comments (cascade)
  │   ├── Activities (cascade)
  │   └── Attachments (cascade + Cloudinary delete)
  ├── Materials (cascade)
  └── Vendors (cascade)
```

Implementation:

1. `cascadeDelete(model, id, session)`:

   - Start MongoDB session/transaction
   - Recursively soft-delete children
   - Track visited entities (prevent circular dependencies)
   - Enforce max depth limit (e.g., 10)
   - Commit transaction or rollback on error

2. `cascadeRestore(model, id, session)`:
   - Validate parent exists and not deleted
   - Recursively restore children
   - Use transaction

**Tests (CRITICAL):**

- ❗ Organization delete → verify ALL children soft-deleted
- ❗ Department delete → verify tasks and users soft-deleted
- ❗ Task delete → verify comments, activities, attachments soft-deleted
- ❗ User delete → verify user's tasks, comments, activities soft-deleted
- ❗ Restore → verify parent existence validation
- ❗ Transaction rollback → verify no partial deletes
- ❗ Circular dependency handling
- ❗ Depth limit enforcement

##### [backend/utils/constants.js](backend/utils/constants.js)

**WHAT:** Centralize all enums and constants

**WHY:** Constants are the single source of truth. Hardcoded values cause maintenance issues.

**HOW:**

1. Verify all enums exist (USER_ROLES, TASK_STATUS, TASK_PRIORITY, TASK_TYPE, etc.)
2. Search codebase for hardcoded values
3. Replace hardcoded values with constants
4. Document all constants

##### [backend/utils/generateTokens.js](backend/utils/generateTokens.js)

**WHAT:** Centralize JWT token generation

**WHY:** Centralized generation ensures consistency between HTTP and Socket.IO. Token rotation improves security.

**HOW:**

1. Implement `generateAccessToken(user)` - 15min expiry
2. Implement `generateRefreshToken(user)` - 7 days expiry
3. Use same JWT secrets for HTTP and Socket.IO
4. Implement refresh token rotation

**Tests:**

- Test token generation
- Test token expiry
- Test refresh token rotation

##### Socket.IO Configuration

**Files:** [socket.js](backend/utils/socket.js), [socketEmitter.js](backend/utils/socketEmitter.js), [socketInstance.js](backend/utils/socketInstance.js)

**WHAT:** Configure Socket.IO for real-time updates

**WHY:** Singleton prevents multiple instances. JWT authentication ensures security. Room-based broadcasting enables scoped updates.

**HOW:**

1. Implement singleton pattern in `socketInstance.js`
2. Add JWT authentication in connection handler
3. Implement room joining (`user:userId`, `dept:deptId`, `org:orgId`)
4. Implement event handlers (connection, disconnection, status)
5. Implement event emitters (task, notification events)

**Tests:**

- Integration test: connection/disconnection
- Test JWT authentication
- Test room joining and broadcasting

##### Timezone Management

**WHAT:** Standardize all dates to UTC

**WHY:** UTC standardization prevents timezone confusion. ISO format ensures consistent parsing.

**HOW:**

1. Set `process.env.TZ = 'UTC'` at top of `server.js`
2. Configure Dayjs with UTC and timezone plugins
3. Create date utility functions for UTC conversion
4. Update controllers to convert incoming dates to UTC

**Tests:**

- Test date storage in UTC
- Test API responses in ISO format

---

#### 4. Middleware Layer

##### [backend/middlewares/authMiddleware.js](backend/middlewares/authMiddleware.js)

**WHAT:** Validate JWT authentication

**WHY:** Cookie-based JWT improves security (httpOnly prevents XSS). Proper error codes enable frontend behavior.

**HOW:**

1. Extract JWT from `req.cookies.accessToken`
2. Verify JWT with `JWT_ACCESS_SECRET`
3. Populate `req.user` with decoded user
4. Throw 401 CustomError for invalid/missing/expired tokens

**Tests:**

- Test valid token populates req.user
- Test invalid/missing/expired token returns 401

##### Authorization Matrix Replacement

**File:** [backend/config/authorizationMatrix.json](backend/config/authorizationMatrix.json)

**WHAT:** Replace with new configuration

**WHY:** New matrix reflects updated business rules for role-based access control.

**HOW:**
Complete replacement with structure:

```json
{
  "SuperAdmin": {
    "scope": {
      "own": ["read", "write", "delete"],
      "ownDept": ["read", "write", "delete"],
      "crossDept": ["read"],
      "crossOrg": ["read", "write", "delete"]
    },
    "resources": {
      "users": ["create", "read", "update", "delete", "restore"],
      ...
    }
  },
  ...
}
```

##### [backend/middlewares/authorization.js](backend/middlewares/authorization.js)

**WHAT:** Implement matrix-based authorization with ownership verification

**WHY:** Matrix-based authorization centralizes permission logic. Ownership verification ensures users can only modify their own resources.

**HOW:**

1. Load authorization matrix
2. Implement `checkPermission(user, resource, operation, scope)`
3. Implement `checkOwnership(user, resource, document)`
   - Ownership fields by resource:
     - tasks: createdBy, assignees
     - attachments: uploadedBy
     - comments/activities: createdBy
     - notifications: recipients
     - materials: createdBy, uploadedBy
     - vendors: createdBy
4. Verify platform SuperAdmin cross-org rules
5. Throw 403 CustomError for insufficient permissions

**Tests (COMPREHENSIVE):**

- Test each role's permissions for each resource
- Test ownership verification for all resources
- Test platform SuperAdmin cross-org access
- Test customer org user restrictions
- Test 403 errors

##### [backend/middlewares/rateLimiter.js](backend/middlewares/rateLimiter.js)

**WHAT:** Configure rate limiting

**WHY:** Rate limiting prevents abuse and DDoS attacks.

**HOW:**

1. General API: 100 requests per 15 minutes
2. Auth endpoints: 5 requests per 15 minutes
3. Use Redis in production, memory-based in development

##### Validators

**Directory:** [backend/middlewares/validators/](backend/middlewares/validators/)

**WHAT:** Validate all request inputs

**WHY:** Validators are the source of truth for field names and constraints.

**HOW:**

1. Verify field names match controller expectations
2. Verify required/optional fields
3. Verify enum validation uses constants
4. Verify ObjectId validation for references

---

#### 5. Service Layer

##### [backend/services/emailService.js](backend/services/emailService.js)

**WHAT:** Validate email service

**WHY:** Asynchronous email prevents blocking. Queue ensures emails are sent even if immediate sending fails.

**HOW:**

1. Verify Nodemailer Gmail SMTP configuration
2. Implement email queue
3. Add error handling and graceful degradation

**Tests:**

- Test email sending success/failure
- Test queue processing
- Mock SMTP connection

##### [backend/services/notificationService.js](backend/services/notificationService.js)

**WHAT:** Validate notification service

**HOW:**

1. Verify notification creation
2. Verify recipient handling
3. Verify entity linking
4. Integrate with Socket.IO emitter

---

#### 6. Testing Phase 1.1

**Test Structure:**

```
backend/tests/
├── unit/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   ├── services/
│   └── utils/
├── integration/
│   ├── auth.test.js
│   ├── cascade.test.js (CRITICAL)
│   ├── socket.test.js
│   └── ...
└── property/
    └── models.test.js
```

**Critical Tests:**

- Unit tests for all modules
- Property-based tests for models
- ❗ CASCADE TESTS (organization → all children, department → users+tasks, etc.)
- Integration tests for Socket.IO
- Coverage >80%

3. Vendor
4. Attachment
5. Notification
6. Task
7. TaskActivity
8. TaskComment
9. User
10. Department
11. Organization

---

#### Standard Pattern for Each Module

For each module, follow this 4-step pattern:

##### Step 1: Validate Validator (`middlewares/validators/*Validators.js`)

**WHAT to verify:**

- All field names match exactly with backend controllers
- All validation rules match business requirements
- ObjectId validation for all reference fields
- Enum validation uses constants (not hardcoded values)
- Required vs optional fields correctly specified
- Custom validation logic (e.g., email format, password strength)

**HOW:**

1. Read validator file
2. Cross-reference with controller to verify field names
3. Cross-reference with model schema to verify constraints
4. Verify enums import from constants.js
5. Check for hardcoded validation values

**Example validators to check:**

```javascript
// Field names must match controller expectations
body("organizationId").isMongoId();
body("departmentId").isMongoId();
body("status").isIn(TASK_STATUS); // ✅ Uses constant
body("priority").isIn(["Low", "Medium", "High"]); // ❌ Hardcoded
```

##### Step 2: Validate Controller (`controllers/*Controllers.js`)

**WHAT to verify:**

- CRUD operations (Create, Read, Update, Delete, Restore)
- Organization/department scoping on ALL operations
- Soft delete implementation (sets isDeleted, doesn't remove)
- Restore functionality (validates parent exists)
- Pagination (uses mongoose-paginate-v2, 1-based pages)
- Authorization integration (checks permissions before operations)
- Error handling (proper CustomError usage)
- Response formatting (consistent structure)
- Date handling (converts to UTC)

**HOW:**

1. Read controller file
2. Verify each operation function:
   - **Create:** Scopes to req.user.organization/department, validates ownership
   - **Read (List):** Filters by organization/department, implements pagination
   - **Read (Single):** Verifies access permissions
   - **Update:** Validates ownership, scopes to organization/department
   - **Delete:** Soft delete only (sets isDeleted=true), triggers cascade if applicable
   - **Restore:** Validates parent not deleted, restores children
3. Check error handling (try/catch with CustomError)
4. Verify response format consistency

**Scoping example:**

```javascript
// ✅ Correct - scoped to organization and department
const materials = await Material.find({
  organization: req.user.organization._id,
  department: req.user.department._id,
  isDeleted: false,
});

// ❌ Wrong - no scoping
const materials = await Material.find({ isDeleted: false });
```

##### Step 3: Validate Routes (`routes/*Routes.js`)

**WHAT to verify:**

- All routes defined for the resource
- Middleware order: `authMiddleware` → `validator` → `authorization` → `controller`
- Rate limiting applied appropriately
- HTTP methods match operations (GET, POST, PUT, PATCH, DELETE)
- Route paths follow RESTful conventions

**HOW:**

1. Read routes file
2. For EACH route, verify:
   - Authentication middleware is first
   - Validation middleware is second
   - Authorization middleware is third (with correct resource and operation)
   - Controller function is last
3. Verify rate limiting on sensitive endpoints

**Route middleware order example:**

```javascript
// ✅ Correct order
router.post(
  "/",
  authMiddleware, // 1. Authenticate
  materialValidators.create, // 2. Validate
  authorize("materials", "create"), // 3. Authorize
  materialControllers.create // 4. Execute
);

// ❌ Wrong order
router.post(
  "/",
  materialValidators.create, // Validation before auth!
  authMiddleware,
  materialControllers.create
);
```

##### Step 4: Create Comprehensive Frontend-Simulating Tests

> [!CAUTION] > **This is the most critical step.** Tests MUST simulate ALL possible frontend scenarios for production readiness.

**Test Categories (ALL REQUIRED):**

###### A. CRUD Operation Tests

Test ALL CRUD operations for EACH route:

```javascript
describe("Material CRUD Operations", () => {
  describe("POST /api/materials (Create)", () => {
    it("should create material with valid data", async () => {
      // Simulate frontend sending valid material data
    });

    it("should create material with minimum required fields", async () => {
      // Test with only required fields
    });

    it("should create material with all optional fields", async () => {
      // Test with all fields populated
    });

    it("should fail with missing required fields", async () => {
      // Test validation errors
    });

    it("should fail with invalid field types", async () => {
      // Test type validation
    });

    it("should scope to user organization and department", async () => {
      // Verify resource created with correct org/dept
    });
  });

  describe("GET /api/materials (List)", () => {
    it("should return paginated materials", async () => {
      // Test pagination works
    });

    it("should filter by organization and department", async () => {
      // Verify multi-tenancy isolation
    });

    it("should exclude soft-deleted materials", async () => {
      // Verify isDeleted filtering
    });

    it("should support query filters", async () => {
      // Test filtering by category, vendor, etc.
    });

    it("should support sorting", async () => {
      // Test sort by name, createdAt, etc.
    });

    it("should handle empty results", async () => {
      // Test when no materials exist
    });
  });

  describe("GET /api/materials/:id (Get Single)", () => {
    it("should return material by id", async () => {
      // Test successful retrieval
    });

    it("should fail with invalid ObjectId", async () => {
      // Test 400 error for invalid id
    });

    it("should fail with non-existent id", async () => {
      // Test 404 error
    });

    it("should fail for material in different organization", async () => {
      // Test multi-tenancy isolation
    });
  });

  describe("PUT /api/materials/:id (Update)", () => {
    it("should update material with valid data", async () => {
      // Test successful update
    });

    it("should update only provided fields", async () => {
      // Test partial updates
    });

    it("should fail to update immutable fields", async () => {
      // Test organizationId, departmentId cannot be changed
    });

    it("should fail with invalid data", async () => {
      // Test validation on update
    });
  });

  describe("DELETE /api/materials/:id (Soft Delete)", () => {
    it("should soft delete material", async () => {
      // Verify isDeleted set to true
    });

    it("should not physically remove from database", async () => {
      // Verify document still exists
    });

    it("should exclude from normal queries", async () => {
      // Verify filtering works
    });

    it("should handle vendor reassignment if required", async () => {
      // Vendor-specific test
    });
  });

  describe("PATCH /api/materials/:id/restore (Restore)", () => {
    it("should restore soft-deleted material", async () => {
      // Verify isDeleted set to false
    });

    it("should fail if parent is deleted", async () => {
      // Test parent validation
    });

    it("should fail for non-deleted material", async () => {
      // Test error handling
    });
  });
});
```

###### B. Authorization Tests (ALL ROLES)

Test EVERY role's permissions for EVERY operation:

```javascript
describe("Material Authorization", () => {
  describe("SuperAdmin (Platform)", () => {
    it("should create materials", async () => {
      // Test create permission
    });

    it("should read materials across all organizations", async () => {
      // Test crossOrg read
    });

    it("should update materials", async () => {
      // Test update permission
    });

    it("should delete materials", async () => {
      // Test delete permission
    });

    it("should restore materials", async () => {
      // Test restore permission
    });
  });

  describe("SuperAdmin (Customer Org)", () => {
    it("should create materials in own organization", async () => {
      // Test ownOrg permissions
    });

    it("should NOT access other organizations", async () => {
      // Test multi-tenancy isolation
    });

    it("should read cross-department materials", async () => {
      // Test crossDept read
    });
  });

  describe("Admin", () => {
    it("should create materials in own department", async () => {
      // Test ownDept create
    });

    it("should read cross-department materials", async () => {
      // Test crossDept read
    });

    it("should update own materials", async () => {
      // Test own update
    });

    it("should NOT delete cross-department materials", async () => {
      // Test 403 error
    });
  });

  describe("Manager", () => {
    it("should create materials in own department", async () => {
      // Test create permission
    });

    it("should read materials in own department", async () => {
      // Test ownDept read
    });

    it("should update own materials", async () => {
      // Test own update
    });

    it("should NOT delete materials", async () => {
      // Per authorization matrix
    });
  });

  describe("User", () => {
    it("should read materials in own department", async () => {
      // Test read permission
    });

    it("should NOT create materials", async () => {
      // Test 403 error
    });

    it("should NOT update materials", async () => {
      // Test 403 error
    });

    it("should NOT delete materials", async () => {
      // Test 403 error
    });
  });
});
```

###### C. Validation Error Tests

Test ALL validation rules:

```javascript
describe("Material Validation", () => {
  it("should fail with missing name", async () => {
    // Test required field validation
  });

  it("should fail with name > 100 characters", async () => {
    // Test max length validation
  });

  it("should fail with invalid category enum", async () => {
    // Test enum validation
  });

  it("should fail with negative quantity", async () => {
    // Test number validation
  });

  it("should fail with invalid vendorId ObjectId", async () => {
    // Test ObjectId validation
  });

  it("should fail with non-existent vendorId", async () => {
    // Test reference validation
  });
});
```

###### D. Edge Case Tests

Test ALL edge cases:

```javascript
describe("Material Edge Cases", () => {
  it("should handle concurrent updates", async () => {
    // Test race conditions
  });

  it("should handle duplicate names in same department", async () => {
    // Test uniqueness constraints
  });

  it("should handle duplicate names in different departments", async () => {
    // Should be allowed
  });

  it("should handle very long descriptions (max length)", async () => {
    // Test boundary values
  });

  it("should handle zero quantity", async () => {
    // Test boundary values
  });

  it("should handle maximum quantity", async () => {
    // Test boundary values
  });

  it("should handle special characters in name", async () => {
    // Test input sanitization
  });

  it("should handle SQL injection attempts", async () => {
    // Test NoSQL injection prevention
  });

  it("should handle XSS attempts in description", async () => {
    // Test input sanitization
  });
});
```

###### E. Multi-Tenancy Isolation Tests

Test organization and department isolation:

```javascript
describe("Material Multi-Tenancy", () => {
  it("should NOT access materials from other organizations", async () => {
    // Create material in org1, try to access from org2
  });

  it("should NOT access materials from other departments (User role)", async () => {
    // Create material in dept1, try to access from dept2
  });

  it("should access cross-department materials (Admin role)", async () => {
    // Verify crossDept read works
  });

  it("should filter list by organization automatically", async () => {
    // Verify scoping on list
  });

  it("should filter list by department for non-crossDept roles", async () => {
    // Verify department scoping
  });
});
```

###### F. Error Scenario Tests

Test ALL HTTP error codes:

```javascript
describe("Material Error Scenarios", () => {
  describe("400 Bad Request", () => {
    it("should return 400 for invalid ObjectId", async () => {
      // Test malformed id
    });

    it("should return 400 for validation errors", async () => {
      // Test validation failures
    });
  });

  describe("401 Unauthorized", () => {
    it("should return 401 without auth token", async () => {
      // Test missing authentication
    });

    it("should return 401 with invalid token", async () => {
      // Test invalid JWT
    });

    it("should return 401 with expired token", async () => {
      // Test token expiry
    });
  });

  describe("403 Forbidden", () => {
    it("should return 403 for insufficient permissions", async () => {
      // Test authorization failure
    });

    it("should return 403 for cross-org access", async () => {
      // Test multi-tenancy
    });

    it("should return 403 for cross-dept access (User role)", async () => {
      // Test department isolation
    });
  });

  describe("404 Not Found", () => {
    it("should return 404 for non-existent material", async () => {
      // Test valid ObjectId but no document
    });

    it("should return 404 for soft-deleted material", async () => {
      // Test isDeleted filtering
    });
  });

  describe("409 Conflict", () => {
    it("should return 409 for duplicate names (if applicable)", async () => {
      // Test unique constraints
    });
  });

  describe("500 Internal Server Error", () => {
    it("should return 500 for database errors", async () => {
      // Test error handling
    });

    it("should rollback transaction on cascade delete failure", async () => {
      // Test transaction handling
    });
  });
});
```

###### G. Frontend Behavior Simulation Tests

Simulate real frontend scenarios:

```javascript
describe("Material Frontend Scenarios", () => {
  describe("Material Creation Flow", () => {
    it("should simulate complete material creation from frontend", async () => {
      // 1. User fills form
      // 2. Frontend validates (client-side)
      // 3. Frontend sends POST request
      // 4. Backend validates
      // 5. Backend creates material
      // 6. Backend returns created material
      // 7. Frontend displays success
    });

    it("should handle form submission with invalid data", async () => {
      // Simulate validation error flow
    });
  });

  describe("Material List Page Load", () => {
    it("should load first page of materials", async () => {
      // Simulate page load with default pagination
    });

    it("should load with filters applied", async () => {
      // Simulate filtered query
    });

    it("should handle pagination changes", async () => {
      // Simulate page 2, 3, etc.
    });
  });

  describe("Material Update Flow", () => {
    it("should simulate edit form → update → refresh", async () => {
      // 1. Fetch material
      // 2. Populate edit form
      // 3. Update fields
      // 4. Submit update
      // 5. Verify changes
    });
  });

  describe("Material Delete Flow", () => {
    it("should simulate delete confirmation → soft delete → refresh", async () => {
      // 1. Click delete button
      // 2. Confirm deletion
      // 3. DELETE request
      // 4. Verify soft deleted
      // 5. Verify removed from list
    });
  });

  describe("Material Restore Flow", () => {
    it("should simulate restore → refresh → show in list", async () => {
      // 1. View deleted materials
      // 2. Click restore
      // 3. PATCH restore request
      // 4. Verify restored
      // 5. Verify appears in main list
    });
  });
});
```

---

#### Module-Specific Testing Requirements

##### Authentication Module

**Additional tests:**

- Brute-force protection (5 failed attempts → temporary block)
- Token rotation on refresh
- Logout invalidates tokens
- Concurrent login attempts
- Session hijacking prevention
- CSRF protection

##### Attachment Module

**Additional tests:**

- Cloudinary cleanup on delete
- Cloudinary cleanup on failed create/update
- Unlinking from all parent references
- File type validation
- File size validation
- Multiple file upload

##### Task Module

**Additional tests:**

- Type-specific validation (ProjectTask, RoutineTask, AssignedTask)
- Cascade delete to comments, activities, attachments
- Assignee validation
- Watcher validation
- Material linking
- Cost tracking (ProjectTask only)
- Routine task restrictions (no "To Do" status, no "Low" priority)

##### TaskComment Module

**Additional tests:**

- Max depth 3 enforcement
- Parent validation (task, activity, or comment)
- Mention validation
- Nested comment retrieval

##### User Module

**Additional tests:**

- Password hashing on create
- Password hashing on update
- Cascade delete to user's tasks, comments, activities
- Platform user creation (platform SuperAdmin only)
- Email uniqueness per organization

##### Organization Module

**Additional tests:**

- NO CREATE ROUTE (should return 404 or 405)
- Cascade delete to ALL children (departments, users, tasks, materials, vendors)
- Platform organization cannot be deleted

---

#### Test Structure for Phase 1.2

```
backend/tests/
├── integration/
│   ├── auth.test.js
│   ├── material.test.js
│   ├── vendor.test.js
│   ├── attachment.test.js
│   ├── notification.test.js
│   ├── task.test.js
│   ├── taskActivity.test.js
│   ├── taskComment.test.js
│   ├── user.test.js
│   ├── department.test.js
│   └── organization.test.js
└── scenarios/
    ├── material-scenarios.test.js
    ├── task-scenarios.test.js
    └── user-scenarios.test.js
```

Each test file MUST include:

1. CRUD operation tests
2. Authorization tests for ALL roles
3. Validation error tests
4. Edge case tests
5. Multi-tenancy isolation tests
6. Error scenario tests (400, 401, 403, 404, 409, 500)
7. Frontend behavior simulation tests

---

#### Success Criteria for Each Module

A module is considered complete when:

✅ All validators verified and use constants
✅ All controllers implement proper scoping
✅ All routes follow middleware order
✅ ALL route operations have tests
✅ ALL roles have authorization tests
✅ ALL validation rules have tests
✅ ALL edge cases have tests
✅ ALL error scenarios have tests
✅ Frontend behavior scenarios simulated
✅ Test coverage >80% for the module
✅ All tests passing
✅ No hardcoded values found
✅ Documentation updated

---

## Phase 2: Frontend Production Readiness

> [!CAUTION] > **MANDATORY: Before changing ANY frontend file in Phase 2**
>
> 1. **Read the ENTIRE existing file first** - Understand current React/Redux/MUI implementation
> 2. **Map current data flow** - Trace: Redux store → RTK Query → Components → UI
> 3. **Identify existing patterns** - Note component structure, hooks usage, styling approach
> 4. **Document current behavior** - How does the frontend currently work?
> 5. **Check backend alignment** - Does frontend match backend API contracts?
> 6. **Justify the change** - Why is this change necessary for production readiness?
> 7. **Respect existing code** - Build on existing implementation, don't rewrite unnecessarily
>
> **Do NOT:**
>
> - Rewrite working components arbitrarily
> - Change established UI patterns without justification
> - Break existing user flows
> - Ignore existing theme/styling approach
> - Make changes that break backend integration
>
> Each subsection below follows **WHAT-WHY-HOW** format.

### 1. Configuration and Constants

#### Synchronize Constants

**WHAT:** Match [client/src/utils/constants.js](client/src/utils/constants.js) with [backend/utils/constants.js](backend/utils/constants.js)

**WHY:** Constants synchronization ensures consistency.

**HOW:**

1. Compare backend and frontend constants
2. Update frontend to match backend
3. Search for hardcoded values: `"Completed"`, `"Admin"`, `"High"`
4. Replace ALL with constant imports

**Example:**

```javascript
// ❌ Wrong
if (status === "Completed") { ... }

// ✅ Correct
import { TASK_STATUS } from '../utils/constants';
if (status === TASK_STATUS[2]) { ... }
```

#### Remove Platform Organization Environment Variable

**WHAT:** Remove `VITE_PLATFORM_ORG` from [client/.env](client/.env)

**WHY:** Database fields are more flexible than environment variables.

**HOW:**

1. Search for `VITE_PLATFORM_ORG` usage
2. Replace with `isPlatformOrg` field from API
3. Remove from .env

---

### 2. Timezone Management

**WHAT:** Implement UTC ↔ local conversion

**WHY:** Consistent timezone handling prevents date confusion.

**HOW:**

1. Configure dayjs with UTC and timezone plugins
2. Create utilities:
   - `toUTC(localDate)` - Convert local to UTC
   - `toLocal(utcDate)` - Convert UTC to local
3. Update all date displays to use `toLocal`
4. Update all date inputs to use `toUTC`

---

### 3. Component Validation

#### Remove Hardcoded Styling

**WHAT:** Use theme throughout

**WHY:** Theme-first approach ensures consistency.

**HOW:**

1. Search for hardcoded values: `color:`, `fontSize:`, `padding:`
2. Replace with theme references

**Example:**

```javascript
// ❌ Wrong
<Box style={{ color: '#1976d2', padding: '16px' }}>

// ✅ Correct
<Box sx={{ color: 'primary.main', p: 2 }}>
```

#### Update Grid to MUI v7

**WHAT:** Replace `item` prop with `size` prop

**Example:**

```javascript
// ❌ Wrong
<Grid item xs={12} md={6}>

// ✅ Correct
<Grid size={{ xs: 12, md: 6 }}>
```

#### Update Autocomplete

**WHAT:** Replace `renderTags` with `slots`

**Example:**

```javascript
// ❌ Wrong
<Autocomplete renderTags={...} />

// ✅ Correct
<Autocomplete slots={{ tag: CustomTag }} />
```

#### Add Dialog Accessibility

**WHAT:** Add required accessibility props to all dialogs

**Example:**

```javascript
<Dialog
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTitle id="dialog-title">Title</DialogTitle>
  <DialogContent id="dialog-description">Content</DialogContent>
</Dialog>
```

---

### 4. React Hook Form

**WHAT:** Remove all `watch()` usage

**WHY:** `watch()` causes unnecessary re-renders.

**HOW:**

1. Search for `watch(`
2. Replace with controlled components using `Controller`

**Example:**

```javascript
// ❌ Wrong
const { watch } = useForm();
const value = watch("field");

// ✅ Correct
const { control } = useForm();
<Controller
  name="field"
  control={control}
  render={({ field }) => <MuiTextField {...field} />}
/>;
```

---

### 5. Error Handling

#### ErrorBoundary

**WHAT:** Implement using `react-error-boundary`

**WHY:** Prevents entire app crashes.

**HOW:**

1. Update [ErrorBoundary.jsx](client/src/components/common/ErrorBoundary.jsx)
2. Wrap root app
3. Add nested boundaries for critical components

#### RouteError

**WHAT:** Handle API errors

**WHY:** Proper error handling improves UX.

**HOW:**

1. Handle 4xx, 5xx errors
2. 401 → logout user automatically
3. 403 → show error message, do NOT logout
4. Show toast notifications

---

### 6. File Upload

**WHAT:** Validate Cloudinary upload flow

**Flow:** Client → Cloudinary → Backend

**Components:**

- `react-dropzone` - File selection
- `react-photo-album` - Gallery view
- `yet-another-react-lightbox` - Lightbox

**HOW:**

1. Verify [MuiFileUpload.jsx](client/src/components/common/MuiFileUpload.jsx) uses react-dropzone
2. Verify Cloudinary upload
3. Verify backend receives URL
4. Implement gallery and lightbox

---

### 7. Testing and Optimization

**Testing:**

- Test all pages and forms
- Test authentication and authorization UI
- Test real-time features
- Test file upload
- Test responsive design

**Optimization:**

- Code splitting (lazy load routes)
- React.memo for list/card components
- useCallback for event handlers
- useMemo for computed values
- Bundle size <500KB initial load

---

## Verification Plan

### Backend Automated Tests

```bash
cd backend
npm test
npm run test:coverage
```

**Requirements:**

- All tests passing
- Coverage >80%

### Frontend Automated Tests

```bash
cd client
npm test
npm run build
```

**Requirements:**

- All tests passing
- Production build succeeding
- Bundle size <500KB

### Manual Verification

**Backend:**

- Health check endpoint
- All API endpoints with Postman
- Cascade delete/restore operations
- Socket.IO connection and events
- Email service
- Rate limiting

**Frontend:**

- All pages load
- Authentication flow
- Authorization (different roles)
- Real-time updates
- File upload to Cloudinary
- Responsive design
- Error boundaries

---

## Success Criteria

### ✅ Phase 1 Complete When:

- All backend files validated and corrected
- Cascade delete/restore working flawlessly
- All tests passing (unit, integration, cascade, property)
- Coverage >80%
- No npm audit vulnerabilities
- Environment variables documented
- API documentation complete
- Logging implemented
- Rate limiting configured
- Security headers validated
- Database indexes created
- Socket.IO authentication working
- Email service functional
- Production deployment checklist created

### ✅ Phase 2 Complete When:

- All frontend files validated and corrected
- All pages aligned with backend APIs
- All forms validated with proper error handling
- Theme integrated throughout
- Responsive design on all devices
- Authentication/authorization UI working
- Real-time features functional
- File upload working with preview
- Error boundaries catching all errors
- Loading and empty states implemented
- Accessibility validated
- Performance optimized
- No npm audit vulnerabilities
- Production build succeeding
- Environment variables documented
- User documentation added
- All 735 and the above requirements must be completed

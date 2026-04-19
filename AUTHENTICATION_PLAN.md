// Authentication Plan for Parking Spot Finder

/**
 * JWT-BASED AUTHENTICATION SYSTEM DESIGN
 * ======================================
 * 
 * OVERVIEW:
 * - Token-based stateless authentication using JWT (JSON Web Tokens)
 * - Separate user roles: USER (standard user), ADMIN (data management)
 * - Secure password hashing with bcryptjs
 * - HTTP-only cookies for token storage (secure, XSS-resistant)
 * 
 * 
 * STEP 1: USER MODEL SCHEMA
 * ========================
 * 
 * User Schema fields:
 * {
 *   _id: ObjectId (auto-generated)
 *   email: String (unique, required, validated)
 *   password: String (hashed with bcrypt, never stored plaintext)
 *   username: String (optional, for display)
 *   role: String (enum: ['USER', 'ADMIN'], default: 'USER')
 *   createdAt: Date (auto)
 *   updatedAt: Date (auto)
 * }
 * 
 * 
 * STEP 2: AUTHENTICATION ROUTES TO ADD
 * ====================================
 * 
 * POST /auth/register
 *   - Body: { email, password, confirmPassword }
 *   - Validates email format, password strength (min 8 chars, uppercase, number)
 *   - Checks if email already exists
 *   - Hashes password with bcryptjs (salt rounds: 10)
 *   - Creates user document
 *   - Returns: { message, userId, token }
 * 
 * POST /auth/login
 *   - Body: { email, password }
 *   - Finds user by email
 *   - Compares password with bcrypt
 *   - Generates JWT token valid for 7 days
 *   - Sets HTTP-only cookie with token
 *   - Returns: { message, token, user: { id, email, role } }
 * 
 * POST /auth/logout
 *   - Clears HTTP-only cookie
 *   - Returns: { message: "Logged out successfully" }
 * 
 * GET /auth/me
 *   - Protected route (requires valid JWT)
 *   - Returns current user info: { user: { id, email, role } }
 * 
 * 
 * STEP 3: MIDDLEWARE - AUTHENTICATION
 * ===================================
 * 
 * verifyToken() middleware:
 *   - Extracts token from:
 *     a) Authorization header (Bearer <token>)
 *     b) HTTP-only cookie
 *   - Verifies JWT signature
 *   - Attaches user payload to req.user
 *   - If invalid/expired: returns 401 Unauthorized
 * 
 * 
 * STEP 4: MIDDLEWARE - AUTHORIZATION
 * ==================================
 * 
 * requireRole(roles[]) middleware:
 *   - Checks if req.user.role is in allowed roles
 *   - If unauthorized: returns 403 Forbidden
 *   - Usage:
 *     router.post('/admin/spots', requireRole(['ADMIN']), createSpot)
 * 
 * 
 * STEP 5: ENVIRONMENT VARIABLES
 * =============================
 * 
 * JWT_SECRET=your_super_secret_key_here_min_32_chars
 * JWT_EXPIRE=7d
 * BCRYPT_SALT_ROUNDS=10
 * 
 * 
 * STEP 6: PROTECTED ENDPOINTS
 * ==========================
 * 
 * Current endpoints to protect:
 * 
 * ADMIN ROUTES (require ADMIN role):
 *   POST   /admin/import-data
 *   POST   /admin/parking-spots
 *   PUT    /admin/parking-spots/:id
 *   DELETE /admin/parking-spots/:id
 * 
 * USER ROUTES (require USER role, future):
 *   POST   /park/spots/:id/book       [when reservation API available]
 *   POST   /park/spots/:id/release    [when reservation API available]
 * 
 * PUBLIC ROUTES (no auth required):
 *   GET    /park/spots
 *   GET    /park/spots/search/:name
 *   GET    /park/spots/searchNames/:query
 *   POST   /park/spots/nearestSpot
 * 
 * 
 * STEP 7: FLOW DIAGRAM
 * ==================
 * 
 * NEW USER REGISTRATION:
 *   1. Frontend → POST /auth/register with email + password
 *   2. Backend validates input + password strength
 *   3. Hash password with bcrypt (10 salt rounds)
 *   4. Create User doc in MongoDB
 *   5. Generate JWT token (payload: userId, email, role)
 *   6. Set HTTP-only cookie
 *   7. Return token + user info to frontend
 * 
 * USER LOGIN:
 *   1. Frontend → POST /auth/login with email + password
 *   2. Backend finds user by email
 *   3. Compare input password vs stored hash using bcrypt
 *   4. If match: generate JWT token
 *   5. Set HTTP-only cookie
 *   6. Return token + user info
 *   If no match: return 401 Unauthorized
 * 
 * PROTECTED API REQUEST:
 *   1. Frontend includes token in Authorization header
 *   2. Or browser auto-includes via HTTP-only cookie
 *   3. Backend verifyToken() middleware extracts & verifies token
 *   4. If valid: attach user to req.user, proceed
 *   If invalid/expired: return 401 Unauthorized
 * 
 * ADMIN ACTION (e.g., delete spot):
 *   1. Frontend → DELETE /admin/parking-spots/123 + token
 *   2. verifyToken() middleware validates token
 *   3. requireRole(['ADMIN']) checks user.role === 'ADMIN'
 *   4. If authorized: proceed with delete
 *   5. If not ADMIN: return 403 Forbidden
 * 
 * 
 * STEP 8: IMPLEMENTATION FILES NEEDED
 * ==================================
 * 
 * 1. backend/models/User.js
 *    - Schema definition with fields above
 *    - Pre-save hook to hash password if modified
 *    - Method to compare passwords: comparePassword(candidatePassword)
 * 
 * 2. backend/middleware/authMiddleware.js
 *    - verifyToken(): Extract & verify JWT
 *    - requireRole(): Check user role
 * 
 * 3. backend/routes/authRoutes.js
 *    - POST /register
 *    - POST /login
 *    - POST /logout
 *    - GET /me (protected)
 * 
 * 4. backend/controller/authController.js
 *    - register(req, res)
 *    - login(req, res)
 *    - logout(req, res)
 *    - getCurrentUser(req, res)
 * 
 * 5. backend/utils/jwtUtils.js
 *    - generateToken(payload)
 *    - verifyToken(token)
 * 
 * 
 * STEP 9: PACKAGES TO INSTALL
 * ==========================
 * 
 * Backend:
 *   npm install jsonwebtoken bcryptjs cookie-parser
 * 
 * jsonwebtoken - Generate & verify JWT tokens
 * bcryptjs - Hash passwords securely
 * cookie-parser - Parse HTTP-only cookies
 * 
 * 
 * STEP 10: SECURITY BEST PRACTICES
 * ================================
 * 
 * 1. Passwords:
 *    - Never log or return plaintext passwords
 *    - Always hash with bcrypt (min 10 salt rounds)
 *    - Require minimum 8 characters, uppercase, numbers
 * 
 * 2. Tokens:
 *    - Store JWT_SECRET in .env (never commit to git)
 *    - Set short expiry times (7 days max for access tokens)
 *    - Use HTTP-only cookies (prevents XSS token theft)
 * 
 * 3. Transport:
 *    - Always use HTTPS in production
 *    - Use Secure & SameSite flags on cookies
 *    - CORS should whitelist specific origins
 * 
 * 4. Validation:
 *    - Validate all inputs (email format, password strength)
 *    - Sanitize user data
 *    - Use parameterized queries (Mongoose does this)
 * 
 * 5. Endpoints:
 *    - All admin routes require ADMIN role
 *    - Verify token before processing requests
 *    - Rate limiting on auth endpoints
 * 
 * 
 * FUTURE ENHANCEMENTS
 * ===================
 * - Refresh tokens (separate token for refreshing access tokens)
 * - Two-factor authentication (2FA)
 * - OAuth integration (Google, GitHub login)
 * - Role-based access control (RBAC) - e.g., MODERATOR role
 * - Password reset via email
 * - Account verification email
 */

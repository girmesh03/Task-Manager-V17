// backend/middlewares/validators/userValidators.js
import { body, param, query } from "express-validator";
import { handleValidationErrors } from "./validation.js";
import { User, Department } from "../../models/index.js";
import { escapeRegex, isDateNotInFuture } from "../../utils/helpers.js";
import {
  USER_ROLES,
  HEAD_OF_DEPARTMENT_ROLES,
  MAX_USER_NAME_LENGTH,
  MAX_POSITION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_SKILLS_PER_USER,
  MAX_SKILL_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  EMPLOYEE_ID_MIN,
  EMPLOYEE_ID_MAX,
  SUPPORTED_IMAGE_EXTENSIONS,
  CLOUDINARY_DOMAINS,
  MIN_SKILL_PERCENTAGE,
  MAX_SKILL_PERCENTAGE,
} from "../../utils/constants.js";

/**
 * @json {
 *   "route": "POST /users",
 *   "purpose": "Create a new user within a specific department",
 *   "validates": [
 *     "firstName","lastName","position","role","email","password","departmentId",
 *     "profilePicture","skills","employeeId","dateOfBirth","joinedAt"
 *   ],
 *   "rules": [
 *     "String length and enum validations",
 *     "Email format and uniqueness within organization (including soft-deleted)",
 *     "Password minimum length",
 *     "Department must belong to user's organization",
 *     "Profile picture URL domain/extension validation",
 *     "Skills array length, unique names case-insensitive, percentage within bounds",
 *     "HOD uniqueness per department pre-check",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateCreateUser = [
  body("firstName")
    .exists({ checkFalsy: true })
    .withMessage("First name is required")
    .bail()
    .isString()
    .withMessage("First name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_USER_NAME_LENGTH })
    .withMessage(`First name cannot exceed ${MAX_USER_NAME_LENGTH} characters`),
  body("lastName")
    .exists({ checkFalsy: true })
    .withMessage("Last name is required")
    .bail()
    .isString()
    .withMessage("Last name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_USER_NAME_LENGTH })
    .withMessage(`Last name cannot exceed ${MAX_USER_NAME_LENGTH} characters`),
  body("position")
    .exists({ checkFalsy: true })
    .withMessage("Position is required")
    .bail()
    .isString()
    .withMessage("Position must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_POSITION_LENGTH })
    .withMessage(`Position cannot exceed ${MAX_POSITION_LENGTH} characters`),
  body("role")
    .exists({ checkFalsy: true })
    .withMessage("Role is required")
    .bail()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .isLength({ max: MAX_EMAIL_LENGTH })
    .withMessage(`Email must be less than ${MAX_EMAIL_LENGTH} characters`)
    .bail()
    .custom(async (email, { req }) => {
      const orgId = req.user.organization._id;
      const existing = await User.findOne({
        organization: orgId,
        email: {
          $regex: new RegExp(
            `^${escapeRegex(email.trim().toLowerCase())}$`,
            "i"
          ),
        },
      }).withDeleted();
      if (existing)
        throw new Error("Email already exists in your organization");
      return true;
    }),
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .bail()
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  body("departmentId")
    .exists({ checkFalsy: true })
    .withMessage("departmentId is required")
    .bail()
    .isMongoId()
    .withMessage("departmentId must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
        isDeleted: false,
      });
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  body("profilePicture")
    .optional({ nullable: true })
    .isObject()
    .withMessage("profilePicture must be an object"),
  body("profilePicture.url")
    .optional({ nullable: true })
    .custom((url) => {
      if (!url) return true;
      try {
        const u = new URL(url);
        const hasImageExt = SUPPORTED_IMAGE_EXTENSIONS.some((ext) =>
          u.pathname.toLowerCase().endsWith(ext)
        );
        const trusted = CLOUDINARY_DOMAINS.some((d) => u.hostname.includes(d));
        if (!trusted && !hasImageExt) {
          throw new Error(
            "Profile picture URL must be from a trusted domain or have a valid image extension"
          );
        }
        return true;
      } catch {
        throw new Error("Invalid profile picture URL format");
      }
    }),
  body("profilePicture.publicId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Public ID must be a string")
    .trim()
    .notEmpty()
    .withMessage("Public ID is required when URL is provided"),
  body("skills")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Skills must be an array")
    .bail()
    .custom((skills) => {
      if (skills.length > MAX_SKILLS_PER_USER) {
        throw new Error(
          `A user can have at most ${MAX_SKILLS_PER_USER} skills`
        );
      }
      const names = skills
        .map((s) => s.skill?.toLowerCase().trim())
        .filter(Boolean);
      const unique = new Set(names);
      if (unique.size !== names.length) {
        throw new Error("Skill names must be unique (case-insensitive)");
      }
      return true;
    }),
  body("skills.*.skill")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skill name must be a string")
    .trim()
    .isLength({ max: MAX_SKILL_NAME_LENGTH })
    .withMessage(`Skill cannot exceed ${MAX_SKILL_NAME_LENGTH} characters`),
  body("skills.*.percentage")
    .optional({ nullable: true })
    .isFloat({ min: MIN_SKILL_PERCENTAGE, max: MAX_SKILL_PERCENTAGE })
    .withMessage(
      `Skill percentage must be between ${MIN_SKILL_PERCENTAGE} and ${MAX_SKILL_PERCENTAGE}`
    ),
  body("employeeId")
    .optional({ nullable: true })
    .isInt({ min: EMPLOYEE_ID_MIN, max: EMPLOYEE_ID_MAX })
    .withMessage(
      `Employee ID must be between ${EMPLOYEE_ID_MIN} and ${EMPLOYEE_ID_MAX}`
    ),
  body("dateOfBirth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dateOfBirth must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date))
        throw new Error("dateOfBirth cannot be in the future");
      return true;
    }),
  body("joinedAt")
    .exists({ checkFalsy: true })
    .withMessage("joinedAt is required")
    .bail()
    .isISO8601()
    .withMessage("joinedAt must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date))
        throw new Error("joinedAt cannot be in the future");
      return true;
    }),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("isPlatformUser")
    .not()
    .exists()
    .withMessage(
      "isPlatformUser cannot be manually set. It is automatically determined by the system"
    ),
  body().custom(async (_, { req }) => {
    // HOD uniqueness pre-check
    const role = req.body.role;
    const departmentId = req.body.departmentId;
    if (HEAD_OF_DEPARTMENT_ROLES.includes(role) && departmentId) {
      const existingHod = await User.findOne({
        department: departmentId,
        role: { $in: HEAD_OF_DEPARTMENT_ROLES },
        isDeleted: false,
      }).withDeleted();
      if (existingHod) {
        throw new Error(
          "This department already has a Head of Department (SuperAdmin/Admin)"
        );
      }
    }
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.body = {
      firstName: b.firstName?.trim(),
      lastName: b.lastName?.trim(),
      position: b.position?.trim(),
      role: b.role,
      email: b.email?.trim().toLowerCase(),
      password: b.password,
      departmentId: b.departmentId,
      profilePicture: b.profilePicture
        ? {
            url: b.profilePicture.url,
            publicId: b.profilePicture.publicId?.trim(),
          }
        : undefined,
      skills: Array.isArray(b.skills)
        ? b.skills.map((s) => ({
            skill: s.skill?.trim(),
            percentage:
              s.percentage !== undefined ? Number(s.percentage) : undefined,
          }))
        : undefined,
      employeeId: b.employeeId !== undefined ? Number(b.employeeId) : undefined,
      dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth) : undefined,
      joinedAt: b.joinedAt ? new Date(b.joinedAt) : undefined,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /users",
 *   "purpose": "List users based on authorization scope",
 *   "validates": ["page","limit","search","departmentId","role","position","deleted","sortBy","sortOrder"],
 *   "rules": [
 *     "Pagination integers",
 *     "Optional search string",
 *     "Optional departmentId must belong to user's organization",
 *     "Role constrained by USER_ROLES",
 *     "Attach sanitized query to req.validated.query"
 *   ]
 * }
 */
export const validateGetAllUsers = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .trim(),
  query("departmentId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("departmentId must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      if (!departmentId) return true;
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
        isDeleted: false,
      });
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  query("role")
    .optional({ nullable: true })
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
  query("position")
    .optional({ nullable: true })
    .isString()
    .withMessage("position must be a string")
    .trim(),
  query("deleted")
    .optional()
    .isBoolean()
    .withMessage("Deleted must be a boolean")
    .toBoolean(),
  query("sortBy")
    .optional()
    .isString()
    .withMessage("sortBy must be a string")
    .trim(),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "1", "-1"])
    .withMessage("Invalid sortOrder"),
  query().custom((_, { req }) => {
    req.validated = req.validated || {};
    req.validated.query = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      search: req.query.search?.trim(),
      departmentId: req.query.departmentId,
      role: req.query.role,
      position: req.query.position?.trim(),
      deleted: req.query.deleted === true || req.query.deleted === "true",
      sortBy: req.query.sortBy?.trim(),
      sortOrder: req.query.sortOrder || "desc",
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /users/:userId",
 *   "purpose": "Get single user by ID with complete profile",
 *   "validates": ["userId"],
 *   "rules": [
 *     "userId must be valid and belong to user's organization",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateGetUser = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom(async (userId, { req }) => {
      const orgId = req.user.organization._id;
      const user = await User.findOne({
        _id: userId,
        organization: orgId,
      }).withDeleted();
      if (!user) throw new Error("User not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { userId: req.params.userId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /users/:userId",
 *   "purpose": "Update user by SuperAdmin",
 *   "validates": ["userId","firstName","lastName","position","role","departmentId","profilePicture","skills","employeeId","dateOfBirth","joinedAt"],
 *   "rules": [
 *     "Param userId must exist in org",
 *     "Optional fields with same constraints as create",
 *     "If role is HOD enforce department uniqueness (consider department change)",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateUpdateUser = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom(async (userId, { req }) => {
      const orgId = req.user.organization._id;
      const user = await User.findOne({
        _id: userId,
        organization: orgId,
      }).withDeleted();
      if (!user) throw new Error("User not found in your organization");
      return true;
    }),
  body("firstName")
    .optional({ nullable: true })
    .isString()
    .withMessage("First name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_USER_NAME_LENGTH })
    .withMessage(`First name cannot exceed ${MAX_USER_NAME_LENGTH} characters`),
  body("lastName")
    .optional({ nullable: true })
    .isString()
    .withMessage("Last name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_USER_NAME_LENGTH })
    .withMessage(`Last name cannot exceed ${MAX_USER_NAME_LENGTH} characters`),
  body("position")
    .optional({ nullable: true })
    .isString()
    .withMessage("Position must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_POSITION_LENGTH })
    .withMessage(`Position cannot exceed ${MAX_POSITION_LENGTH} characters`),
  body("role")
    .optional({ nullable: true })
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
  body("departmentId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("departmentId must be a valid MongoDB ID")
    .bail()
    .custom(async (departmentId, { req }) => {
      if (!departmentId) return true;
      const orgId = req.user.organization._id;
      const dept = await Department.findOne({
        _id: departmentId,
        organization: orgId,
        isDeleted: false,
      });
      if (!dept) throw new Error("Department not found in your organization");
      return true;
    }),
  body("profilePicture")
    .optional({ nullable: true })
    .isObject()
    .withMessage("profilePicture must be an object"),
  body("profilePicture.url")
    .optional({ nullable: true })
    .custom((url) => {
      if (!url) return true;
      try {
        const u = new URL(url);
        const hasImageExt = SUPPORTED_IMAGE_EXTENSIONS.some((ext) =>
          u.pathname.toLowerCase().endsWith(ext)
        );
        const trusted = CLOUDINARY_DOMAINS.some((d) => u.hostname.includes(d));
        if (!trusted && !hasImageExt) {
          throw new Error(
            "Profile picture URL must be from a trusted domain or have a valid image extension"
          );
        }
        return true;
      } catch {
        throw new Error("Invalid profile picture URL format");
      }
    }),
  body("profilePicture.publicId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Public ID must be a string")
    .trim(),
  body("skills")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Skills must be an array")
    .bail()
    .custom((skills) => {
      if (skills.length > MAX_SKILLS_PER_USER) {
        throw new Error(
          `A user can have at most ${MAX_SKILLS_PER_USER} skills`
        );
      }
      const names = skills
        .map((s) => s.skill?.toLowerCase().trim())
        .filter(Boolean);
      const unique = new Set(names);
      if (unique.size !== names.length) {
        throw new Error("Skill names must be unique (case-insensitive)");
      }
      return true;
    }),
  body("skills.*.skill")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skill name must be a string")
    .trim()
    .isLength({ max: MAX_SKILL_NAME_LENGTH })
    .withMessage(`Skill cannot exceed ${MAX_SKILL_NAME_LENGTH} characters`),
  body("skills.*.percentage")
    .optional({ nullable: true })
    .isFloat({ min: MIN_SKILL_PERCENTAGE, max: MAX_SKILL_PERCENTAGE })
    .withMessage(
      `Skill percentage must be between ${MIN_SKILL_PERCENTAGE} and ${MAX_SKILL_PERCENTAGE}`
    ),
  body("employeeId")
    .optional({ nullable: true })
    .isInt({ min: EMPLOYEE_ID_MIN, max: EMPLOYEE_ID_MAX })
    .withMessage(
      `Employee ID must be between ${EMPLOYEE_ID_MIN} and ${EMPLOYEE_ID_MAX}`
    ),
  body("dateOfBirth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dateOfBirth must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date))
        throw new Error("dateOfBirth cannot be in the future");
      return true;
    }),
  body("joinedAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("joinedAt must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date))
        throw new Error("joinedAt cannot be in the future");
      return true;
    }),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("isPlatformUser")
    .not()
    .exists()
    .withMessage(
      "isPlatformUser cannot be manually set. It is automatically determined by the system"
    ),
  body().custom(async (_, { req }) => {
    // HOD uniqueness check when role or department change
    const role = req.body.role;
    const departmentId = req.body.departmentId;
    if (HEAD_OF_DEPARTMENT_ROLES.includes(role || "") && departmentId) {
      const existingHod = await User.findOne({
        department: departmentId,
        role: { $in: HEAD_OF_DEPARTMENT_ROLES },
        _id: { $ne: req.params.userId },
        isDeleted: false,
      }).withDeleted();
      if (existingHod) {
        throw new Error(
          "This department already has a Head of Department (SuperAdmin/Admin)"
        );
      }
    }
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.params = { userId: req.params.userId };
    req.validated.body = {
      firstName: b.firstName?.trim(),
      lastName: b.lastName?.trim(),
      position: b.position?.trim(),
      role: b.role,
      departmentId: b.departmentId,
      profilePicture: b.profilePicture
        ? {
            url: b.profilePicture.url,
            publicId: b.profilePicture.publicId?.trim(),
          }
        : undefined,
      skills: Array.isArray(b.skills)
        ? b.skills.map((s) => ({
            skill: s.skill?.trim(),
            percentage:
              s.percentage !== undefined ? Number(s.percentage) : undefined,
          }))
        : undefined,
      employeeId: b.employeeId !== undefined ? Number(b.employeeId) : undefined,
      dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth) : undefined,
      joinedAt: b.joinedAt ? new Date(b.joinedAt) : undefined,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "PUT /users/:userId/profile",
 *   "purpose": "Update own user profile with role-based field restrictions",
 *   "validates": [
 *     "userId","firstName","lastName","position","role","email","password","profilePicture",
 *     "skills","employeeId","dateOfBirth","joinedAt"
 *   ],
 *   "rules": [
 *     "Param userId must equal authenticated user",
 *     "Optional updates with same constraints as create",
 *     "Email uniqueness within organization excluding self",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateUpdateMyProfile = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom((userId, { req }) => {
      if (String(userId) !== String(req.user._id)) {
        throw new Error("You can only update your own profile");
      }
      return true;
    }),
  body("firstName")
    .optional({ nullable: true })
    .isString()
    .withMessage("First name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_USER_NAME_LENGTH })
    .withMessage(`First name cannot exceed ${MAX_USER_NAME_LENGTH} characters`),
  body("lastName")
    .optional({ nullable: true })
    .isString()
    .withMessage("Last name must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_USER_NAME_LENGTH })
    .withMessage(`Last name cannot exceed ${MAX_USER_NAME_LENGTH} characters`),
  body("position")
    .optional({ nullable: true })
    .isString()
    .withMessage("Position must be a string")
    .trim()
    .isLength({ min: 1, max: MAX_POSITION_LENGTH })
    .withMessage(`Position cannot exceed ${MAX_POSITION_LENGTH} characters`),
  body("role")
    .optional({ nullable: true })
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
  body("email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .isLength({ max: MAX_EMAIL_LENGTH })
    .withMessage(`Email must be less than ${MAX_EMAIL_LENGTH} characters`)
    .bail()
    .custom(async (email, { req }) => {
      const orgId = req.user.organization._id;
      const existing = await User.findOne({
        organization: orgId,
        email: {
          $regex: new RegExp(
            `^${escapeRegex(email.trim().toLowerCase())}$`,
            "i"
          ),
        },
        _id: { $ne: req.user._id },
      }).withDeleted();
      if (existing)
        throw new Error("Email already exists in your organization");
      return true;
    }),
  body("password")
    .optional({ nullable: true })
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  body("profilePicture")
    .optional({ nullable: true })
    .isObject()
    .withMessage("profilePicture must be an object"),
  body("profilePicture.url")
    .optional({ nullable: true })
    .custom((url) => {
      if (!url) return true;
      try {
        const u = new URL(url);
        const hasImageExt = SUPPORTED_IMAGE_EXTENSIONS.some((ext) =>
          u.pathname.toLowerCase().endsWith(ext)
        );
        const trusted = CLOUDINARY_DOMAINS.some((d) => u.hostname.includes(d));
        if (!trusted && !hasImageExt) {
          throw new Error(
            "Profile picture URL must be from a trusted domain or have a valid image extension"
          );
        }
        return true;
      } catch {
        throw new Error("Invalid profile picture URL format");
      }
    }),
  body("profilePicture.publicId")
    .optional({ nullable: true })
    .isString()
    .withMessage("Public ID must be a string")
    .trim(),
  body("skills")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Skills must be an array")
    .bail()
    .custom((skills) => {
      if (skills.length > MAX_SKILLS_PER_USER) {
        throw new Error(
          `A user can have at most ${MAX_SKILLS_PER_USER} skills`
        );
      }
      const names = skills
        .map((s) => s.skill?.toLowerCase().trim())
        .filter(Boolean);
      const unique = new Set(names);
      if (unique.size !== names.length) {
        throw new Error("Skill names must be unique (case-insensitive)");
      }
      return true;
    }),
  body("skills.*.skill")
    .optional({ nullable: true })
    .isString()
    .withMessage("Skill name must be a string")
    .trim()
    .isLength({ max: MAX_SKILL_NAME_LENGTH })
    .withMessage(`Skill cannot exceed ${MAX_SKILL_NAME_LENGTH} characters`),
  body("skills.*.percentage")
    .optional({ nullable: true })
    .isFloat({ min: MIN_SKILL_PERCENTAGE, max: MAX_SKILL_PERCENTAGE })
    .withMessage(
      `Skill percentage must be between ${MIN_SKILL_PERCENTAGE} and ${MAX_SKILL_PERCENTAGE}`
    ),
  body("employeeId")
    .optional({ nullable: true })
    .isInt({ min: EMPLOYEE_ID_MIN, max: EMPLOYEE_ID_MAX })
    .withMessage(
      `Employee ID must be between ${EMPLOYEE_ID_MIN} and ${EMPLOYEE_ID_MAX}`
    ),
  body("dateOfBirth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("dateOfBirth must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date))
        throw new Error("dateOfBirth cannot be in the future");
      return true;
    }),
  body("joinedAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("joinedAt must be a valid ISO 8601 date")
    .bail()
    .custom((date) => {
      if (!isDateNotInFuture(date))
        throw new Error("joinedAt cannot be in the future");
      return true;
    }),
  body("organizationId")
    .not()
    .exists()
    .withMessage(
      "organizationId cannot be provided. Organization is determined from authentication context"
    ),
  body("isPlatformUser")
    .not()
    .exists()
    .withMessage(
      "isPlatformUser cannot be manually set. It is automatically determined by the system"
    ),
  body().custom((_, { req }) => {
    req.validated = req.validated || {};
    const b = req.body;
    req.validated.params = { userId: req.params.userId };
    req.validated.body = {
      firstName: b.firstName?.trim(),
      lastName: b.lastName?.trim(),
      position: b.position?.trim(),
      role: b.role,
      email: b.email?.trim().toLowerCase(),
      password: b.password,
      profilePicture: b.profilePicture
        ? {
            url: b.profilePicture.url,
            publicId: b.profilePicture.publicId?.trim(),
          }
        : undefined,
      skills: Array.isArray(b.skills)
        ? b.skills.map((s) => ({
            skill: s.skill?.trim(),
            percentage:
              s.percentage !== undefined ? Number(s.percentage) : undefined,
          }))
        : undefined,
      employeeId: b.employeeId !== undefined ? Number(b.employeeId) : undefined,
      dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth) : undefined,
      joinedAt: b.joinedAt ? new Date(b.joinedAt) : undefined,
    };
    return true;
  }),
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /users/:userId/account",
 *   "purpose": "Get current authenticated user's account information",
 *   "validates": ["userId"],
 *   "rules": [
 *     "Param userId must equal authenticated user",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateGetMyAccount = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom((userId, { req }) => {
      if (String(userId) !== String(req.user._id)) {
        throw new Error("You can only access your own account");
      }
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { userId: req.params.userId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "GET /users/:userId/profile",
 *   "purpose": "Get current authenticated user's complete profile",
 *   "validates": ["userId","includeSkills","includeStats"],
 *   "rules": [
 *     "Param userId must equal authenticated user",
 *     "Optional booleans for includeSkills/includeStats",
 *     "Attach sanitized params/query to req.validated"
 *   ]
 * }
 */
export const validateGetMyProfile = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom((userId, { req }) => {
      if (String(userId) !== String(req.user._id)) {
        throw new Error("You can only access your own profile");
      }
      return true;
    }),
  query("includeSkills")
    .optional()
    .isBoolean()
    .withMessage("includeSkills must be a boolean")
    .toBoolean(),
  query("includeStats")
    .optional()
    .isBoolean()
    .withMessage("includeStats must be a boolean")
    .toBoolean(),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { userId: req.params.userId };
    req.validated.query = {
      includeSkills:
        req.query.includeSkills === true || req.query.includeSkills === "true",
      includeStats:
        req.query.includeStats === true || req.query.includeStats === "true",
    };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "DELETE /users/:userId",
 *   "purpose": "Soft delete a user with cascade deletion",
 *   "validates": ["userId"],
 *   "rules": [
 *     "userId must be valid and belong to user's organization",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateDeleteUser = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom(async (userId, { req }) => {
      const orgId = req.user.organization._id;
      const user = await User.findOne({ _id: userId, organization: orgId });
      if (!user) throw new Error("User not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { userId: req.params.userId };
    next();
  },
  handleValidationErrors,
];

/**
 * @json {
 *   "route": "POST /users/:userId/restore",
 *   "purpose": "Restore a soft-deleted user",
 *   "validates": ["userId"],
 *   "rules": [
 *     "userId must be valid and belong to user's organization",
 *     "User must be soft-deleted",
 *     "Attach sanitized params to req.validated.params"
 *   ]
 * }
 */
export const validateRestoreUser = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ID")
    .bail()
    .custom(async (userId, { req }) => {
      const orgId = req.user.organization._id;
      const user = await User.findOne({
        _id: userId,
        organization: orgId,
      }).onlyDeleted();
      if (!user)
        throw new Error("Soft-deleted user not found in your organization");
      return true;
    }),
  (req, _res, next) => {
    req.validated = req.validated || {};
    req.validated.params = { userId: req.params.userId };
    next();
  },
  handleValidationErrors,
];
/**
 * @json {
 *   "route": "PUT /users/:userId/email-preferences",
 *   "purpose": "Update user's email notification preferences",
 *   "validates": [
 *     "enabled","taskNotifications","taskReminders","mentions",
 *     "announcements","welcomeEmails","passwordReset"
 *   ],
 *   "rules": [
 *     "All fields are optional boolean values",
 *     "At least one field must be provided",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateUpdateEmailPreferences = [
  param("userId")
    .exists({ checkFalsy: true })
    .withMessage("User ID is required")
    .bail()
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),

  body("enabled")
    .optional()
    .isBoolean()
    .withMessage("enabled must be a boolean value"),

  body("taskNotifications")
    .optional()
    .isBoolean()
    .withMessage("taskNotifications must be a boolean value"),

  body("taskReminders")
    .optional()
    .isBoolean()
    .withMessage("taskReminders must be a boolean value"),

  body("mentions")
    .optional()
    .isBoolean()
    .withMessage("mentions must be a boolean value"),

  body("announcements")
    .optional()
    .isBoolean()
    .withMessage("announcements must be a boolean value"),

  body("welcomeEmails")
    .optional()
    .isBoolean()
    .withMessage("welcomeEmails must be a boolean value"),

  body("passwordReset")
    .optional()
    .isBoolean()
    .withMessage("passwordReset must be a boolean value"),

  // Custom validation to ensure at least one field is provided
  body().custom((value) => {
    const allowedFields = [
      "enabled",
      "taskNotifications",
      "taskReminders",
      "mentions",
      "announcements",
      "welcomeEmails",
      "passwordReset",
    ];
    const providedFields = Object.keys(value).filter((key) =>
      allowedFields.includes(key)
    );

    if (providedFields.length === 0) {
      throw new Error("At least one email preference field must be provided");
    }
    return true;
  }),

  handleValidationErrors,

  (req, res, next) => {
    const {
      enabled,
      taskNotifications,
      taskReminders,
      mentions,
      announcements,
      welcomeEmails,
      passwordReset,
    } = req.body;

    req.validated = {
      params: { userId: req.params.userId },
      body: {
        ...(enabled !== undefined && { enabled }),
        ...(taskNotifications !== undefined && { taskNotifications }),
        ...(taskReminders !== undefined && { taskReminders }),
        ...(mentions !== undefined && { mentions }),
        ...(announcements !== undefined && { announcements }),
        ...(welcomeEmails !== undefined && { welcomeEmails }),
        ...(passwordReset !== undefined && { passwordReset }),
      },
    };
    next();
  },
];

/**
 * @json {
 *   "route": "PUT /users/me/email-preferences",
 *   "purpose": "Update current user's email notification preferences",
 *   "validates": [
 *     "enabled","taskNotifications","taskReminders","mentions",
 *     "announcements","welcomeEmails","passwordReset"
 *   ],
 *   "rules": [
 *     "All fields are optional boolean values",
 *     "At least one field must be provided",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateUpdateMyEmailPreferences = [
  body("enabled")
    .optional()
    .isBoolean()
    .withMessage("enabled must be a boolean value"),

  body("taskNotifications")
    .optional()
    .isBoolean()
    .withMessage("taskNotifications must be a boolean value"),

  body("taskReminders")
    .optional()
    .isBoolean()
    .withMessage("taskReminders must be a boolean value"),

  body("mentions")
    .optional()
    .isBoolean()
    .withMessage("mentions must be a boolean value"),

  body("announcements")
    .optional()
    .isBoolean()
    .withMessage("announcements must be a boolean value"),

  body("welcomeEmails")
    .optional()
    .isBoolean()
    .withMessage("welcomeEmails must be a boolean value"),

  body("passwordReset")
    .optional()
    .isBoolean()
    .withMessage("passwordReset must be a boolean value"),

  // Custom validation to ensure at least one field is provided
  body().custom((value) => {
    const allowedFields = [
      "enabled",
      "taskNotifications",
      "taskReminders",
      "mentions",
      "announcements",
      "welcomeEmails",
      "passwordReset",
    ];
    const providedFields = Object.keys(value).filter((key) =>
      allowedFields.includes(key)
    );

    if (providedFields.length === 0) {
      throw new Error("At least one email preference field must be provided");
    }
    return true;
  }),

  handleValidationErrors,

  (req, res, next) => {
    const {
      enabled,
      taskNotifications,
      taskReminders,
      mentions,
      announcements,
      welcomeEmails,
      passwordReset,
    } = req.body;

    req.validated = {
      body: {
        ...(enabled !== undefined && { enabled }),
        ...(taskNotifications !== undefined && { taskNotifications }),
        ...(taskReminders !== undefined && { taskReminders }),
        ...(mentions !== undefined && { mentions }),
        ...(announcements !== undefined && { announcements }),
        ...(welcomeEmails !== undefined && { welcomeEmails }),
        ...(passwordReset !== undefined && { passwordReset }),
      },
    };
    next();
  },
];

/**
 * @json {
 *   "route": "POST /users/bulk-announcement",
 *   "purpose": "Send bulk announcement email to organization or department users",
 *   "validates": [
 *     "title","message","targetType","targetDepartmentId"
 *   ],
 *   "rules": [
 *     "Title and message are required strings with length limits",
 *     "targetType must be 'organization' or 'department'",
 *     "targetDepartmentId required if targetType is 'department'",
 *     "Attach sanitized body to req.validated.body"
 *   ]
 * }
 */
export const validateSendBulkAnnouncement = [
  body("title")
    .exists({ checkFalsy: true })
    .withMessage("Announcement title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),

  body("message")
    .exists({ checkFalsy: true })
    .withMessage("Announcement message is required")
    .bail()
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),

  body("targetType")
    .exists({ checkFalsy: true })
    .withMessage("Target type is required")
    .bail()
    .isString()
    .withMessage("Target type must be a string")
    .isIn(["organization", "department"])
    .withMessage("Target type must be 'organization' or 'department'"),

  body("targetDepartmentId")
    .optional()
    .isMongoId()
    .withMessage("Target department ID must be a valid MongoDB ObjectId"),

  // Custom validation for targetDepartmentId when targetType is 'department'
  body().custom((value) => {
    if (value.targetType === "department" && !value.targetDepartmentId) {
      throw new Error(
        "targetDepartmentId is required when targetType is department"
      );
    }
    return true;
  }),

  handleValidationErrors,

  (req, res, next) => {
    const { title, message, targetType, targetDepartmentId } = req.body;

    req.validated = {
      body: {
        title: title.trim(),
        message: message.trim(),
        targetType,
        ...(targetDepartmentId && { targetDepartmentId }),
      },
    };
    next();
  },
];

// backend/utils/userStatus.js

const checkUserStatus = (user) => {
  // Check if user exists
  if (!user) {
    return {
      status: true,
      message: "User not found",
      errorCode: "USER_NOT_FOUND_ERROR",
    };
  }

  // Multi-tenant integrity check: department must belong to the same organization
  // Defensive: callers may pass non-populated references; handle gracefully
  if (!user.organization || !user.department) {
    return {
      status: true,
      message: "User organization or department not populated",
      errorCode: "AUTHENTICATION_ERROR",
    };
  }

  const orgId = String(user.organization._id || user.organization._id);
  const deptOrgId = String(
    user.department.organization._id || user.department._id
  );

  if (orgId !== deptOrgId) {
    return {
      status: true,
      message: "Department organization mismatch",
      errorCode: "AUTHENTICATION_ERROR",
    };
  }

  return { status: false };
};

export default checkUserStatus;

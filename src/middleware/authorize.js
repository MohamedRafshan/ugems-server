const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Check each allowed role/permission
    let isAuthorized = false;
    for (const roleSpec of allowedRoles) {
      // Support tier-based authorization: "admin:super", "admin:limited"
      if (roleSpec.includes(":")) {
        const [role, tier] = roleSpec.split(":");
        if (req.user.role === role && req.user.adminTier === tier) {
          isAuthorized = true;
          break;
        }
      } else {
        // Standard role check
        if (req.user.role === roleSpec) {
          isAuthorized = true;
          break;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to perform this action",
      });
    }

    next();
  };
};

module.exports = { authorize };

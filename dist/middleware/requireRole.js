"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const user = req.user;
        // 1. Not authenticated
        if (!user) {
            return res.status(401).json({
                message: 'Unauthorized',
            });
        }
        // 2. Inactive account
        if (user.is_active === false) {
            return res.status(403).json({
                message: 'Account is inactive',
            });
        }
        // 3. Role not allowed
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                message: 'Forbidden',
            });
        }
        next();
    };
}

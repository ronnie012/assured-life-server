const checkRole = (roles) => (req, res, next) => {
  console.log('RoleCheckMiddleware: Checking roles...');
  console.log('RoleCheckMiddleware: User object in req:', req.user);
  console.log('RoleCheckMiddleware: User role:', req.user ? req.user.role : 'Not found');
  console.log('RoleCheckMiddleware: Required roles:', roles);

  if (!req.user || !req.user.role) {
    console.log('RoleCheckMiddleware: Unauthorized - User or role not found.');
    return res.status(401).json({ message: 'Unauthorized: User role not found.' });
  }

  if (!roles.includes(req.user.role.toLowerCase())) {
    console.log('RoleCheckMiddleware: Forbidden - Role mismatch. User role:', req.user.role, 'Required roles:', roles);
    return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions.' });
  }
  console.log('RoleCheckMiddleware: Role check passed. Proceeding to next middleware/route handler.');
  next();
};

module.exports = checkRole;
const checkRole = (roles) => (req, res, next) => {
  console.log('RoleCheckMiddleware: User role:', req.user ? req.user.role : 'Not found');
  // console.log('RoleCheckMiddleware: Required roles:', roles);

  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: 'Unauthorized: User role not found.' });
  }

  if (!roles.includes(req.user.role.toLowerCase())) {
    return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions.' });
  }
  next();
};

module.exports = checkRole;
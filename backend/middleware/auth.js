const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};

const teacherOnly = (req, res, next) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied: Teachers only' });
  }
  next();
};

const studentOnly = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Access denied: Students only' });
  }
  next();
};

const adminOrTeacher = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { protect, adminOnly, teacherOnly, studentOnly, adminOrTeacher };

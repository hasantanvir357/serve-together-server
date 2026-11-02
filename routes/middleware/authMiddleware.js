import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized access. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servetogether_jwt_secret_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden. Invalid or expired token.' });
  }
};

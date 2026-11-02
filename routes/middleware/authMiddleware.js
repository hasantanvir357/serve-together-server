import jwt from 'jsonwebtoken';

export const getJwtSecret = () => process.env.JWT_SECRET?.trim() || null;

export const verifyToken = (req, res, next) => {
  const authHeader = req.get('authorization');
  const bearerMatch = typeof authHeader === 'string' ? /^Bearer ([^\s]+)$/.exec(authHeader) : null;

  if (!bearerMatch) {
    return res.status(401).json({ message: 'Unauthorized access. A Bearer token is required.' });
  }

  const secret = getJwtSecret();
  if (!secret) {
    return res.status(500).json({ message: 'JWT authentication is not configured.' });
  }

  try {
    const decoded = jwt.verify(bearerMatch[1], secret);

    if (!decoded || typeof decoded !== 'object' || typeof decoded.email !== 'string' || !decoded.email.trim()) {
      return res.status(403).json({ message: 'Forbidden. Token does not contain a valid user email.' });
    }

    req.user = {
      ...decoded,
      email: decoded.email.trim().toLowerCase(),
    };
    return next();
  } catch {
    return res.status(403).json({ message: 'Forbidden. Invalid or expired token.' });
  }
};

export const verifyJWT = verifyToken;

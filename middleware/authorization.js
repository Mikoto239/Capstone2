const jwt = require('jsonwebtoken');
const jwt_key = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwt_key);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Example protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route');
});

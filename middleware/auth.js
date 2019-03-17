const jwt = require('jsonwebtoken');
const User = require('../models/user');
module.exports = async function(req, res, next) {
  const authHeader = req.get('Authorization');
  
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(' ')[1];
  console.log(token);
  
  let decodedToken;
  try {
    
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  req.userRole = decodedToken.role;
  req.userId = decodedToken.userId;
  
  
  const user = await User.findById(req.userId);

  if (user && user.role == process.env.ADMIN_ROLE) {
    req.isAdmin = true;
  } else {
    req.isAdmin = false;
  }
  req.isAuth = true;
  
  next();
}
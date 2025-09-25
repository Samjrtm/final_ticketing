// Authentication middleware for protecting routes
export function requireAuth(req, res, next) {
  // In a real application, you would verify JWT tokens here
  // For this demo, we'll just check if the user header is present
  const userHeader = req.headers['x-user'];
  
  if (!userHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add user info to request
  req.user = {
    username: userHeader,
    fullName: getFullName(userHeader)
  };
  
  next();
}

function getFullName(username) {
  const nameMap = {
    'anushree': 'Anushree Soondrum',
    'ashia': 'Ashia Choony',
    'avotra': 'Avotra Andriatsilavina',
    'eshan': 'Eshan Chitamun',
    'samuel': 'Samuel Timothy',
    'lovikesh': 'Lovikesh Seewoogolam',
    'mansoor': 'Mansoor Ahmad Bhugeloo'
  };
  return nameMap[username] || username;
}
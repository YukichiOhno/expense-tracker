const jwt = require('jsonwebtoken');

const authorizeToken = (req, res, next) => {
    // check for token in cookies
    const token = req.cookies['token'];
    if (!token) {
        return res.status(401).json({ message: 'token is missing; unauthorized user detected' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'invalid token' });
        }
        
        // send the decoded information to the next middleware
        req.user = decodedToken;
        next();
    });
};


module.exports = authorizeToken;
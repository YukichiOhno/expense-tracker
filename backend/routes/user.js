const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeWriteQuery, executeReadQuery } = require('../connection/pool');
const generateCustomNumber = require('../misc/generate-number');
const logger = require('../misc/logger');
const authorizeToken = require('../middleware/authorize-token');

// note: add .replace(/\s+/g, ' ').trim(); to strings to remove a huge amount of spaces in user input (when inserting or updating certain data)

// login the user
router.post('/login', async (req, res) => {
    try {
        // initialize variables
        const { username, password } = req.body;
        const isLoggedIn = req.cookies['token'] ? true : false;
        let selectQuery;
        let resultQuery;
        let userInformation;
        let isPasswordValid;
        let token;

        /* this section validates provided data */
        // if cookies exists (meaning the user is currently logged in), don't let them use this route
        if (isLoggedIn) {
            logger.error('user who is currently logged in is trying to access this route');
            return res.status(403).json({ message: 'user must be logged out before logging in' });
        }

        // throw an error if there is no username or password in the body
        if (!username || !password) {
            logger.error('username and/or password are missing in /login');
            return res.status(400).json({ message: 'username and password must be provided to continue' });
        }

        /* this section verifies the user's identity */
        // retrieve the user's information from the database
        selectQuery = `SELECT u.*, page_mode, s.curr_code, curr_sign 
                        FROM user u 
                        JOIN setting s ON u.user_id = s.user_id
                        JOIN currency c ON s.curr_code = c.curr_code
                        WHERE user_username = ?;`;
        resultQuery = await executeReadQuery(selectQuery, [username]);

        // throw an error if no user is found
        if (resultQuery.length !== 1) {
            logger.error('no user found with the provided credentials, cannot log them in');
            return res.status(400).json({ message: 'unable to login; incorrect credentials' });
        }
        userInformation = resultQuery[0];

        // if the account is disabled, don't login
        if (Number(userInformation.user_active) === 0 ) {
            logger.error("user's account is disabled; cannot log them in");
            return res.status(400).json({ message: 'disabled account, unable to log in; contact the administrator to enable the account' });
        }

        // validate password
        isPasswordValid = await bcrypt.compare(password, userInformation.user_password);
        logger.debug(`password validation result: ${isPasswordValid}`, );
        delete userInformation.user_password;
        delete userInformation.user_active;
        delete userInformation.user_id;

        if (!isPasswordValid) {
            logger.error('invalid password');
            return res.status(400).json({ message: 'invalid password' });
        }

        // store in the token on the date, not including the time
        userInformation.user_created = userInformation.user_created.toISOString().split('T')[0];

        // create a token
        token = jwt.sign(userInformation, process.env.JWT_SECRET, { expiresIn: '1h' });

        // set an http-only cookie using the provided token
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour in milliseconds
        });

        // return userinformation aside from the password (which was deleted)
        logger.debug('login success');
        return res.status(200).json({ 
            message: "login success",
            user_information: 
                {
                    username: userInformation.user_username,
                    number: userInformation.user_number,
                    first_name: userInformation.user_first,
                    page_mode: userInformation.page_mode,
                    currency: userInformation.curr_code,
                    currency_sign: userInformation.curr_sign
                }
        });
    
    } catch (err) {
        logger.error('an error occured while logging in');
        logger.error(err);
        return res.status(500).json({ message: 'a server error occured while logging in' });
    }
});

// logout the user
router.post('/logout', async(req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
    });
    
    res.status(200).json({ message: 'logout success'} );
});

// create a user instance
router.post('/sign-up', async (req, res) => {
    try {
        // initialize variables
        const token = req.cookies['token'] ? true : false;
        const userInformation = req.body;
        const userPhone = userInformation.phone ? String(userInformation.phone) : null;
        const userInitial = userInformation.initial ? String(userInformation.initial.replace(/\s+/g, ' ').toLowerCase()) : null;
        let hashedPassword;
        let userNumber;
        let insertQuery;
        let resultQuery;

        /* this section validates data before working with them */
        // verify that the user is not logged in while making an account (they must not have a token that was generated from this website)
        if (token) {
            logger.error('user must not be logged in while signing up');
            return res.status(403).json({ message: 'user must not be logged in while signing up' });
        }

        //  if any required attributes are missing, throw an error
        if (!userInformation.first_name ||
            !userInformation.last_name ||
            !userInformation.email ||
            !userInformation.username ||
            !userInformation.password
        ) {
            logger.error('sign-up required information missing');
            logger.error('required: first and last names; email, username, and password');
            logger.error('optional: phone and initial');
            return res.status(400).json({ message: 'required information are missing while signing up' });
        }

        /* this section modifies a few data for the user */
        // hash the user's password at saltround 10
        hashedPassword = await bcrypt.hash(userInformation.password, 10);
        logger.debug("successfully hashed the user's password");
        delete userInformation.password;

        // generate a user number
        userNumber = generateCustomNumber('USER').toUpperCase();
        logger.debug(`sucessfully generated a unique user number: ${userNumber}`);

        /* this section inserts the given information to the user entity */
        // insert statement
        insertQuery = "INSERT INTO user (user_number, user_username, user_password, user_first, user_initial, user_last, user_email, user_phone)";
        insertQuery += "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        resultQuery = await executeWriteQuery(insertQuery, [
            userNumber,
            userInformation.username.replace(/\s+/g, ' ').trim().toLowerCase(),
            hashedPassword,
            userInformation.first_name.replace(/\s+/g, ' ').trim().toLowerCase(),
            userInitial,
            userInformation.last_name.replace(/\s+/g, ' ').trim().toLowerCase(),
            userInformation.email.replace(/\s+/g, ' ').trim().toLowerCase(),
            userPhone
        ]);

        logger.debug('sucessfully created user account');
        logger.debug(resultQuery);
        return res.status(201).json({ message: 'sucessfully created user account' });

    } catch (err) {
        // errors directly noted from mysql are called here:
        // includes constraint violations to the user entity
        if (err.sqlMessage.includes('user_email_check')) {
            logger.error('invalid email format');
            return res.status(400).json({ message: 'invalid email format' });
        }

        if (err.sqlMessage.includes('user_phone_check')) {
            logger.error('invalid phone number format');
            return res.status(400).json({ message: 'invalid phone number format' });
        }

        if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_email')) {
            logger.error('a duplicate email was attempted to be inserted to the user entity');
            return res.status(409).json({ message: 'email is already taken' });
        }

        if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_phone')) {
            logger.error('a duplicate phone number was attempted to be inserted to the user entity');
            return res.status(409).json({ message: 'phone number is already taken' });
        }

        if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_username')) {
            logger.error('a duplicate username was attempted to be inserted to the user entity');
            return res.status(409).json({ message: 'username is already taken' });
        }

        if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED" && err.sqlMessage.includes('user_username_check')) {
            logger.error('username must not have a white space');
            return res.status(400).json({ message: 'username must not have a white space' });
        }

        if (err.code.includes('ER_DATA_TOO_LONG') && err.sqlMessage.includes('user_initial')) {
            logger.error('initial must be a single alphabet only');
            return res.status(400).json({ message: 'initial must be a single alphabet only' });
        }

        if (err.code.includes('ER_CHECK_CONSTRAINT_VIOLATED') && err.sqlMessage.includes('user_initial_check')) {
            logger.error('initial must be a single alphabet only');
            return res.status(400).json({ message: 'initial must be a single alphabet only' });
        }

        logger.error('an error occured during the sign up process in /sign-up');
        logger.error(err);
        return res.status(500).json({ message: 'a server error occured while signing up, please try again' });
    }
});

// retrieve a user row 
router.get('/user-information/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformation = { ...req.user }; // copy the information 
        const parameterNumber = req.params.user_number;

        // if the user who's currently logged in does not match with the route parameter's information, throw an error
        if (parameterNumber !== userInformation.user_number) {
            logger.error('user accessing the route does not match the parameter number');
            return res.status(403).json({ message: 'not allowed to access the resource' });
        }

        // remove unnecessary information 
        delete userInformation.user_id
        delete userInformation.iat;
        delete userInformation.exp;

        // success
        logger.debug("successfully retrieved the accessing user's information");
        return res.status(200).json({ 
            message: `successfully retrieved's account information`,
            user_information: userInformation
        });

    } catch (err) {
        logger.error('an error occured while retrieving a user row instance');
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while retrieving using information' });
    }
});

// update password
router.put('/change-password/:user_number', authorizeToken, async (req, res) => {
    try {
        const userNumber = req.user.user_number;
        const parameterNumber = req.params.user_number;
        const { new_password, current_password } = req.body;
        let databasePassword;
        let isPasswordValid;
        let hashedPassword;
        let selectQuery;
        let updateQuery;
        let resultQuery;

        // if the user who's currently logged in does not match with the route parameter's information, throw an error
        if (userNumber !== parameterNumber) {
            logger.error('user accessing the route does not match the parameter number');
            return res.status(403).json({ message: "not allowed access to the resource"})
        }

        // validate incoming body data
        if (!new_password || !current_password) {
            logger.error('new and current passwords are missing');
            return res.status(400).json({ message: 'new and current passwords are missing' });
        }

        // retrieve the user's password
        selectQuery = "SELECT user_password FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userNumber]);

        if (resultQuery.length !== 1) {
            logger.error('this should never happen; the user does not exist');
            return res.status(404).json({ message: 'unable to find the user; this should not happen' });
        }

        // store retrieved password and verify it matches the current password provided by the user
        databasePassword = resultQuery[0].user_password;
        isPasswordValid = await bcrypt.compare(current_password, databasePassword);
        logger.debug(`password validation result: ${isPasswordValid}`);
        delete databasePassword;
        delete current_password;

        if (!isPasswordValid) {
            logger.error('invalid password');
            return res.status(400).json({ message: 'invalid password' });
        }

        // hash the user's password at saltround 10
        hashedPassword = await bcrypt.hash(new_password, 10);
        logger.debug("successfully hashed the user's password");

        // update the password in the database
        updateQuery = "UPDATE user SET user_password = ? WHERE user_number = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [hashedPassword, userNumber]);

        logger.debug('successfully update user password');
        return res.status(200).json({ message: 'password successfully updated' });

    } catch (err) {
        logger.error("an error occured while updating the user's password");
        logger.error(err);
        return res.status(500).json({ message: "an error occured while updating the user's password" });
    }
});

// update username
router.put('/change-username/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformationFromToken = req.user;
        const parameterNumber = req.params.user_number;
        const { new_username, current_password } = req.body;
        const username = new_username.replace(/\s+/g, ' ').trim().toLowerCase(); // filtering username 
        let userInformation
        let isPasswordValid;
        let selectQuery;
        let updateQuery;
        let resultQuery;
        let token;

        // if the user who's currently logged in does not match with the route parameter's information, throw an error
        if (userInformationFromToken.user_number !== parameterNumber) {
            logger.error('user accessing the route does not match the parameter number');
            return res.status(403).json({ message: "not allowed access to the resource"})
        }

        // validate incoming body data
        if (!new_username || !current_password) {
            logger.error('new username and current password are missing');
            return res.status(400).json({ message: 'new username and current password are missing' });
        }

        // retrieve the user's password
        selectQuery = "SELECT user_password FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userInformationFromToken.user_number]);

        if (resultQuery.length !== 1) {
            logger.error('this should never happen; the user does not exist');
            return res.status(404).json({ message: 'unable to find the user; this should not happen' });
        }

        // store retrieved password and verify it matches the current password provided by the user
        userInformation = resultQuery[0]
        isPasswordValid = await bcrypt.compare(current_password, userInformation.user_password);
        logger.debug(`password validation result: ${isPasswordValid}`);
        delete userInformation.user_password;
        delete current_password;

        if (!isPasswordValid) {
            logger.error('invalid password');
            return res.status(400).json({ message: 'invalid password' });
        }

        // update the username in the database
        updateQuery = "UPDATE user SET user_username = ? WHERE user_number = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [username, userInformationFromToken.user_number]);

        // change username for the middleware as well
        userInformationFromToken.user_username = username;

        // reinstate the token
        token = jwt.sign(userInformationFromToken, process.env.JWT_SECRET);

        // set an http-only cookie using the provided token
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour in milliseconds
        });

        logger.debug('successfully updated username');
        return res.status(200).json({ message: 'username successfully updated', new_username:  username });

    } catch (err) {
        logger.error("an error occured while updating the user's username");

        // if username has a space between, throw an error
        if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED" && err.sqlMessage.includes('user_username_check')) {
            logger.error('username must not have a white space');
            return res.status(400).json({ message: 'username must not have a white space' });
        }

        logger.error(err);
        return res.status(500).json({ message: "an error occured while updating the user's username" });
    }
});

// update user information
router.put('/change-information/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformationFromToken = req.user;
        const parameterNumber = req.params.user_number;
        const newUserInformation = req.body;
        let updateQuery;
        let resultQuery;
        let token;

        // if the accessing user's number does not match the parameter number, throw a forbidden error
        if (parameterNumber !== userInformationFromToken.user_number) {
            logger.error('user is forbidden to access this resource');
            return res.status(403).json({ message: 'user is forbidden to access this resource' });
        }

        // validate body data
        if (!newUserInformation.first || !newUserInformation.last || !newUserInformation.initial || !newUserInformation.email || !newUserInformation.phone) {
            logger.error('missing required information for updating user information');
            return res.status(400).json({ message: 'missing required information for updating user information' });
        }

        // update data to the database
        updateQuery = "UPDATE user SET user_first = ?, user_last = ?, user_initial = ?, user_email = ?, user_phone = ? WHERE user_number = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [
            newUserInformation.first.replace(/\s+/g, ' ').trim().toLowerCase(),
            newUserInformation.last.replace(/\s+/g, ' ').trim().toLowerCase(),
            newUserInformation.initial.replace(/\s+/g, ' ').trim().toLowerCase(),
            newUserInformation.email.replace(/\s+/g, ' ').trim().toLowerCase(),
            newUserInformation.phone,
            userInformationFromToken.user_number
        ]);

        logger.debug('successfully updated user information');
        
        // modify the token
        userInformationFromToken.user_first = newUserInformation.first.replace(/\s+/g, ' ').trim().toLowerCase();
        userInformationFromToken.user_last = newUserInformation.last.replace(/\s+/g, ' ').trim().toLowerCase();
        userInformationFromToken.user_initial = newUserInformation.initial.replace(/\s+/g, ' ').trim().toLowerCase(),
        userInformationFromToken.user_email = newUserInformation.email.replace(/\s+/g, ' ').trim().toLowerCase(),
        userInformationFromToken.user_phone = newUserInformation.phone;
        
        // reinstate the token
        token = jwt.sign(userInformationFromToken, process.env.JWT_SECRET);

        // set an http-only cookie using the provided token
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour in milliseconds
        });

        logger.debug('successfully updated token');
        return res.status(200).json({ 
            message: 'user information successfully updated', 
            user_information: {
                    first_name: userInformationFromToken.user_first
                } 
        });

    } catch (err) {
        if (err.sqlMessage.includes('user_email_check')) {
            logger.error('invalid email format');
            return res.status(400).json({ message: 'invalid email format' });
        }

        if (err.sqlMessage.includes('user_phone_check')) {
            logger.error('invalid phone number format');
            return res.status(400).json({ message: 'invalid phone number format' });
        }

        if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_email')) {
            logger.error('a duplicate email was attempted to be inserted to the user entity');
            return res.status(409).json({ message: 'email is already taken' });
        }

        if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_phone')) {
            logger.error('a duplicate phone number was attempted to be inserted to the user entity');
            return res.status(409).json({ message: 'phone number is already taken' });
        }

        if (err.code.includes('ER_DATA_TOO_LONG') && err.sqlMessage.includes('user_initial')) {
            logger.error('initial must be a single alphabet only');
            return res.status(400).json({ message: 'initial must be a single alphabet only' });
        }

        if (err.code.includes('ER_CHECK_CONSTRAINT_VIOLATED') && err.sqlMessage.includes('user_initial_check')) {
            logger.error('initial must be a single alphabet only');
            return res.status(400).json({ message: 'initial must be a single alphabet only' });
        }

        logger.error('an error occured while updating user information');
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while updating user information' });
    } 
});

// disable user account
router.put('/disable-user/:user_number', authorizeToken, async (req, res) => {
    try {
        const parameterNumber = req.params.user_number;
        const userInformationFromToken = req.user;
        const { current_password } = req.body;
        let databasePassword;
        let updateQuery;
        let selectQuery;
        let resultQuery;
        let isPasswordValid;

        // if the accessing user's number does not match the parameter number, throw a forbidden error
        if (parameterNumber !== userInformationFromToken.user_number) {
            logger.error('user is forbidden to access this resource');
            return res.status(403).json({ message: 'user is forbidden to access this resource' });
        }

        // validate password
        if (!current_password) {
            logger.error('password is missing');
            return res.status(400).json({ message: 'password is missing' });
        }

        // compare password, then throw an error if password do not match
        selectQuery = "SELECT user_password FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userInformationFromToken.user_number]);

        if (resultQuery.length !== 1) {
            logger.error('unable to find user instance');
            return res.status(404).json({ message: 'unable to find instance of this user, contact the administrator immediately' });
        }

        databasePassword = resultQuery[0].user_password;
        isPasswordValid = await bcrypt.compare(current_password, databasePassword);
        logger.debug(`password validation result: ${isPasswordValid}`);
        delete databasePassword;
        delete current_password;

        if (!isPasswordValid) {
            logger.error('invalid password');
            return res.status(400).json({ message: 'invalid password' });
        }

        // update user_active in the database
        updateQuery = "UPDATE user SET user_active = ? WHERE user_number = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [0, userInformationFromToken.user_number]);
        logger.debug('successfully disable the user account');

        // clear cookies to logout
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
        });
        
        return res.status(200).json({ message: 'successfully cleared token and disabled the user account'} );

    } catch (err) {
        logger.error('an error occured while disabling the account');
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while disabling the account' });
    }
});

// verify the user is authorized while going through each secured page
router.get('/verify-token', (req, res) => {
    const token = req.cookies['token'];

    // Check if the token exists
    if (!token) {
        logger.error('unauthorized: no token provided');
        return res.status(401).json({ message: 'unauthorized: no token provided' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            logger.error('unauthorized: invalid token');
            return res.status(401).json({ message: 'unauthorized: invalid token' });
        }

        // If the token is valid, respond with success
        logger.debug('token is valid');
        return res.status(200).json({ message: 'token is valid' });
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { executeWriteQuery, executeReadQuery } = require('../connection/pool');
const logger = require('../misc/logger');
const authorizeToken = require('../middleware/authorize-token');
const jwt = require('jsonwebtoken');

// update user settings
router.put('/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformationFromToken = req.user;
        const userNumber = userInformationFromToken.user_number;
        const parameterNumber = req.params.user_number;
        const newSettings = req.body;
        let newCurrencySign;
        let userID;
        let selectQuery;
        let updateQuery;
        let resultQuery;

        // if the accessing user's number does not match the parameter number, throw a forbidden error
        if (parameterNumber !== userNumber) {
            logger.error('user is forbidden to access this resource');
            return res.status(403).json({ message: 'user is forbidden to access this resource' });
        }

        // validate incoming data
        if (!newSettings.page_mode || !newSettings.curr_code) {
            logger.error('required setting information missing');
            return res.status(500).json({ message: 'required setting information missing' });
        }

        // retrieve user id
        selectQuery = "SELECT user_id FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userNumber]);
        if (resultQuery.length !== 1) {
            logger.error('missing user id for this user number; contact the administrator immediately');
            return res.status(400).json({ message: 'missing user id for this user number; contact the administrator immediately' });
        }
        userID = Number(resultQuery[0].user_id);

        // find the currency sign associated with the new currency
        selectQuery = 'SELECT curr_sign FROM currency WHERE curr_code = ?;';
        resultQuery = await executeReadQuery(selectQuery, [newSettings.curr_code.replace(/\s+/g, ' ').trim().toUpperCase()]);
        if (resultQuery.length !== 1) {
            logger.error('new currency chosen is not affliated with the list of acceptable currencies');
            return res.status(400).json({ message: 'unrecognized currency, try again' });
        }
        newCurrencySign = resultQuery[0].curr_sign;

        // throw an error if page_mode is neither light or dark
        if (newSettings.page_mode !== 'light' && newSettings.page_mode !== 'dark') {
            logger.error("invalid page mode values, only light or dark are acceptable");
            return res.status(400).json({ message: 'invalid page mode values, only light or dark are acceptable' });
        }

        // update user settings
        updateQuery = "UPDATE setting SET page_mode = ?, curr_code = ? WHERE user_id = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [
            newSettings.page_mode.replace(/\s+/g, ' ').trim().toLowerCase(),
            newSettings.curr_code.replace(/\s+/g, ' ').trim().toUpperCase(),
            userID
        ]);
        logger.debug('successfully updated settings for the user');
        
        // modify the token
        userInformationFromToken.page_mode = newSettings.page_mode.replace(/\s+/g, ' ').trim().toLowerCase();
        userInformationFromToken.curr_code = newSettings.curr_code.replace(/\s+/g, ' ').trim().toUpperCase();
        userInformationFromToken.curr_sign = newCurrencySign;

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
            message: 'user settings successfully updated', 
            user_information: {
                    page_mode: userInformationFromToken.page_mode,
                    currency_code: userInformationFromToken.curr_code,
                    currency_sign: newCurrencySign
                } 
        });

    } catch (err) {
        logger.error('an error occured while updating user settings')
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while updating user settings' });
    }
});
module.exports = router;
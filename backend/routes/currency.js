const express = require('express');
const router = express.Router();
const { executeReadQuery } = require('../connection/pool');
const logger = require('../misc/logger');
const authorizeToken = require('../middleware/authorize-token');

// retrieve all currency values
router.get('/', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let currencyTable;

        selectQuery = "SELECT curr_code, curr_name, curr_sign FROM currency;";
        currencyTable = await executeReadQuery(selectQuery);

        logger.debug('successfully retrieved currency table');
        return res.status(200).json({
            message: 'successfully retrieved currency table',
            currencies: currencyTable
        });
    } catch (err) {
        logger.error('an error occured while retrieving currencies');
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while retrieving currencies' });
    }
});

module.exports = router;
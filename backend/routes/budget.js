const express = require('express');
const router = express.Router();
const { executeWriteQuery, executeReadQuery } = require('../connection/pool');
const logger = require('../misc/logger');
const authorizeToken = require('../middleware/authorize-token');

// add a budget
router.post('/', authorizeToken, async (req, res) => {
    try {
        const userNumber = req.user.user_number;
        const userCurrencyCode = req.user.curr_code;
        const budgetInformation = req.body;
        const budgetDescription = budgetInformation.description ? budgetInformation.description.replace(/\s+/g, ' ').trim().toLowerCase() : null;
        let userID;
        let budgetSequence;
        let selectQuery;
        let resultQuery;
        let insertQuery;
        let dollarToCurrency;
        let budgetInUSD;

        // validate incoming data
        if (!budgetInformation.amount || !budgetInformation.start_date || !budgetInformation.end_date) {
            logger.error('required budget information missing');
            return res.status(400).json({ message: 'required budget information missing' })
        }

        // retrieve user id
        selectQuery = "SELECT user_id FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userNumber]);
        if (resultQuery.length !== 1) {
            logger.error('missing user id for this user number; contact the administrator immediately');
            return res.status(400).json({ message: 'missing user id for this user number; contact the administrator immediately' });
        }
        userID = Number(resultQuery[0].user_id);

        // find the latest budget sequence for the user, add 1, and it will be the sequence number for this new budget
        selectQuery = "SELECT bud_seq AS current_sequence FROM budget WHERE user_id = ? ORDER BY bud_seq DESC LIMIT 1;";
        resultQuery = await executeReadQuery(selectQuery, [userID]);
        budgetSequence = resultQuery.length === 1 ? Number(resultQuery[0].current_sequence) + 1 : 1;

        // convert to USD before inserting the amount to the database
        selectQuery = "SELECT dollar_to_curr FROM currency WHERE curr_code = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userCurrencyCode]);
        if (resultQuery.length !== 1) {
            logger.error('invalid currency');
            return res.status(400).json({ message: 'invalid currency' });
        }
        dollarToCurrency = resultQuery[0].dollar_to_curr;
        budgetInUSD = Number(budgetInformation.amount) / Number(dollarToCurrency);

        // insert budget to the database
        insertQuery = "INSERT INTO budget (user_id, bud_seq, bud_amt, bud_desc, bud_start_date, bud_end_date) VALUES (?, ?, ?, ?, ?, ?);";
        resultQuery = await executeWriteQuery(insertQuery, [
            userID,
            budgetSequence,
            budgetInUSD,
            budgetDescription,
            budgetInformation.start_date.replace(/\s+/g, ' ').trim(),
            budgetInformation.end_date.replace(/\s+/g, ' ').trim()
        ]);

        delete userID;
        logger.debug('successfully added the budget for the user');
        return res.status(201).json({ message: 'successfully added the budget for the user' });

    } catch (err) {
        logger.error('an error occured while adding a budget');
        
        if (err.sqlMessage && err.sqlMessage.includes('date range conflict')) {
            logger.error('an existing budget falls within your range of date; you must delete that budget first to continue');
            return res.status(400).json({ message: 'an existing budget falls within your range of date; you must delete that budget first to continue' });
        }

        if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED" && err.sqlMessage.includes('bud_date_check')) {
            logger.error('start date must not be greater than the end date');
            return res.status(400).json({ message: 'start date must not be greater than the end date' });
        }

        logger.error(err);
        return res.status(500).json({ message: 'an error occured while adding a budget', error: err });
    }
});

// retrieve all budgets related to the current user
router.get('/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformationFromToken = req.user;
        const userCurrencyCode = userInformationFromToken.curr_code;
        const parameterNumber = req.params.user_number;
        let conversionRate;
        let currencySign;
        let selectQuery;
        let resultQuery;
        let userBudgets;

        // throw an error if user_number from the token does not match the user_number from parameter
        if (userInformationFromToken.user_number !== parameterNumber) {
            logger.error('user accessing this information does not match the person logged in');
            return res.status(403).json({ message: 'user accessing this information does not match the person logged in' });
        }

        // retrieve the conversion rate 
        selectQuery = "SELECT dollar_to_curr, curr_sign FROM currency WHERE curr_code = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userCurrencyCode]);
        if (resultQuery.length !== 1) {
            logger.error('invalid currency');
            return res.status(400).json({ message: 'invalid currency' });
        }
        conversionRate = Number(resultQuery[0].dollar_to_curr);
        currencySign = resultQuery[0].curr_sign;

        selectQuery = `SELECT bud_seq, bud_amt, bud_desc, 
                        DATE_FORMAT(bud_start_date, '%Y-%m-%d') as bud_start_date, 
                        DATE_FORMAT(bud_end_date, '%Y-%m-%d') as bud_end_date, bud_active 
                        FROM user u JOIN budget b ON u.user_id = b.user_id 
                        WHERE user_number = ?;`;
        resultQuery = await executeReadQuery(selectQuery, [userInformationFromToken.user_number]);
        if (resultQuery.length >= 1) {
            userBudgets = resultQuery.map(budget => {
                return {
                    budget_number: Number(budget.bud_seq),
                    amount: Number((Number(budget.bud_amt) * conversionRate).toFixed(2)),
                    description: String(budget.bud_desc),
                    start_date: String(budget.bud_start_date),
                    end_date: String(budget.bud_end_date),
                    active: Number(budget.bud_active),
                }
            });
        } else {
            userBudgets = null;
        }

        logger.debug('successfully retrieved all budgets for the user');
        return res.status(200).json({ 
            message: 'successfully retrieved all budgets for the user', 
            expenses: userBudgets, 
            currency_sign: currencySign 
        });

    } catch (err) {
        logger.error('an error occured while retrieving');
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while retrieving', error: err});
    }
});

// delete a budget
router.delete('/:user_number/:budget_number', authorizeToken, async (req, res) => {
    try {
        const userNumber = req.user.user_number;
        const parameterUserNumber = req.params.user_number;
        const parameterBudgetNumber = Number(req.params.budget_number);
        let userID;
        let selectQuery;
        let deleteQuery;
        let resultQuery;

        // throw an error if user_number from the token does not match the user_number from parameter
        if (userNumber !== parameterUserNumber) {
            logger.error('user accessing this information does not match the person logged in');
            return res.status(403).json({ message: 'user accessing this information does not match the person logged in' });
        }

        // retrieve user id
        selectQuery = "SELECT user_id FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userNumber]);
        if (resultQuery.length !== 1) {
            logger.error('missing user id for this user number; contact the administrator immediately');
            return res.status(400).json({ message: 'missing user id for this user number; contact the administrator immediately' });
        }
        userID = Number(resultQuery[0].user_id);

        // delete the current budget sequence
        deleteQuery = "DELETE FROM budget WHERE user_id = ? AND bud_seq = ?;";
        resultQuery = await executeWriteQuery(deleteQuery, [userID, parameterBudgetNumber]);

        logger.debug('successfully deleted the budget');
        logger.debug(resultQuery);
        return res.status(200).json({ message: 'successfully deleted the budget' });

    } catch (err) {
        logger.error('an error occured while deleting an instance of budget for the user');
        logger.error(err);
        return res.status(500).json({ message: 'an error occured while deleting an instance of budget for the user', error: err });
    }
});

module.exports = router;
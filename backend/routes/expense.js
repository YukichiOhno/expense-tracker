const express = require('express');
const router = express.Router();
const { executeWriteQuery, executeReadQuery } = require('../connection/pool');
const logger = require('../misc/logger');
const authorizeToken = require('../middleware/authorize-token');

// add an expense
router.post('/', authorizeToken, async (req, res) => {
    try {
        const userNumber = req.user.user_number;
        const expenseInformation = req.body;
        const expenseDescription = expenseInformation.description ? expenseInformation.description.replace(/\s+/g, ' ').trim().toLowerCase() : null;
        let userID;
        let expenseCount;
        let selectQuery;
        let resultQuery;
        let insertQuery;

        // validate data
        if (!expenseInformation.amount || !expenseInformation.date || !expenseInformation.category) {
            logger.error('missing required expense information');
            return res.status(400).json({ message: 'missing required expense information' });
        }

        // count the amount of expense listed for the user
        selectQuery = "SELECT u.user_id, COUNT(*) as expense_count FROM user u JOIN expense e ON u.user_id = e.user_id WHERE user_number = ? GROUP BY user_number;";
        resultQuery = await executeReadQuery(selectQuery, [userNumber]);
        expenseCount = Number(resultQuery[0].expense_count) + 1;
        userID = Number(resultQuery[0].user_id);

        insertQuery = "INSERT INTO expense (user_id, exp_seq, exp_amt, exp_desc, exp_date, exp_cat) VALUES (?, ?, ?, ?, ?, ?);";
        resultQuery = await executeWriteQuery(insertQuery, [
            userID,
            expenseCount,
            Number(expenseInformation.amount),
            expenseDescription,
            expenseInformation.date.replace(/\s+/g, ' ').trim(),
            expenseInformation.category.replace(/\s+/g, ' ').trim().toLowerCase()
        ]);

        delete userID;
        logger.debug('successfully added the expense for the user');
        return res.status(201).json({ message: 'successfully added the expense for the user' });

    } catch (err) {
        logger.error('an error occured while adding an expense for the user');

        if (err.code.includes('ER_CHECK_CONSTRAINT_VIOLATED') && err.sqlMessage.includes('exp_cat_allowed_values')) {
            logger.error('category is not listed in the allowed values');
            return res.status(400).json({ message: 'invalid category value' });
        }

        logger.error(err);
        return res.status(500).json({ message: 'an error occured while adding an expense for the user' });
    }
});

// retrieve expense reporting for the current user
router.get('/summary/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformationFromToken = req.user;
        const parameterNumber = req.params.user_number;
        let selectQuery;
        let resultQuery;
        let totalExpenseAmt;
        let totalExpenseCount;
        let totalExpenseByCategory;
        let totalExpenseByDate;

        // throw an error if user_number from the token does not match the user_number from parameter
        if (userInformationFromToken.user_number !== parameterNumber) {
            logger.error('user accessing this information does not match the person logged in');
            return res.status(403).json({ message: 'user accessing this information does not match the person logged in' });
        }

        // retrieve active total amount of expenses for a user 
        selectQuery = "SELECT SUM(exp_amt) as total_expense FROM user u JOIN expense e ON u.user_id = e.user_id WHERE user_number = ? AND exp_active = ? GROUP BY user_number;";
        resultQuery  = await executeReadQuery(selectQuery, [userInformationFromToken.user_number, 1]);
        totalExpenseAmt = Number(resultQuery[0].total_expense) || null;

        // retrieve active count of expenses for user
        selectQuery = "SELECT COUNT(*) as expense_count FROM user u JOIN expense e ON u.user_id = e.user_id WHERE user_number = ? AND exp_active = ? GROUP BY user_number;";
        resultQuery  = await executeReadQuery(selectQuery, [userInformationFromToken.user_number, 1]);
        totalExpenseCount = Number(resultQuery[0].expense_count) || null;

        // retrieve active total amount of expenses for a user by category 
        selectQuery = "SELECT exp_cat as category, SUM(exp_amt) as total_expense FROM user u JOIN expense e ON u.user_id = e.user_id WHERE user_number = ? AND exp_active = ? GROUP BY exp_cat;"
        resultQuery  = await executeReadQuery(selectQuery, [userInformationFromToken.user_number, 1]);
        totalExpenseByCategory = resultQuery.map(expense => {
            return {
                category: expense.category,
                total_expense: Number(expense.total_expense)
            }
        });

        // retrieve active total amount of expenses for a user by date
        selectQuery = "SELECT DATE_FORMAT(exp_date, '%Y-%m-%d') as date, SUM(exp_amt) as total_expense FROM user u JOIN expense e ON u.user_id = e.user_id WHERE user_number = ? AND exp_active = ? GROUP BY exp_date;";
        resultQuery  = await executeReadQuery(selectQuery, [userInformationFromToken.user_number, 1]);
        totalExpenseByDate = resultQuery.map(expense => {
            return {
                date: expense.date,
                total_expense: Number(expense.total_expense)
            }
        });

        logger.debug('sucessfully retrieved expense information');
        return res.status(200).json({ 
            message: 'sucessfully retrieved expense information',
            total_expense_amount: totalExpenseAmt,
            total_expense_count: totalExpenseCount,
            expense_by_category: totalExpenseByCategory,
            expense_by_date: totalExpenseByDate
        });

    } catch (err) {
        logger.error('an error occurred while retrieving expense summary information');
        logger.error(err);
        return res.status(500).json({ message: 'an error occurred while retrieving expense summary information' });
    }
});

// retrieve all expenses related to the current user
router.get('/:user_number', authorizeToken, async (req, res) => {
    try {
        const userInformationFromToken = req.user;
        const parameterNumber = req.params.user_number;
        let selectQuery;
        let resultQuery;
        let userExpenses;

        // throw an error if user_number from the token does not match the user_number from parameter
        if (userInformationFromToken.user_number !== parameterNumber) {
            logger.error('user accessing this information does not match the person logged in');
            return res.status(403).json({ message: 'user accessing this information does not match the person logged in' });
        }

        // retrieve all expenses for a user
        selectQuery = "SELECT exp_seq, exp_amt, exp_desc, DATE_FORMAT(exp_date, '%Y-%m-%d') as exp_date, exp_cat, exp_active FROM user u JOIN expense e ON u.user_id = e.user_id WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, userInformationFromToken.user_number);
        userExpenses = resultQuery.map(expense => {
            return {
                expense_number: Number(expense.exp_seq),
                amount: Number(expense.exp_amt),
                description: String(expense.exp_desc),
                date: String(expense.exp_date),
                category: String(expense.exp_cat),
                active: Number(expense.exp_active)
            }
        });

        logger.debug('successfully retrieved all expenses for the user');
        return res.status(200).json({ message: 'successfully retrieved all expenses for the user', expenses: userExpenses });

    } catch (err) {
        logger.error('an error occurred while retrieving expense information');
        logger.error(err);
        return res.status(500).json({ message: 'an error occurred while retrieving expense information' });
    }
});

// update an expense related to the current user
router.put('/:user_number/:expense_number', authorizeToken, async (req, res) => {
    try {
        const parameterNumber = req.params.user_number;
        const expenseNumber = req.params.expense_number;
        const userNumberFromToken = req.user.user_number;
        const newExpenseInformation = req.body;
        let userID;
        let selectQuery;
        let updateQuery;
        let resultQuery;

        // throw an error if user_number from the token does not match the user_number from parameter
        if (userNumberFromToken !== parameterNumber) {
            logger.error('user accessing this information does not match the person logged in');
            return res.status(403).json({ message: 'user accessing this information does not match the person logged in' });
        }

        // validate body data
        if (
            !newExpenseInformation.amount ||
            !newExpenseInformation.description ||
            !newExpenseInformation.date ||
            !newExpenseInformation.category ||
            !newExpenseInformation.active
        ) {
            logger.error('missing required information for updating the expense');
            return res.status(400).json({ message: 'missing required information for updating the expense' });
        }

        // retrieve userID
        selectQuery = "SELECT user_id FROM user WHERE user_number = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userNumberFromToken]);

        if (resultQuery.length !== 1) {
            logger.error('cannot find user');
            return res.status(404).json({ message: 'cannot find the user while logged in; contact administrator now'});
        }
        userID = resultQuery[0].user_id;

        // update the expense entity
        updateQuery = "UPDATE expense SET exp_amt = ?, exp_desc = ?, exp_date = ?, exp_cat = ?, exp_active = ? WHERE user_id = ? AND exp_seq = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [
                Number(newExpenseInformation.amount),
                newExpenseInformation.description.replace(/\s+/g, ' ').trim().toLowerCase(),
                newExpenseInformation.date.replace(/\s+/g, ' ').trim(),
                newExpenseInformation.category.replace(/\s+/g, ' ').trim().toLowerCase(),
                Number(newExpenseInformation.active),
                userID,
                expenseNumber
        ]);

        logger.debug('successfully updated the expense');
        return res.status(200).json({ message: 'successfully updated the expense' });

    } catch (err) {
        logger.error('an error occured while updating an expense of the user');

        if (err.code.includes('ER_CHECK_CONSTRAINT_VIOLATED') && err.sqlMessage.includes('exp_cat_allowed_values')) {
            logger.error('category is not listed in the allowed values');
            return res.status(400).json({ message: 'invalid category value' });
        }

        logger.error(err);
        return res.status(500).json({ message: 'an error occured while updating an expense of the user' });
    }
});

module.exports = router;

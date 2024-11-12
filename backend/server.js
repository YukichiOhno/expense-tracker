// main file for the backend

// import functionalities
const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// allow the use of .env files
dotenv.config();

// creates an instance of an express application
const app = express();

// add cors header to the server
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

// setup and access request body
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET));

// setup middleware for routes
app.use('/api/user', require('./routes/user.js'));
app.use('/api/expense', require('./routes/expense.js'));
app.use('/api/budget', require('./routes/budget.js'));
app.use('/api/setting', require('./routes/setting.js'));
app.use('/api/currency', require('./routes/currency.js'));

// open the backend of the web
app.listen(process.env.APP_PORT, () => console.log(`server listening on port ${process.env.SERVER_URL}${process.env.APP_PORT}`));

// error handler
app.use(function (err, req, res, next) {
    // logs error and error code to console
    console.error(err.message, req);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  
    return res.status(err.statusCode).send(err.message);
});
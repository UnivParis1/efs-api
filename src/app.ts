const createError = require('http-errors');

const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');

const path = require('path');
const session = require('express-session')
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const svgCaptcha = require('svg-captcha');
import {rateLimiter} from './middlewares';


const searchRouter = require('./routes/search');

const app = express();

app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }))

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: process.env.SECURE_COOKIE}
}))
app.use(express.static(path.join(__dirname, '../../efs-gui', "build")));

app.use('/search', rateLimiter);
app.use('/search', searchRouter);

app.get('/captcha', function (req, res) {
    const captcha = svgCaptcha.create({noise: 1, width: 50, height: 20, fontSize: 14});
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../../efs-gui', "build", "index.html"));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

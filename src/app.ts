import responseTime from "response-time";
import {flowLimiter, rateLimiter, registerSlowRequest} from './middlewares';
import assetsResolverRouter, {CSS, JS} from "./routes/assetsResolver";

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

const searchRouter = require('./routes/search');
const app = express();

const allowedUrl: string = process.env.CLIENT_URL ?? "[]";

app.use(cors({credentials: true, origin: JSON.parse(allowedUrl)}))

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
    cookie: {secure: process.env.SECURE_COOKIE, sameSite: 'none', maxAge: 24 * 60 * 60 * 10, path: '/'}
}))
const assetsPath = path.join(__dirname, '../../efs-gui', "build-stable");
app.use(express.static(assetsPath));

app.use('/search', rateLimiter);
app.use('/search', flowLimiter);
app.use('/search', responseTime((req, res, time) => {
    if (res.statusCode === 200) registerSlowRequest(req.body.model, time)
}))
app.use('/search', searchRouter);
app.use('/main.js', function (req, res, next) {
    req.requested_file = "js/main*.js";
    req.assets_path = assetsPath;
    req.requested_file_type = JS;
    next();
}, assetsResolverRouter);
app.use('/main.css', function (req, res, next) {
    req.requested_file = "css/main*.css";
    req.assets_path = assetsPath;
    req.requested_file_type = CSS;
    next();
}, assetsResolverRouter);


app.get('/captcha', function (req, res) {
    const captcha = svgCaptcha.create({noise: 1, width: 50, height: 20, fontSize: 14});
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
});

app.get("/", (req, res) => {
    res.sendFile(`${assetsPath}/index.html`);
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

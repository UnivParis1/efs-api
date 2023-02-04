import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
    // windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
    windowMs: 3 * 60 * 1000, // 3 minutes in milliseconds
    max: 20,
    message: 'You have exceeded the 100 requests in 24 hrs limit!',
    standardHeaders: true,
    legacyHeaders: false,
});
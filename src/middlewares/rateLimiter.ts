import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes in milliseconds
    max: 20,
    message: 'You have exceeded the 20 requests in 3 minutes limit!',
    standardHeaders: true,
    legacyHeaders: false,
});
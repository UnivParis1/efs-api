import {NextFunction, Request, Response} from 'express';
import {createClient} from "redis";

const BOLT_NAME_PREFIX = "bolt";
const BOLT_THRESHOLD_MS = 5000;
const BOLT_TTL_S = 10;

async function connectToRedis() {
    const client = createClient({
        url: process.env.REDIS_URL,
    })
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    return client;
}

const boltName = (model) => `${BOLT_NAME_PREFIX}-${model}`

export const flowLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const client = await connectToRedis();
    const bolt = await client.get(boltName(req.body.model));
    if (bolt === null) next()
    else res.status(503).send('Server under heavy load')
};

export const registerSlowRequest = async (model: string, time: number): void => {
    if (time > BOLT_THRESHOLD_MS) return
    connectToRedis().then((client) => client.set(boltName(model), 1, {'EX': BOLT_TTL_S}))
}

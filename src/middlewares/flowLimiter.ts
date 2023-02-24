import {NextFunction, Request, Response} from 'express';
import {createClient} from "redis";

const BOLT_NAME_PREFIX = "bolt";
const BOLT_THRESHOLD_MS = 5000;
const BOLT_TTL_S_MIN = 5;
const BOLT_TTL_S_MAX = 30;
const BOLT_TTL_S_INC = 1;
const BOLT_TTL_S_DEC = 5;
const BOLT_TTL_TTL = 1000;

async function connectToRedis() {
    const client = createClient({
        url: process.env.REDIS_URL,
    })
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    return client;
}

const boltFlagName = (model) => `${BOLT_NAME_PREFIX}-${model}-on`
const boltTtlName = (model) => `${BOLT_NAME_PREFIX}-${model}-ttl`

export const flowLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const client = await connectToRedis();
    const bolt = await client.get(boltFlagName(req.body.model));
    if (bolt === null) next()
    else res.status(503).send('Server under heavy load')
};

export const registerSlowRequest = async (model: string, time: number): Promise<void> => {
    if (time < BOLT_THRESHOLD_MS) {
        //request is fast
        connectToRedis().then(async (client) => {
            //read current penalty TTL
            client.get(boltTtlName(model)).then((TTL) => {
                if (TTL === null) return;
                const intTTL = parseInt(TTL);
                if (intTTL <= BOLT_TTL_S_MIN) return;
                // decrease penalty TTL
                client.set(boltTtlName(model), intTTL - BOLT_TTL_S_DEC, {'EX': BOLT_TTL_TTL});
            })
        })
    } else {
        //request is slow
        connectToRedis().then((client) => {
            //read current penalty TTL
            client.get(boltTtlName(model)).then((TTL) => {
                let intTTL: number;
                if (TTL === null) intTTL = BOLT_TTL_S_MIN;
                else intTTL = parseInt(TTL);
                //set the penalty flag with current ttl
                client.set(boltFlagName(model), 1, {'EX': intTTL});
                // increase penalty TTL
                intTTL = Math.min(BOLT_TTL_S_MAX, intTTL + BOLT_TTL_S_INC);
                client.set(boltTtlName(model), intTTL, {'EX': BOLT_TTL_TTL});
            })

        })
    }

}

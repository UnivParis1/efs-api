import {createClient} from "celery-node";
import Task from "celery-node/dist/app/task";

const MAX_SENTENCE_LENGTH = 400;
const TASKS_BY_MODEL = {
    sbert: "local_model_tasks.find_expert_with_sbert",
    ada: "remote_model_tasks.find_expert_with_ada",
}
const QUEUES_BY_MODEL = {
    sbert: "qcpu",
    ada: "qio",
}
const searchService = {

    celery_client: (queue_name: string) => createClient(
        process.env.CELERY_BROKER,
        process.env.CELERY_BACKEND,
        queue_name
    ),
    fetchExperts: async (sentence: string, precision: Number, model: string) => {
        if (!Object.keys(TASKS_BY_MODEL).includes(model)) {
            throw `Model ${model} not registered, abort !`
        }
        let cleanSentence = sentence.substring(0, MAX_SENTENCE_LENGTH).trim().replace(/\s\s+/g, ' ');
        const celeryClient = searchService.celery_client(QUEUES_BY_MODEL[model]);
        console.log(`Task called : ${TASKS_BY_MODEL[model]}`)
        const task: Task = celeryClient.createTask(TASKS_BY_MODEL[model]);
        const result = task.applyAsync([cleanSentence, precision]);
        const data = await result.get();
        await celeryClient.disconnect();
        return data;
    },
};

export default searchService;
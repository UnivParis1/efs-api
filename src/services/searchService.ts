import {createClient} from "celery-node";
import Task from "celery-node/dist/app/task";

const MAX_SENTENCE_LENGTH = 400;
const searchService = {
    celery_client: () => createClient(
        process.env.CELERY_BROKER,
        process.env.CELERY_BACKEND,
    ),
    fetchExperts: async (sentence: String, precision: Number, model: String) => {
        let cleanSentence = sentence.substring(0, MAX_SENTENCE_LENGTH).trim().replace(/\s\s+/g, ' ');
        const celery_client = searchService.celery_client();
        const task: Task = celery_client.createTask("tasks.find_experts");
        const result = task.applyAsync([cleanSentence, precision, model]);
        const data = await result.get();
        await celery_client.disconnect();
        return data;
    },
};

export default searchService;
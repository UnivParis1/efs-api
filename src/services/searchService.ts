import {createClient} from "celery-node";
import Task from "celery-node/dist/app/task";

const searchService = {
  celery_client: () => createClient(
    process.env.CELERY_BROKER,
    process.env.CELERY_BACKEND,
  ),
  fetchExperts: async (sentence: String, precision: Number) => {
    const celery_client = searchService.celery_client();
    const task: Task = celery_client.createTask("tasks.find_experts");
    const result = task.applyAsync([sentence, precision]);
    const data = await result.get();
    await celery_client.disconnect();
    return data;
  },
};

export default searchService;
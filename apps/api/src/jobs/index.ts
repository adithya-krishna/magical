import { runNotificationsJobs } from "./notifications";

const dayMs = 24 * 60 * 60 * 1000;

async function runAllJobs() {
  await runNotificationsJobs();
}

runAllJobs().catch((error) => {
  console.error("[jobs] initial run failed", error);
});

setInterval(() => {
  runAllJobs().catch((error) => {
    console.error("[jobs] scheduled run failed", error);
  });
}, dayMs);

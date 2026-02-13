import { Router } from "express";
import { accessRequestsRouter } from "../access-requests/access-request.routes";
import { admissionsRouter } from "../admissions/admission.routes";
import { classroomRouter } from "../classroom/classroom.routes";
import { coursesRouter } from "../courses/courses.routes";
import { instrumentsRouter } from "../courses/instruments.routes";
import { leadsRouter } from "../leads/lead.routes";
import { leadStagesRouter } from "../leads/lead-stage.routes";
import { notificationsRouter } from "./notifications";
import { usersRouter } from "./users";
import { usersManagementRouter } from "../users/users-management.routes";
import { coursePlansRouter } from "../admissions/course-plan.routes";
import { prerequisitesRouter } from "../prerequisites/prerequisites.routes";

export const apiRouter = Router();

apiRouter.use("/leads", leadsRouter);
apiRouter.use("/lead-stages", leadStagesRouter);
apiRouter.use("/access-requests", accessRequestsRouter);
apiRouter.use("/admissions", admissionsRouter);
apiRouter.use("/course-plans", coursePlansRouter);
apiRouter.use("/prerequisites", prerequisitesRouter);
apiRouter.use("/", classroomRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/instruments", instrumentsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/users", usersManagementRouter);

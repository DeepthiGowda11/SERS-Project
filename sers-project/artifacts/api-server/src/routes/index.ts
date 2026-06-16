import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classroomsRouter from "./classrooms";
import studentsRouter from "./students";
import sessionsRouter from "./sessions";
import emotionsRouter from "./emotions";
import notificationsRouter from "./notifications";
import parentRouter from "./parent";
import coachingRouter from "./coaching";
import overviewRouter from "./overview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(classroomsRouter);
router.use(studentsRouter);
router.use(sessionsRouter);
router.use(emotionsRouter);
router.use(notificationsRouter);
router.use(parentRouter);
router.use(coachingRouter);
router.use(overviewRouter);

export default router;

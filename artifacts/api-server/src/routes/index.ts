import { Router, type IRouter } from "express";
import healthRouter from "./health";
import audioRouter from "./audio";
import learningRouter from "./learning";
import paymentsRouter from "./payments";
import progressRouter from "./progress";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);
router.use(progressRouter);
router.use(audioRouter);
router.use(paymentsRouter);

export default router;

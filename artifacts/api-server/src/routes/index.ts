import { Router, type IRouter } from "express";
import healthRouter from "./health";
import zelaRouter from "./zela";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/zela", zelaRouter);

export default router;

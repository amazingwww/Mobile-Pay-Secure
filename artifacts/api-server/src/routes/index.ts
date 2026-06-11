import { Router, type IRouter } from "express";
import healthRouter from "./health";
import zelaRouter from "./zela";
import kycRouter from "./kyc";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/zela", zelaRouter);
router.use("/zela/kyc", kycRouter);

export default router;

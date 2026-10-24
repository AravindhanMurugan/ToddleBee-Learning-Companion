import { Router, type IRouter } from "express";
import {
  CreateDemoCheckoutBody,
  CreateDemoCheckoutResponse,
  GetPaymentStatusParams,
  GetPaymentStatusResponse,
  ReceivePaymentWebhookBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const unavailable = {
  providerAvailable: false,
  status: "unavailable",
  message:
    "Pine Labs is not connected for this demo. No payment was taken and no premium access was granted.",
  reference: null,
};

router.post("/payments/checkout", (req, res): void => {
  const body = CreateDemoCheckoutBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  res.json(CreateDemoCheckoutResponse.parse(unavailable));
});

router.get("/payments/status/:reference", (req, res): void => {
  const params = GetPaymentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  res.json(
    GetPaymentStatusResponse.parse({
      ...unavailable,
      message: `No verified Pine Labs transaction exists for ${params.data.reference}.`,
    }),
  );
});

router.post("/payments/webhook", (req, res): void => {
  const body = ReceivePaymentWebhookBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  // Provider authentication is not configured; do not accept or grant an entitlement.
  res.status(503).json({
    error: "Pine Labs webhook verification is unavailable in this demo.",
  });
});

export default router;

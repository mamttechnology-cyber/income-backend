import { Router } from "express";

const router = Router();

// Brevo delivery/bounce webhook. Configure this URL in the Brevo dashboard.
// Left as a stub that logs the payload -- wire it to
// notificationRepository once you decide which events you need
// (delivered, bounced, opened, etc).
router.post("/brevo", (req, res) => {
  console.log("[webhook:brevo]", JSON.stringify(req.body));
  res.status(200).json({ received: true });
});

export default router;

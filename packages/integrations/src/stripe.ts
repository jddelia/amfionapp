import Stripe from "stripe";

export type StripeClientOptions = Stripe.StripeConfig;

export const createStripeClient = (apiKey: string, options: StripeClientOptions = {}) => {
  return new Stripe(apiKey, {
    ...options
  });
};

export const verifyStripeWebhook = (
  stripe: Stripe,
  payload: Buffer | string,
  signature: string,
  webhookSecret: string
) => {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

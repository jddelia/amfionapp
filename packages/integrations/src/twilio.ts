import twilio from "twilio";

export const createTwilioClient = (accountSid: string, authToken: string) => {
  return twilio(accountSid, authToken);
};

export type SmsRequest = {
  to: string;
  body: string;
  messagingServiceSid?: string;
  from?: string;
};

export const sendSms = async (
  client: ReturnType<typeof createTwilioClient>,
  request: SmsRequest
) => {
  if (!request.messagingServiceSid && !request.from) {
    throw new Error("Either messagingServiceSid or from must be provided");
  }

  return client.messages.create({
    to: request.to,
    body: request.body,
    messagingServiceSid: request.messagingServiceSid,
    from: request.from
  });
};

export type DarajaOAuthResponse = {
  access_token: string;
  expires_in: string;
};

export type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage?: string;
};

export type StkCallbackItem = {
  Name: string;
  Value: string | number;
};

export type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item?: StkCallbackItem[] };
    };
  };
};

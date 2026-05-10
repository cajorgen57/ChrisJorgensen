import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

// Lazy singleton — Plaid client doesn't need request-scoped config.
let _client: PlaidApi | null = null;

export function plaid(): PlaidApi {
  if (_client) return _client;
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;
  const basePath = PlaidEnvironments[env];
  if (!basePath) {
    throw new Error(`Invalid PLAID_ENV: ${env}. Use sandbox | development | production.`);
  }
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set in .env");
  }
  _client = new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
          "Plaid-Version": "2020-09-14",
        },
      },
    })
  );
  return _client;
}

export function plaidProducts(): Products[] {
  return (process.env.PLAID_PRODUCTS ?? "transactions,investments")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean) as Products[];
}

export function plaidCountryCodes(): CountryCode[] {
  return (process.env.PLAID_COUNTRY_CODES ?? "US")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean) as CountryCode[];
}

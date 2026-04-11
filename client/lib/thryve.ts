// Thryve API client — low-level fetch wrapper.
// Auth headers are read from env vars at call time, never hardcoded.

export interface ThryveDailyRecord {
  day: string;
  createdAt: string;
  dailyDynamicValueType: number;
  dailyDynamicValueTypeName: string;
  value: string;
  valueType: "LONG" | "DOUBLE" | "DATE" | "STRING";
  details?: {
    timezoneOffset?: number;
    generation?: string;
    trustworthiness?: string;
    medicalGrade?: boolean;
  };
}

export interface ThryveDataSource {
  dataSource: number;
  data: ThryveDailyRecord[];
}

export interface ThryveRawDaily {
  authenticationToken: string;
  partnerUserID?: string;
  dataSources: ThryveDataSource[];
}

export interface ThryveEpochRecord {
  startTimestamp: string;
  endTimestamp: string;
  createdAt: string;
  dynamicValueType: number;
  dynamicValueTypeName: string;
  value: string;
  valueType: "LONG" | "DOUBLE" | "DATE" | "STRING" | "BOOLEAN";
  details?: {
    timezoneOffset?: number;
    generation?: string;
    trustworthiness?: string;
    medicalGrade?: boolean;
  };
}

export interface ThryveRawEpoch {
  authenticationToken: string;
  partnerUserID?: string;
  dataSources: {
    dataSource: number;
    data: ThryveEpochRecord[];
  }[];
}

function getAuthHeaders(): HeadersInit {
  const auth = process.env.THRYVE_AUTH;
  const appAuth = process.env.THRYVE_APP_AUTH;
  if (!auth || !appAuth) {
    throw new Error("Missing THRYVE_AUTH or THRYVE_APP_AUTH environment variables");
  }
  return {
    Authorization: `Basic ${auth}`,
    AppAuthorization: `Basic ${appAuth}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function getBaseUrl(): string {
  return process.env.THRYVE_BASE_URL ?? "https://api-qa.thryve.de";
}

export async function fetchDailyData(
  endUserId: string,
  startDay: string,
  endDay: string,
  valueTypes?: string
): Promise<ThryveRawDaily[]> {
  const body = new URLSearchParams({
    authenticationToken: endUserId,
    startDay,
    endDay,
    detailed: "true",
    displayTypeName: "true",
    displayPartnerUserID: "true",
  });
  if (valueTypes) body.set("valueTypes", valueTypes);

  const res = await fetch(`${getBaseUrl()}/v5/dailyDynamicValues`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Thryve dailyDynamicValues failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<ThryveRawDaily[]>;
}

export async function fetchEpochData(
  endUserId: string,
  startTimestamp: string,
  endTimestamp: string,
  valueTypes?: string
): Promise<ThryveRawEpoch[]> {
  const body = new URLSearchParams({
    authenticationToken: endUserId,
    startTimestamp,
    endTimestamp,
    detailed: "true",
    displayTypeName: "true",
    displayPartnerUserID: "true",
  });
  if (valueTypes) body.set("valueTypes", valueTypes);

  const res = await fetch(`${getBaseUrl()}/v5/dynamicEpochValues`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Thryve dynamicEpochValues failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<ThryveRawEpoch[]>;
}

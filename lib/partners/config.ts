// lib/partners/config.ts
// Partner API configuration management

import { PartnerType } from "./base";

export interface PartnerConfig {
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  orgId?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export function getPartnerConfig(partner: PartnerType): PartnerConfig {
  const config: PartnerConfig = {
    baseUrl: "",
    timeout: DEFAULT_TIMEOUT,
    retryAttempts: DEFAULT_RETRY_ATTEMPTS,
    retryDelay: DEFAULT_RETRY_DELAY,
  };

  switch (partner) {
    case "hsi":
      config.baseUrl = process.env.HSI_API_BASE_URL || "";
      config.apiKey = process.env.HSI_API_KEY;
      config.apiSecret = process.env.HSI_API_SECRET;
      config.orgId = process.env.HSI_ORGANIZATION_ID;
      break;

    case "certiport":
      // Certiport is portal-based (no API). Exams proctored on-site via Compass.
      // Admin portal: https://certiport.pearsonvue.com
      // Vouchers managed in portal, results recorded in LMS credential capture.
      config.baseUrl = "https://certiport.pearsonvue.com";
      break;

    case "careersafe":
      config.baseUrl = process.env.CAREERSAFE_API_BASE_URL || "";
      config.apiKey = process.env.CAREERSAFE_API_KEY;
      config.apiSecret = process.env.CAREERSAFE_API_SECRET;
      config.orgId = process.env.CAREERSAFE_ORGANIZATION_ID;
      break;

    case "milady":
      config.baseUrl = process.env.MILADY_API_BASE_URL || "";
      config.apiKey = process.env.MILADY_API_KEY;
      config.apiSecret = process.env.MILADY_API_SECRET;
      config.orgId = process.env.MILADY_ORGANIZATION_ID;
      break;

    case "jri":
      config.baseUrl = process.env.JRI_API_BASE_URL || "";
      config.apiKey = process.env.JRI_API_KEY;
      config.orgId = process.env.JRI_ORGANIZATION_ID;
      break;

    case "nrf":
      config.baseUrl = process.env.NRF_API_BASE_URL || "";
      config.apiKey = process.env.NRF_API_KEY;
      config.apiSecret = process.env.NRF_API_SECRET;
      config.orgId = process.env.NRF_ORGANIZATION_ID;
      break;

    case "nds":
      config.baseUrl = process.env.NDS_API_BASE_URL || "";
      config.apiKey = process.env.NDS_API_KEY;
      config.apiSecret = process.env.NDS_API_SECRET;
      config.orgId = process.env.NDS_ORGANIZATION_ID;
      break;
  }

  return config;
}

export function validatePartnerConfig(
  partner: PartnerType,
  config: PartnerConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push(`Missing base URL for ${partner}`);
  }

  if (!config.apiKey && partner !== "jri") {
    errors.push(`Missing API key for ${partner}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

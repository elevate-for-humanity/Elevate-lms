import '@/lib/paris/admissions/provisioning-service';

declare module '@/lib/paris/admissions/provisioning-service' {
  interface ProvisioningResult {
    credentialId?: string;
  }
}

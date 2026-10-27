import {
  getCredential,
  searchCredentials,
  UNIVERSAL_CREDENTIAL_REGISTRY,
  type CredentialDefinition,
} from './credential-engine';

export function searchAvailableCredentials(query: string): CredentialDefinition[] {
  return searchCredentials(query);
}

export function getCredentialBySlug(slug: string): CredentialDefinition | undefined {
  return getCredential(slug);
}

export function listAllCredentials(): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY);
}

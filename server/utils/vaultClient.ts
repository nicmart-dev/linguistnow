import Vault from "node-vault";
import { env } from "../env.js";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Sanitize user email for use in file paths
 * Prevents path traversal attacks by removing dangerous characters
 * @param userEmail - User's email address
 * @returns Sanitized email safe for use in paths
 * @throws Error if email is invalid or contains path traversal sequences
 */
function sanitizeEmailForPath(userEmail: string): string {
  if (!userEmail || typeof userEmail !== "string") {
    throw new Error("Invalid email: must be a non-empty string");
  }

  // Remove any path traversal sequences
  if (
    userEmail.includes("..") ||
    userEmail.includes("/") ||
    userEmail.includes("\\")
  ) {
    throw new Error("Invalid email: contains path traversal characters");
  }

  // Limit email length to prevent ReDoS attacks
  if (userEmail.length > 254) {
    throw new Error("Invalid email: exceeds maximum length");
  }
  // Basic email format validation (simple check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    throw new Error("Invalid email format");
  }

  // Remove any whitespace and normalize
  return userEmail.trim().toLowerCase();
}

// Lazy-initialize Vault client to ensure env vars are loaded
let vaultClient: ReturnType<typeof Vault> | null = null;

function getVaultClient(): ReturnType<typeof Vault> {
  if (!vaultClient) {
    // Use validated env for VAULT_ADDR, fallback to default
    // VAULT_TOKEN is optional and validated in env.ts
    const endpoint = env.VAULT_ADDR || "http://localhost:8200";
    const token = env.VAULT_TOKEN || "";
    console.log(`Initializing Vault client: ${endpoint}`);
    vaultClient = Vault({ endpoint, token });
  }
  return vaultClient;
}

function getSecretPath(): string {
  // VAULT_SECRET_PATH should be like "secret/data/linguistnow/tokens"
  // Use validated env, fallback to default
  return env.VAULT_SECRET_PATH || "secret/data/linguistnow/tokens";
}

function getMetadataPath(): string {
  // Derive metadata path from secret path (replace /data/ with /metadata/)
  const secretPath = getSecretPath();
  return secretPath.replace("/data/", "/metadata/");
}

/**
 * Write tokens to Vault for a specific user
 * @param userEmail - User's email address (used as key)
 * @param tokens - Access and refresh tokens
 */
export async function writeToken(
  userEmail: string,
  tokens: TokenPair,
): Promise<void> {
  const vault = getVaultClient();
  const sanitizedEmail = sanitizeEmailForPath(userEmail);
  const path = `${getSecretPath()}/${sanitizedEmail}`;
  console.log("Writing tokens to Vault:", path);
  await vault.write(path, {
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      updatedAt: new Date().toISOString(),
    },
  });
}

/**
 * Read tokens from Vault for a specific user
 * @param userEmail - User's email address (used as key)
 * @returns Token pair with access and refresh tokens
 */
export async function readToken(userEmail: string): Promise<TokenPair> {
  const vault = getVaultClient();
  const sanitizedEmail = sanitizeEmailForPath(userEmail);
  const path = `${getSecretPath()}/${sanitizedEmail}`;
  console.log("Reading tokens from Vault:", path);
  const result = (await vault.read(path)) as {
    data: { data: TokenPair };
  };
  return result.data.data;
}

/**
 * List all user emails that have tokens stored in Vault
 * @returns Array of user email addresses
 */
export async function listTokens(): Promise<string[]> {
  const vault = getVaultClient();
  const path = getMetadataPath();
  console.log(`Listing tokens from Vault: ${path}`);
  const result = (await vault.list(path)) as {
    data: { keys?: string[] };
  };
  return result.data.keys || [];
}

/**
 * Delete tokens from Vault for a specific user
 * @param userEmail - User's email address (used as key)
 */
export async function deleteToken(userEmail: string): Promise<void> {
  const vault = getVaultClient();
  const sanitizedEmail = sanitizeEmailForPath(userEmail);
  const path = `${getSecretPath()}/${sanitizedEmail}`;
  console.log("Deleting tokens from Vault:", path);
  await vault.delete(path);
}

export type { TokenPair };

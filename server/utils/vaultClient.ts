import Vault from "node-vault";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Lazy-initialize Vault client to ensure env vars are loaded
let vaultClient: ReturnType<typeof Vault> | null = null;

function getVaultClient(): ReturnType<typeof Vault> {
  if (!vaultClient) {
    const endpoint = process.env.VAULT_ADDR || "http://localhost:8200";
    const token = process.env.VAULT_TOKEN || "";
    console.log(`Initializing Vault client: ${endpoint}`);
    vaultClient = Vault({ endpoint, token });
  }
  return vaultClient;
}

function getSecretPath(): string {
  // VAULT_SECRET_PATH should be like "secret/data/linguistnow/tokens"
  return process.env.VAULT_SECRET_PATH || "secret/data/linguistnow/tokens";
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
  const path = `${getSecretPath()}/${userEmail}`;
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
  const path = `${getSecretPath()}/${userEmail}`;
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

export type { TokenPair };

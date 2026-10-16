import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_SECONDS,
} from "./session.js";

describe("session utils", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-session-secret-key-1234567890";
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.SESSION_SECRET = originalSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
  });

  it("should create and verify a valid session token", () => {
    const email = "User.Name@Example.COM";
    const token = createSessionToken(email);

    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(2);

    const result = verifySessionToken(token);
    expect(result).not.toBeNull();
    expect(result?.email).toBe("user.name@example.com");
  });

  it("should reject token with invalid structure", () => {
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("no-dot-token")).toBeNull();
    expect(verifySessionToken("a.b.c")).toBeNull();
  });

  it("should reject token with tampered payload", () => {
    const token = createSessionToken("alice@example.com");
    const [, sig] = token.split(".");

    // Tamper with payload (substitute with bob)
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: "bob@example.com",
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      }),
    ).toString("base64url");

    const tamperedToken = `${tamperedPayload}.${sig}`;
    expect(verifySessionToken(tamperedToken)).toBeNull();
  });

  it("should reject token with tampered signature", () => {
    const token = createSessionToken("alice@example.com");
    const [payload, sig] = token.split(".");

    const tamperedSig = sig.slice(0, -2) + "xx";
    const tamperedToken = `${payload}.${tamperedSig}`;

    expect(verifySessionToken(tamperedToken)).toBeNull();
  });

  it("should reject expired token", () => {
    const nowMs = 1000000000;
    const token = createSessionToken("alice@example.com", nowMs);

    // Verify at issuance time: valid
    expect(verifySessionToken(token, nowMs)).toEqual({
      email: "alice@example.com",
    });

    // Verify after TTL: expired
    const afterExpiryMs = nowMs + (SESSION_TTL_SECONDS + 1) * 1000;
    expect(verifySessionToken(token, afterExpiryMs)).toBeNull();
  });

  it("should reject token if payload is malformed JSON or missing fields", () => {
    const badPayload = Buffer.from("not-json").toString("base64url");
    // Sign with createHmac or just verify rejection
    expect(verifySessionToken(`${badPayload}.fake-sig`)).toBeNull();

    const noSubPayload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1000 }),
    ).toString("base64url");
    expect(verifySessionToken(`${noSubPayload}.fake-sig`)).toBeNull();
  });
});

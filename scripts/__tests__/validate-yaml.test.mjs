import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateYamlContent, runValidation } from "../validate-yaml.mjs";

test("validateYamlContent - passes valid single-document YAML", () => {
  const yaml = `
version: "3.8"
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
`;
  const errors = validateYamlContent(yaml, "test.yml");
  assert.equal(errors.length, 0);
});

test("validateYamlContent - passes valid multi-document YAML", () => {
  const yaml = `
---
kind: Service
apiVersion: v1
---
kind: Deployment
apiVersion: apps/v1
`;
  const errors = validateYamlContent(yaml, "k8s.yml");
  assert.equal(errors.length, 0);
});

test("validateYamlContent - passes empty or whitespace content", () => {
  assert.equal(validateYamlContent("", "empty.yml").length, 0);
  assert.equal(validateYamlContent("   \n\n  ", "whitespace.yml").length, 0);
});

test("validateYamlContent - detects duplicate keys under strict mode", () => {
  const yaml = `
key: value1
key: value2
`;
  const errors = validateYamlContent(yaml, "duplicate.yml");
  assert.ok(errors.length > 0);
  assert.match(errors[0], /Map keys must be unique/i);
});

test("validateYamlContent - detects invalid block scalar indentation", () => {
  const yaml = `
services:
  app:
    command:
      - sh
      - -c
      - |
        line1
line2_with_zero_indent
`;
  const errors = validateYamlContent(yaml, "broken-indent.yml");
  assert.ok(errors.length > 0);
  assert.match(errors[0], /broken-indent\.yml:9:1/);
});

test("runValidation - returns 0 when valid files specified", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "yaml-test-"));
  try {
    const validFile = path.join(tmpDir, "valid.yml");
    fs.writeFileSync(validFile, "foo: bar\n");
    const exitCode = runValidation([validFile]);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("runValidation - returns 1 when syntax error encountered", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "yaml-test-"));
  try {
    const invalidFile = path.join(tmpDir, "invalid.yml");
    fs.writeFileSync(invalidFile, "foo: [unclosed list\n");
    const exitCode = runValidation([invalidFile]);
    assert.equal(exitCode, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("runValidation - ignores deleted or non-existent files passed by git", () => {
  const exitCode = runValidation(["non-existent-file.yml"]);
  assert.equal(exitCode, 0);
});

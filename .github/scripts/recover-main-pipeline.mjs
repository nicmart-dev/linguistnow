#!/usr/bin/env node

/**
 * Canary Recovery Script
 *
 * Triggered when a workflow on 'main' fails.
 * 1. Analyzes the failed workflow run (job name, failed steps, error logs).
 * 2. Opens an actionable incident issue (deduplicated by commit SHA).
 * 3. Attempts an automated git revert PR to restore 'main' to a green state,
 *    gated by our standard test suite.
 */

import { execFileSync } from "child_process";

const REPO = process.env.GITHUB_REPOSITORY;
const RUN_ID = process.env.FAILED_RUN_ID;
const WORKFLOW_NAME = process.env.FAILED_WORKFLOW_NAME || "Pipeline";
const COMMIT_SHA = process.env.FAILED_COMMIT_SHA;
const GH_TOKEN = process.env.GH_TOKEN;

if (!REPO || !RUN_ID || !COMMIT_SHA || !GH_TOKEN) {
  console.error(
    "Missing required environment variables: GITHUB_REPOSITORY, FAILED_RUN_ID, FAILED_COMMIT_SHA, GH_TOKEN",
  );
  process.exit(1);
}

const shortSha = COMMIT_SHA.slice(0, 7);

function runGh(args) {
  return execFileSync("gh", args, {
    env: { ...process.env, GH_TOKEN },
    encoding: "utf8",
  }).trim();
}

function runGit(args) {
  return execFileSync("git", args, {
    env: process.env,
    encoding: "utf8",
  }).trim();
}

async function main() {
  console.log(`Analyzing failure for run ${RUN_ID} on commit ${shortSha}...`);

  // 1. Fetch failed jobs from GitHub API
  let jobsData = [];
  try {
    const rawJobs = runGh([
      "api",
      `repos/${REPO}/actions/runs/${RUN_ID}/jobs`,
      "--paginate",
    ]);
    const parsed = JSON.parse(rawJobs);
    jobsData = parsed.jobs || [];
  } catch (err) {
    console.warn("Failed to fetch run jobs via gh api:", err.message);
  }

  const failedJobs = jobsData.filter((job) => job.conclusion === "failure");
  let failureSummary;

  if (failedJobs.length > 0) {
    failureSummary = "| Job | Failed Step | Log URL |\n|---|---|---|\n";
    for (const job of failedJobs) {
      const failedStep = (job.steps || []).find(
        (s) => s.conclusion === "failure",
      );
      const stepName = failedStep ? failedStep.name : "Unknown step";
      failureSummary += `| ${job.name} | ${stepName} | [View Log](${job.html_url}) |\n`;
    }
  } else {
    failureSummary = `Workflow failed with conclusion 'failure'. View run details: https://github.com/${REPO}/actions/runs/${RUN_ID}\n`;
  }

  // 2. Check for existing incident issue
  const searchPattern = `main pipeline regression on commit ${shortSha}`;
  let existingIssue = null;
  try {
    const issuesJson = runGh([
      "issue",
      "list",
      "--repo",
      REPO,
      "--search",
      searchPattern,
      "--json",
      "number,url",
    ]);
    const issues = JSON.parse(issuesJson);
    if (issues.length > 0) {
      existingIssue = issues[0];
    }
  } catch (err) {
    console.warn("Failed to search existing issues:", err.message);
  }

  const runUrl = `https://github.com/${REPO}/actions/runs/${RUN_ID}`;
  let issueUrl = "";

  if (existingIssue) {
    console.log(
      `Incident issue already exists: #${existingIssue.number} (${existingIssue.url})`,
    );
    issueUrl = existingIssue.url;
  } else {
    const issueTitle = `fix(ci): main pipeline regression on commit ${shortSha}`;
    const issueBody = `## 🚨 Main Pipeline Regression Alert

A post-merge pipeline failure occurred on branch \`main\` following commit [\`${shortSha}\`](https://github.com/${REPO}/commit/${COMMIT_SHA}).

- **Failed Workflow:** ${WORKFLOW_NAME} ([View Run](${runUrl}))
- **Failing Commit:** [\`${COMMIT_SHA}\`](https://github.com/${REPO}/commit/${COMMIT_SHA})

### Failure Diagnostics
${failureSummary}

---
*Generated automatically by \`.github/workflows/canary-recovery.yml\`.*`;

    try {
      issueUrl = runGh([
        "issue",
        "create",
        "--repo",
        REPO,
        "--title",
        issueTitle,
        "--body",
        issueBody,
      ]);
      console.log(`Created incident issue: ${issueUrl}`);
    } catch (err) {
      console.error("Failed to create incident issue:", err.message);
    }
  }

  // 3. Attempt automated revert
  const revertBranch = `revert-${shortSha}-recovery`;
  console.log(`Attempting automated revert of commit ${shortSha}...`);

  try {
    // Configure git user
    runGit(["config", "user.name", "github-actions[bot]"]);
    runGit([
      "config",
      "user.email",
      "github-actions[bot]@users.noreply.github.com",
    ]);

    // Check out a new branch from origin/main
    runGit(["checkout", "-B", revertBranch, "origin/main"]);

    // Attempt git revert
    runGit(["revert", "--no-commit", COMMIT_SHA]);
    runGit([
      "commit",
      "-m",
      `revert(ci): revert ${shortSha} due to main regression\n\nTriggered by failure in run ${runUrl}.\nReferences ${issueUrl || "incident"}.`,
    ]);

    // Push branch to origin using ephemeral authenticated URL
    const authRemote = `https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git`;
    runGit([
      "push",
      "-u",
      authRemote,
      `${revertBranch}:${revertBranch}`,
      "--force",
    ]);
    console.log(`Pushed revert branch: ${revertBranch}`);

    // Create PR
    const prTitle = `revert(ci): revert ${shortSha} due to main regression`;
    const prBody = `## Summary

Automated canary recovery: reverts [\`${shortSha}\`](https://github.com/${REPO}/commit/${COMMIT_SHA}) due to pipeline failure in ${WORKFLOW_NAME} ([Run #${RUN_ID}](${runUrl})).

${issueUrl ? `Fixes ${issueUrl}` : ""}

### Gating
This revert PR will run through all standard quality gates (matrix CI, Playwright Tier A E2E, Docker build, and container smoke test) before merging to restore \`main\` safely.`;

    const prUrl = runGh([
      "pr",
      "create",
      "--repo",
      REPO,
      "--head",
      revertBranch,
      "--base",
      "main",
      "--title",
      prTitle,
      "--body",
      prBody,
    ]);
    console.log(`Created revert PR: ${prUrl}`);

    // Enable auto-merge on the PR
    try {
      runGh(["pr", "merge", prUrl, "--auto", "--squash"]);
      console.log(`Enabled auto-merge on ${prUrl}`);
    } catch (autoMergeErr) {
      console.warn(
        "Could not enable auto-merge on revert PR:",
        autoMergeErr.message,
      );
    }
  } catch (revertErr) {
    console.error(
      "Automated revert failed or encountered conflicts:",
      revertErr.message,
    );
    if (issueUrl) {
      try {
        const commentBody = `⚠️ Automated revert of commit [\`${shortSha}\`](https://github.com/${REPO}/commit/${COMMIT_SHA}) could not be applied automatically due to merge conflicts or git error:\n\`\`\`\n${revertErr.message}\n\`\`\`\nManual triage is required.`;
        runGh(["issue", "comment", issueUrl, "--body", commentBody]);
      } catch (commentErr) {
        console.warn(
          "Failed to add comment to incident issue:",
          commentErr.message,
        );
      }
    }
  }
}

main().catch((err) => {
  console.error("Fatal recovery script error:", err);
  process.exit(1);
});

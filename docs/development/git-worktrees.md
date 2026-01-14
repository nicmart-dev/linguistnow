# Git Worktrees Guide

Git worktrees allow you to work on multiple branches simultaneously in separate directories. This is useful for:

- Working on multiple features in parallel
- Reviewing PRs while keeping your current work intact
- Running tests on one branch while developing on another
- Using multiple Cursor chats on different features

## Quick Start

### Create a Worktree for a Feature Branch

```bash
# From the main repo directory
cd ~/github-repos/linguistnow

# Create a worktree for an existing branch
git worktree add ../linguistnow-feature feature/my-feature

# Or create a worktree with a new branch
git worktree add -b feature/new-feature ../linguistnow-new-feature main
```

### Recommended Directory Structure

```
github-repos/
├── linguistnow/                 # Main repo (keep on main branch)
├── linguistnow-fx-rate/         # Worktree for FX rate feature
├── linguistnow-other-feature/   # Worktree for another feature
└── linguistnow-workspaces.code-workspace  # Multi-root workspace file
```

## Managing Worktrees

### List All Worktrees

```bash
git worktree list
```

Example output:

```
C:/Users/you/github-repos/linguistnow          abc1234 [main]
C:/Users/you/github-repos/linguistnow-fx-rate  def5678 [feature/fx-rate-conversion]
```

### Remove a Worktree

```bash
# When done with a feature (after merging)
git worktree remove ../linguistnow-feature

# Force remove if there are uncommitted changes
git worktree remove --force ../linguistnow-feature

# Clean up stale worktree references
git worktree prune
```

### Move a Worktree

```bash
git worktree move ../linguistnow-old-name ../linguistnow-new-name
```

## Using with Cursor (Multi-Root Workspace)

You can manage multiple worktrees from a single Cursor instance using a multi-root workspace.

### Create a Workspace File

Create `linguistnow-workspaces.code-workspace` in the parent directory:

```json
{
  "folders": [
    {
      "name": "linguistnow (main)",
      "path": "linguistnow"
    },
    {
      "name": "linguistnow-fx-rate",
      "path": "linguistnow-fx-rate"
    }
  ],
  "settings": {}
}
```

### Open the Workspace

1. **File → Open Workspace from File...**
2. Select the `.code-workspace` file
3. Both folders appear in the Explorer sidebar

### Working in Multi-Root Workspace

| Feature        | How it Works                                    |
| -------------- | ----------------------------------------------- |
| Explorer       | Shows all worktrees as separate root folders    |
| Source Control | Shows changes per worktree                      |
| Terminal       | Opens in the selected folder's context          |
| Search         | Can search across all worktrees or scope to one |
| Cursor Chat    | Use `@folder-name` to scope questions           |

## Best Practices

### 1. Keep Main Repo on `main` Branch

```bash
# Always return main repo to main branch
cd ~/github-repos/linguistnow
git checkout main
```

This makes it easy to:

- Create new feature worktrees from main
- Pull latest changes
- Handle quick hotfixes

### 2. Name Worktrees Descriptively

```bash
# Good - clear what the worktree is for
git worktree add ../linguistnow-fx-rate feature/fx-rate-conversion
git worktree add ../linguistnow-pr-review-123 pr/123

# Avoid - unclear purpose
git worktree add ../linguistnow-2 feature/something
```

### 3. Clean Up After Merging

```bash
# After PR is merged
git worktree remove ../linguistnow-fx-rate
git branch -d feature/fx-rate-conversion  # Delete local branch
git fetch --prune  # Clean up remote tracking branches
```

### 4. Share Node Modules (Optional)

Each worktree has its own `node_modules`. To save disk space, you can use symlinks or pnpm's content-addressable storage:

```bash
# pnpm already deduplicates across projects
# Just run pnpm install in each worktree
cd ../linguistnow-fx-rate
pnpm install
```

## Common Workflows

### Workflow 1: Parallel Feature Development

```bash
# Start feature A in a worktree
git worktree add -b feature/feature-a ../linguistnow-feature-a main

# Start feature B in another worktree
git worktree add -b feature/feature-b ../linguistnow-feature-b main

# Work on both in separate Cursor windows or multi-root workspace
```

### Workflow 2: PR Review Without Losing Context

```bash
# Currently working on feature-x, need to review PR #123
git worktree add ../linguistnow-pr-123 origin/feature/pr-123-branch

# Review in separate directory, your feature-x work is untouched
# After review:
git worktree remove ../linguistnow-pr-123
```

### Workflow 3: Hotfix While Working on Feature

```bash
# Working on feature, urgent bug reported
git worktree add -b hotfix/urgent-bug ../linguistnow-hotfix main

# Fix bug, push, merge
cd ../linguistnow-hotfix
# ... make fix ...
git push -u origin hotfix/urgent-bug

# Clean up
git worktree remove ../linguistnow-hotfix
```

## Troubleshooting

### "Branch is already checked out"

```bash
# Error: 'feature/x' is already used by worktree at '/path/to/other'

# Solution: The branch is checked out elsewhere
# Either switch the other worktree to a different branch, or use a different branch
git worktree list  # Find which worktree has it
```

### Worktree Shows as Prunable

```bash
# If a worktree directory was deleted manually
git worktree prune
```

### Can't Delete Branch Used by Worktree

```bash
# First remove the worktree
git worktree remove ../linguistnow-feature

# Then delete the branch
git branch -d feature/my-feature
```

## Integration with CI/CD

Worktrees are local only - they don't affect CI/CD. Each worktree:

- Shares the same `.git` directory (efficient storage)
- Has its own working directory
- Can have different uncommitted changes
- Pushes to the same remote

## References

- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [VS Code Multi-Root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces)

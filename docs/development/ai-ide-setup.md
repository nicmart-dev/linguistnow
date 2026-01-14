# AI IDE Setup Guide

This project supports multiple AI-powered development environments. You can use **Cursor** or **VS Code with Gemini Code Assist** (or both!) depending on your preference and available tokens/credits.

## Supported Tools

| Tool                         | AI Provider                              | Configuration          |
| ---------------------------- | ---------------------------------------- | ---------------------- |
| Cursor                       | Claude, GPT-4, etc.                      | `.cursorrules`         |
| Gemini Code Assist (VS Code) | Google Gemini (with AI Pro subscription) | Google account sign-in |

## Quick Start

### Option 1: Cursor

1. Open the project in Cursor
2. The `.cursorrules` file automatically provides project context
3. Start coding with AI assistance

### Option 2: VS Code + Gemini Code Assist (Recommended for Google AI Pro)

If you have a **Google One AI Premium** or **Gemini Advanced** subscription, you can use the official Gemini Code Assist extension:

1. Install [Gemini Code Assist](https://marketplace.visualstudio.com/items?itemName=Google.geminicodeassist) extension in VS Code
2. Sign in with your Google account (the one with AI Pro subscription)
3. Open this project in VS Code
4. Start coding with Gemini assistance

#### Features with AI Pro Subscription

- Access to **Gemini 3 Pro (Preview)** (latest model)
- Unlimited code completions
- Chat assistance in sidebar
- Code explanations and refactoring
- No API key required - uses your Google account

## Configuration Files

### `.cursorrules`

Project rules and context for Cursor. Tells the AI about:

- Tech stack (React, Express, TypeScript, etc.)
- Code organization and patterns
- Testing requirements (TDD, coverage thresholds)
- i18n requirements (all 11 locales)
- Security best practices
- Commit conventions

### Gemini Code Assist Context

Gemini Code Assist automatically reads your codebase for context. For best results:

1. Keep your code well-organized following the project structure
2. Use descriptive comments and function names
3. Reference specific files when asking questions

## Model Recommendations

### For Cursor

- **Claude Sonnet 4**: Best for complex reasoning and code
- **GPT-4o**: Good general-purpose coding

### For Gemini Code Assist

- **Gemini 3 Pro (Preview)**: Latest and most capable model (available with AI Pro subscription)
- Automatic model selection based on task

## Switching Between Tools

You can freely switch between Cursor and VS Code + Gemini Code Assist:

1. Both tools respect `.gitignore` and project structure
2. Cursor uses `.cursorrules` for project context
3. Gemini Code Assist reads your codebase directly
4. Changes made in one tool are immediately available in the other (it's the same codebase!)

## Troubleshooting

### Gemini Code Assist not working

1. Ensure you're signed in with the correct Google account
2. Verify your Google One AI Premium / Gemini Advanced subscription is active
3. Check that the extension is enabled in VS Code
4. Try reloading VS Code window (Ctrl/Cmd + Shift + P → "Developer: Reload Window")

### Cursor not loading project rules

1. Ensure `.cursorrules` is in the project root
2. Restart Cursor or reload the window

## Best Practices

1. **Use the right tool for the task**: Cursor for complex refactoring, Gemini for quick edits
2. **Provide context**: Reference specific files and patterns when asking for help
3. **Review generated code**: Always review AI-generated code before committing
4. **Leverage your subscription**: With AI Pro, you have access to the latest Gemini models - use them!

## Alternative: Continue Extension

If you prefer more configuration control or want to use API keys instead of a subscription, you can also use the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue) with Google Gemini API. See the [Continue documentation](https://docs.continue.dev/) for setup instructions.

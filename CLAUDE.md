# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Infinite Wiki app - a React-based web application that uses AI to generate interactive encyclopedia-style content. It creates associative content cards and ASCII art visualizations for topics, allowing users to explore concepts through clickable hyperlinks.

## Architecture

The app uses a streaming architecture where:
- Frontend requests content for a topic via the Gemini/OpenRouter API
- Content is streamed in real-time as chunks (titles and content) 
- ASCII art is generated concurrently with content cards
- React state management handles the streaming updates and user interactions

Key architectural patterns:
- Stream processing with buffering for partial content chunks
- Concurrent API calls for ASCII art and content generation
- Topic history tracking for contextual navigation
- Error boundaries with fallback ASCII art generation

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Create a `.env.local` file with:
```
OPENROUTER_API_KEY=your_api_key_here
```

The app currently uses OpenRouter API with Google Gemini models. The API key is injected via Vite's environment variable system and accessed through `process.env.OPENROUTER_API_KEY`.

## Service Configuration

The main AI service (`services/openRouterService.ts`) has configurable flags:
- `ENABLE_THINKING_FOR_ASCII_ART`: Toggle for slower/higher-quality ASCII art
- `ENABLE_ASCII_TEXT_GENERATION`: Toggle for blocky ASCII text alongside art
- Model names are configurable: `artModelName` and `textModelName`

## Key Components

- **App.tsx**: Main component managing topic history, streaming state, and user interactions
- **services/openRouterService.ts**: Handles all AI API interactions including streaming content and ASCII art generation
- **components/Card.tsx**: Renders individual content cards with clickable hyperlinks
- **components/SearchBar.tsx**: User input for searching topics or getting random suggestions

## Content Generation Flow

1. User searches or clicks a topic
2. App triggers parallel requests for ASCII art and content cards
3. Content streams in chunks, parsed for TITLE/content/separator patterns
4. Cards update in real-time as chunks arrive
5. Clickable words in cards maintain topic context for related explorations

## Notes

- The app expects markdown-formatted content from the AI
- ASCII art generation includes retry logic with fallback to simple box art
- Performance metrics (generation time) are tracked and displayed
- Current branch tracking shows uncommitted changes to the service layer
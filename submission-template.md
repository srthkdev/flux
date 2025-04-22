---
name: Hackathon Project Submission
about: Submit your project for the Global Agent Hackathon
title: "[Project Submission] Flux: Superintelligent Form Builder with Agents and Memory"
labels: submission
assignees: ''
---

# Project Title

**Flux: Superintelligent Form Builder with Agents and Memory**

## Overview of the Idea

Flux is a next-gen form platform powered by intelligent agents, multi-step tool use, and memory. Users can describe what they want — and Flux builds the form, wires the logic, and connects responses to insights or external APIs. It doesn’t just store responses — it understands them. We’ve integrated Agno, Mem0, and Firecrawl to power this intelligence layer.

## Project Goal

Showcase how agentic reasoning, persistent memory, and multi-step tool use through user-defined APIs can transform basic forms into smart interfaces — capable of adapting, understanding, and triggering actions automatically.

## How It Works

1. User signs in with Clerk
2. Clicks “New Form” and enters a goal like: *“Create a product feedback form with sentiment tagging and Slack alerts for angry customers”*
3. Agno interprets and creates the form schema + validations
4. Mem0 stores context and builds on it — agents learn from form evolution and past edits
5. Cmd+K menu and `/commands` let you control structure and behavior
6. Cmd+/ opens form-aware agent chat for editing, analysis, or help
7. On submission, agents analyze, flag trends, summarize, and trigger tools (Slack, Notion, Airtable, Gmail, etc.)
8. Firecrawl scrapes external links (e.g., portfolios) and returns structured signals to enrich response understanding
9. Users can configure custom APIs, select tools, and define multi-step workflows — including when and how to trigger, what message or data to pass, and conditional logic for execution.

## Tools Used

- **Agno** – Agentic orchestration layer
- **Mem0** – Memory for schema, sessions, user history
- **Firecrawl** – Scraping external URLs from form fields
- **Gemini API** – Core LLM
- **Next.js 14** – Fullstack app
- **Tailwind CSS + Shadcn UI** – UI system
- **Bun** – Runtime
- **Zustand** – State management
- **TanStack Query/Table** – Data syncing & display
- **React Hook Form + Zod** – Validation
- **NeonDB + Prisma** – DB layer
- **Clerk** – Auth

## Use Cases

### 1. **Product Feedback Forms**
- Auto-tag responses by sentiment
- Alert product managers if negative trends spike
- Summarize most-requested features
- Trigger a Slack alert + create Notion task for high-priority feedback

### 2. **Hiring Forms**
- Auto-evaluate GitHub, portfolio links (via Firecrawl)
- Highlight candidates with deployed projects
- Score technical alignment with job description
- If score > 80%, auto-send Gmail invitation + add to Airtable pipeline

### 3. **Event Registration**
- Suggest event improvements based on past feedback
- Group attendees by interest/themes
- Predict attendance drops based on signup behavior
- Multi-step: First analyze comments with LLM, then notify team via Slack and update Google Sheet

### 4. **Course/Workshop Applications**
- Flag duplicate or fake entries
- Suggest scholarship candidates based on goals
- Summarize applicant backgrounds for instructors
- Trigger onboarding email + send data to internal CRM

## API and Tool Customization

- Users can configure any API endpoint to be called on submission
- Prompt the agent: *"If response mentions 'urgent bug', send Slack alert and create GitHub issue with summary"*
- Tool selection UI: Choose from Gmail, Slack, Notion, Google Sheets, Airtable, or your own custom tools
- Support for multi-step tool use: 
  - Step 1: Search company name on Google
  - Step 2: If result contains a job page → Send Slack alert
  - Step 3: Email candidate if matched
- Memory ensures past configurations, prompt styles, and tool usage patterns are retained for future automation
- Reasoning enables the agent to dynamically determine which tools to invoke based on context

## UI Approach

- Clean layout with sidebar
- Cmd+K floating menu
- Cmd+/ opens agent chat
- Table view with filters, AI summaries, scraped info
- Fully responsive

## Visuals

- Builder UI
- Cmd+K interaction
- Agent chat
- Submission dashboard
- Architecture (Agno + Mem0 + Firecrawl)

## Team Info

- **Team Lead**: `@srthkdev`
- **Team Members**: Solo

## Prize Category

- [x] Best use of Agno
- [x] Best use of Mem0
- [x] Best Overall Project

## Demo Video Link

*To be added before deadline*

## Final Notes

Forms today are dumb. Flux upgrades them. It remembers, it reasons, it acts. With agents, memory, scraping, reasoning, multi-step tool use, and user-defined APIs, Flux becomes a programmable assistant on top of form workflows. Whether you're triggering Slack alerts, scraping links, or chaining tools like Gmail → Notion → Sheets, Flux gives you the control and intelligence traditional tools lack.

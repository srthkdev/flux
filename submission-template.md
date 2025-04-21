---

name: Hackathon Project Submission
about: Submit your project for the Global Agent Hackathon
title: "[Project Submission] Flux: AI-Native Form Builder with Agentic Intelligence"
labels: submission
assignees: ''

---

# Project Title

**Flux: AI-Native Form Builder with Agentic Intelligence**

## Overview of the Idea

Flux is an intelligent form creation and response analysis tool that allows users to build forms using natural language prompts, manage them through contextual commands, and receive AI-powered summaries of submissions. The platform integrates deeply with agentic reasoning systems to eliminate manual UI friction and deliver a fluid, guided experience powered by large language models.

## Project Goal

To showcase how composable, intelligent agents can transform user interaction by reasoning across UI intent, form schema logic, and backend responses — all using natural language and memory-backed workflows.

## How It Works

- **User Flow**:

  1. User logs in securely with Clerk
  2. On the dashboard, they click “New Form”
  3. They describe their goal (e.g. “Create a job application form with file upload and conditional email field”)
  4. Agno orchestrates a multi-step reasoning process that:
     - Understands the user's prompt
     - Plans which fields are needed
     - Generates a full schema with validations
     - Updates the UI state in real-time
  5. Users refine forms via a slash-command menu or Cmd+K window
  6. Cmd+/ opens an AI chat with full form context for debugging, validation, or transformation
  7. All submissions flow into a tabular view with filters, AI summarization, and trends

- **Core Functionality**:

  - Prompt-to-form generation using LLMs
  - AI field recommendations and validation generation
  - Real-time schema updates via command UI
  - Multi-turn agent chat grounded in form memory (via Mem0)
  - Response analysis with summaries and auto-tagging

- **Multimodal Elements**:

  - Inputs: Natural language prompt, typed commands
  - Outputs: Visual forms, AI summaries, tables, insights

## Tools Used

- **Agno** – Agent framework to manage prompt workflows, invoke tasks, and chain reasoning
- **Agno Reasoning Engine** – Enables step-by-step breakdown of user intent and form logic into executable code transformations
- **Gemini API** – Used as the underlying LLM
- **Mem0** – Stores context and historical memory of each form
- **Next.js 14 + App Router** – App frontend and backend routing
- **Tailwind CSS + Shadcn UI** – Design system and component framework
- **Bun** – Runtime and fast package manager
- **Zustand** – Local schema state management
- **TanStack Query** – Form fetch + sync
- **TanStack Table** – Submission visualization
- **React Hook Form + Zod** – Form control and validation
- **NeonDB + Prisma** – Backend DB layer
- **Clerk** – Authentication system

## UI Approach

- Clean, minimal layout using sidebar navigation
- Floating command menus with animated transitions
- Form canvas supports contextual commands and inline suggestions
- Summary dashboards with AI-generated highlights
- Responsive design optimized for web and tablet

## Visuals

- Full layout screenshots:
  - Hero and form creation prompt
  - Form builder with command mode
  - Agent chat panel
  - Submission dashboard with smart summaries
- Architecture diagram (agent flow, memory, LLM)
- (Optional) Figma prototype

## Team Information

- **Team Lead**: `@srthkdev` – Developer, Fullstack Engineer, 
- **Team Members**: Solo
- **Background/Experience**: Fullstack and AI workflow developer with experience in building productivity-first LLM tools.

## Prize Category (leave blank, to be assigned by judges)
- [ ] Best use of Agno
- [ ] Best use of Firecrawl
- [ ] Best use of Mem0
- [ ] Best use of Graphlit
- [ ] Best use of Browser Use
- [ ] Best Overall Project


## Demo Video Link

*Link to be added before deadline*

## Additional Notes

- Agno agents are used to interpret vague user requests into precise form schemas
- Reasoning engine dynamically transforms user intent into chain-of-action workflows
- All interactions are enriched with memory (via Mem0), ensuring agents can recall and improve forms over time
- Designed to demonstrate the real-world potential of agent-first productivity apps


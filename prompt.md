## 🔧 Project Name
**FormPilot** – AI-first form builder like Tally.so + Cursor + ChatGPT, built for Global Agent Hackathon.

---

## 🧠 Feature Overview (Cursor-style prompts)

### 1. “Generate a smart form from this prompt”
**Prompt:** "Create a feedback form for a design workshop."
- Uses Gemini + Agno agent chain
- Extracts fields, types, required fields, structure
- Generates schema
- Adds to state (Zustand)

### 2. “Use / to insert fields like Tally.so”
**Prompt:** "/short text" or "/file upload"
- Adds field to form
- Auto-focuses on label input
- Shadcn command menu

### 3. “Cmd+K to open AI prompt window”
- Prompt: "Add skip logic if user selects 'No' to attending"
- Mini modal overlay to send single-shot prompts to agent

### 4. “Cmd+/ full chat for this form”
- Gemini-powered chat window
- Remembers current form state with Mem0
- Can execute changes ("Add email field", "Summarize questions")

### 5. “View form submissions in a smart table”
- Uses TanStack Table
- Smart filters ("show all responses that rated < 3")
- Summary row by Mem0: avg rating, common keywords

### 6. “AI dashboard insights”
- Gemini + Mem0 context chain
- Summary cards like: "Avg satisfaction: 4.2", "Most common feedback: UI layout"
- Toggle AI view in summary tab (like in image)
- AI-generated charting (optional)

### 7. “Deploy form + share”
- Generates public page: `/f/[slug]`
- Response stored in NeonDB

---

## 🧰 Tech Stack per Feature

| Feature | Tech |
|--------|------|
| Agent chains | Agno + Gemini |
| LLM | Gemini via Vertex / API |
| State | Zustand |
| Command menu | Shadcn UI command palette + sidebar-10 layout |
| Auth | Clerk |
| DB | NeonDB + Prisma |
| Form logic | React Hook Form + Zod |
| Submissions | TanStack Table |
| Chat memory | Mem0 API |

---

## 📁 Full File Structure (Simplified)

```
/src
  /app
    /dashboard            # Sidebar layout using sidebar-10
    /f/[slug]             # Public form render
    /api
      /agents             # agno routes for Gemini prompts
      /forms              # CRUD form structure
  /components
    FormBuilder.tsx
    ChatWindow.tsx
    CmdKPrompt.tsx
    AIInsights.tsx        # Dashboard AI cards
    AIToggle.tsx          # Toggle in dashboard summary
  /lib
    mem0.ts
    agno.ts
    gemini.ts
  /hooks
    useFormState.ts
  /store
    form.ts
  /utils
    schemaHelpers.ts
/prisma
  schema.prisma
```

---

## ▶️ Commands to Start
```bash
bunx create-next-app formpilot --ts --app --src-dir
cd formpilot
bun install
npx shadcn@latest init
npx shadcn@latest add sidebar-10
npx shadcn@latest add command-dialog table dialog button card
```

---

## 🚀 Deployment

### Frontend
- Vercel (easy Next.js + Clerk integration)

### Backend
- Hosted in same Next.js API routes (Vercel Serverless)
- Or deploy agents/mem0 wrapper to Railway

### Gemini
- Use Google Vertex AI or hosted proxy endpoint

### Mem0
- Use hosted memory store (API key)

---

Element | Color
Background | #ffffff (white)
Sidebar bg | #f9f9f9 or #f8f8f8
Text | #111111
Muted Text | #666666
Accent / Primary | #1d4ed8 (Tailwind blue-700)
Hover Primary Btn | #1e40af (Tailwind blue-800)
Border | #e5e7eb

BUILD THE FORM BUILDER END TO END 
DO NOT BUILD AGNO, mem0 etc AI features
BUILD FRONTEND AND FORM BUILDER, DASHBOARD etc. fully
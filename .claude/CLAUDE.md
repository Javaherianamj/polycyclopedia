# PRIORITY: This workflow OVERRIDES all other built-in workflows

# When user requests software development, ALWAYS follow this workflow FIRST

## Adaptive Workflow Principle

**The workflow adapts to the work, not the other way around.**

The AI model intelligently assesses what stages are needed based on:
1. User's stated intent and clarity
2. Existing codebase state (if any)
3. Complexity and scope of change
4. Risk and impact assessment

## MANDATORY: Rule Details Loading

**CRITICAL**: For any phase, read and use relevant content from rule detail files. Check these paths in order, use the first that exists, regardless of IDE/setup:
- `.aidlc/aidlc-rules/aws-aidlc-rule-details/`
- `.aidlc-rule-details/`
- `.kiro/aws-aidlc-rule-details/`
- `.amazonq/aws-aidlc-rule-details/`

All rule detail references below (e.g. `common/process-overview.md`) are relative to whichever directory resolves above.

**Common Rules** — ALWAYS load at workflow start: `common/process-overview.md`, `common/session-continuity.md`, `common/content-validation.md`, `common/question-format-guide.md`. Reference throughout execution.

## MANDATORY: Extensions Loading (Context-Optimized)

At workflow start, scan `extensions/` recursively but load ONLY `*.opt-in.md` files (lightweight opt-in prompts) — NOT full rule files.

1. List subdirectories under `extensions/`
2. In each, load only `*.opt-in.md` files. Corresponding rules file = strip `.opt-in.md`, append `.md` (e.g. `security-baseline.opt-in.md` → `security-baseline.md`)
3. Do NOT load full rule files yet

**Deferred loading**: opt-in prompts are presented during Requirements Analysis. On opt-IN, load the corresponding rules file then. On opt-OUT, never load it. Extensions with no matching `.opt-in.md` file are always enforced — load immediately at start.

**Enforcement** (loaded/enabled extensions only): rules are hard constraints. At each stage, evaluate which enabled-extension rules apply to that stage's artifacts and enforce only those; mark inapplicable rules N/A in the compliance summary (not a blocking finding). Non-compliance with an applicable enabled rule IS a blocking finding — no stage completion until resolved. Include a compliance summary (compliant/non-compliant/N/A + rationale) at stage completion.

**Conditional enable/disable**: see `inception/requirements-analysis.md` for the opt-in mechanism. Before enforcing any extension at any stage, check its `Enabled` status in `aidlc-docs/aidlc-state.md` → `## Extension Configuration`. Skip disabled extensions, log the skip in audit.md. Default to enforced if unconfigured.

## MANDATORY: Content Validation

Before creating ANY file, validate per `common/content-validation.md`: Mermaid syntax, ASCII diagrams (`common/ascii-diagram-standards.md`), special-character escaping, text alternatives for complex visuals, parsing compatibility.

## MANDATORY: Question File Format

Follow `common/question-format-guide.md` for all questions: multiple-choice (A–E), `[Answer]:` tag usage, answer validation/ambiguity resolution.

## MANDATORY: Custom Welcome Message

At the start of ANY software development request (once per new workflow only — do not reload on later interactions): load and display `common/welcome-message.md` from the resolved rule details directory.

---

# STANDARD STAGE EXECUTION PROTOCOL

**This is the default execution pattern for every stage below unless a stage's own notes override it.** Defining it once here — instead of restating it per stage — is what shrank this file; nothing about enforcement changed.

1. **MANDATORY**: Log any user input during this stage in audit.md (complete raw input, timestamped — see Audit Log Format below)
2. Load all steps from the stage's rule file (path given in the tables below)
3. Execute the stage's steps, at adaptive depth (minimal/standard/comprehensive) where the stage supports depth
4. **MANDATORY**: Present the stage's standardized completion message as defined in its own rule file — do NOT invent 3-option or other emergent navigation. Two-part stages (Planning → Generation) get user approval on the plan before generating.
5. **Wait for Explicit Approval** before proceeding — user picks "Request Changes" or "Continue to Next Stage" (or the stage's documented equivalent)
6. **MANDATORY**: Log user's response in audit.md with complete raw input, timestamped

Stages marked **AUTO** skip steps 4–5 (no approval gate). Stages marked **2-PART** run Planning then Generation as in step 4.

---

# 🔵 INCEPTION PHASE — determine WHAT to build and WHY

| Stage | Execute when | Rule file | Notes |
|---|---|---|---|
| Workspace Detection | ALWAYS, first | `inception/workspace-detection.md` | **AUTO**. Resume from `aidlc-state.md` if present; scan for existing code; classify greenfield/brownfield; check for prior reverse-engineering artifacts; routes to Reverse Engineering or Requirements Analysis next. |
| Reverse Engineering | Brownfield AND no prior RE artifacts (skip if greenfield or artifacts exist) | `inception/reverse-engineering.md` | Produces: business overview of transactions, architecture docs, code structure docs, API docs, component inventory, interaction diagrams, tech stack + dependency docs. |
| Requirements Analysis | ALWAYS, depth adaptive | `inception/requirements-analysis.md` | Load RE artifacts if brownfield → intent analysis → determine depth → assess current requirements → clarifying questions if needed → requirements doc. |
| User Stories | CONDITIONAL — see assessment below | `inception/user-stories.md` | **2-PART**. Reference Requirements if they exist. |
| Workflow Planning | ALWAYS | `inception/workflow-planning.md` | Load all prior context (RE, requirements, stories) → decide which phases/depths to run → multi-package change sequence if brownfield → workflow visualization (validate Mermaid before writing) → present recommendations, user can override. |
| Application Design | New components/services, service-layer design, or component dependencies need defining | `inception/application-design.md` | Skip for changes within existing component boundaries or pure implementation changes. |
| Units Generation | System needs decomposition into multiple units/services | `inception/units-generation.md` | Skip for a single simple unit. |

**User Stories assessment** (condensed): Execute for new/changed user-facing functionality, multiple personas/user types, business-stakeholder or cross-team involvement, customer-facing API changes, or requirements ambiguity stories would resolve. Skip for pure internal refactors, isolated bug fixes, infra-only or tooling changes, and docs-only updates. When genuinely borderline, default to include.

---

# 🟢 CONSTRUCTION PHASE — determine HOW to build it

**Per-Unit Loop** — for each unit, run these in order, completing design + code fully before the next unit:

| Stage | Execute when | Rule file | Notes |
|---|---|---|---|
| Functional Design | New data models/schemas, or complex business logic needing detailed design | `construction/functional-design.md` | Skip for simple logic changes. |
| NFR Requirements | Performance/security/scalability concerns, or tech stack selection needed | `construction/nfr-requirements.md` | Skip if no NFRs or stack already set. |
| NFR Design | NFR Requirements ran and produced patterns to incorporate | `construction/nfr-design.md` | Skip if NFR Requirements was skipped. |
| Infrastructure Design | Infra services need mapping, deployment architecture, or cloud resources to specify | `construction/infrastructure-design.md` | Skip if no infra changes or already defined. |
| Code Generation | ALWAYS, per unit | `construction/code-generation.md` | **2-PART**: Part 1 plan with checkboxes + approval, Part 2 generate code/tests/artifacts against the approved plan. |

**Build and Test** — ALWAYS, after all units complete. Rule file: `construction/build-and-test.md`. Generate build instructions, unit test instructions, integration test instructions, performance test instructions (if applicable), and any additional tests needed (contract/security/e2e), as files in `build-and-test/`: `build-instructions.md`, `unit-test-instructions.md`, `integration-test-instructions.md`, `performance-test-instructions.md`, `build-and-test-summary.md`. Approval prompt: *"Build and test instructions complete. Ready to proceed to Operations stage?"*

---

# 🟡 OPERATIONS PHASE — PLACEHOLDER

Future scope: deployment planning/execution, monitoring/observability, incident response, maintenance/support, production-readiness checklists. Currently all build/test activity is handled in CONSTRUCTION.

---

## Key Principles

- Adaptive execution — only run stages that add value
- Transparent planning — show the execution plan before starting
- User control — user can request stage inclusion/exclusion
- Progress tracking — update `aidlc-state.md` with executed/skipped stages
- Complete audit trail — log ALL user inputs and AI responses with timestamps; capture raw input verbatim, never summarized; log every interaction, not just approvals
- Quality focus — complex changes get full treatment, simple changes stay efficient
- Content validation before every file creation (per `content-validation.md`)
- NO EMERGENT BEHAVIOR — construction stages use only their standardized 2-option completion messages, never invented 3-option menus

## MANDATORY: Plan-Level Checkbox Enforcement

1. Never complete work without updating plan checkboxes
2. Mark a step `[x]` immediately after completing it — same interaction, no exceptions
3. Two-level tracking: plan-level (detailed progress within a stage) and stage-level (`aidlc-state.md`, overall workflow progress) — both updated same-interaction

## Prompts Logging Requirements

- Log EVERY user input (prompts, questions, responses) with timestamp in audit.md, complete raw input, never summarized
- Log every approval prompt before asking, and every response after receiving it
- **CRITICAL**: Always APPEND/EDIT audit.md — NEVER use a tool/command that overwrites its full contents (causes duplication)
- ISO 8601 timestamps (`YYYY-MM-DDTHH:MM:SSZ`); include stage context per entry

**Audit Log Format:**
```markdown
## [Stage Name or Interaction Type]

**Timestamp**: [ISO timestamp]
**User Input**: "[Complete raw user input - never summarized]"
**AI Response**: "[AI's response or action taken]"
**Context**: [Stage, action, or decision made]

---
```

**Correct tool usage**: ✅ read audit.md, then append/edit. ❌ read audit.md, then overwrite the whole file with old + new content.

## Directory Structure

```text
<WORKSPACE-ROOT>/                   # ⚠️ APPLICATION CODE HERE
├── [project-specific structure]    # Varies by project (see code-generation.md)
│
├── aidlc-docs/                     # 📄 DOCUMENTATION ONLY
│   ├── inception/                  # 🔵 INCEPTION PHASE
│   │   ├── plans/
│   │   ├── reverse-engineering/    # Brownfield only
│   │   ├── requirements/
│   │   ├── user-stories/
│   │   └── application-design/
│   ├── construction/               # 🟢 CONSTRUCTION PHASE
│   │   ├── plans/
│   │   ├── {unit-name}/
│   │   │   ├── functional-design/
│   │   │   ├── nfr-requirements/
│   │   │   ├── nfr-design/
│   │   │   ├── infrastructure-design/
│   │   │   └── code/               # Markdown summaries only
│   │   └── build-and-test/
│   ├── operations/                 # 🟡 OPERATIONS PHASE (placeholder)
│   ├── aidlc-state.md
│   └── audit.md
```

**CRITICAL RULE**: Application code → workspace root, NEVER in `aidlc-docs/`. Documentation → `aidlc-docs/` only. Project structure patterns → see `code-generation.md`.

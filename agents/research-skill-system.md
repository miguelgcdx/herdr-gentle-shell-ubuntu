---
name: research
description: "Trigger: research this, check current docs, verify current API or SDK behavior, compare providers or integrations, or answer a question that depends on current external evidence. Route Internet research to gentle-ai-research."
---

# Research

## Purpose

Use this skill when the parent needs current information from outside the repository.
The parent owns the question, scope, synthesis, and final decision.
`gentle-ai-research` gathers the external evidence.
Do not use this skill for purely local repository questions.

## Routing

Use `gentle-ai-research` for official docs, APIs, SDKs, frameworks, languages, providers, platforms, specifications, integrations, releases, and current comparisons.
Use `gentle-ai-explore` for local repository structure, runtime flow, ownership, layering, and implementation details.
When both are needed, run them separately and reconcile in the parent.

## 1. Define the Question

State the exact uncertainty research must answer.
Include only context that affects the answer:

- product requirements
- technical constraints
- relevant versions
- required capabilities
- decision being supported
  Avoid vague briefs such as "research everything about X."

## 2. Decide Whether Research Is Needed

Research when:

- the answer may have changed
- current documentation matters
- provider capabilities matter
- API or SDK support is uncertain
- integration availability is uncertain
- a product choice depends on external facts
  Skip research when supplied evidence already answers the question.

## 3. Scope the Research

Default to one `gentle-ai-research` sub-agent.
Bundle related questions when one researcher can answer them efficiently.
Use multiple researchers only for genuinely independent research areas.
Do not duplicate the same research by default.

## 4. Prepare the Brief

Give the researcher:

- the exact research question
- the decision being supported
- relevant constraints
- relevant versions when known
- exact local context files only when useful
  Do not give broad repository exploration tasks to Researcher.

## 5. Search Strategy

Require the researcher to:

- start broad enough to find authoritative sources
- prefer primary sources
- refine weak queries
- open important sources instead of trusting snippets
- search another angle when evidence is incomplete
- stop when enough evidence supports the decision
  For fast-moving topics, prioritize recent official material.

## 6. Evidence Quality

Prefer:

1. official documentation
2. official specifications
3. official repositories
4. release notes or changelogs
5. official provider/API documentation
6. maintainer-authored primary material
   Use community sources only when they add useful real-world evidence.
   Never let weak secondary claims override stronger primary evidence.

## 7. Verify Important Claims

For consequential claims:

- inspect the underlying source
- cross-check another authoritative source when practical
- use source checking when support is unclear
- separate fact, interpretation, and recommendation
  Never invent URLs, versions, limits, prices, capabilities, or API behavior.

## 8. Freshness

When information can change, check:

- current version
- release or update date
- deprecation status
- breaking changes
- current supported API
- current provider behavior
  Separate current guidance from historical guidance.

## 9. Comparisons

Derive comparison criteria from actual product requirements.
Compare only factors that affect the decision:

- required capabilities
- API availability
- integration support
- operational constraints
- important limitations
- architecture implications
  Avoid generic feature matrices unless they help the decision.

## 10. Handoff

Researcher should return:

- direct summary
- source-backed findings
- options and tradeoffs when relevant
- recommendation when evidence supports one
- architecture or implementation implications
- unresolved uncertainty
- sources actually used

## 11. Next Step

Product/business preference remains -> ask the user.
Architecture choice remains -> pass evidence to Architect.
Purely factual question -> return the sourced answer.
Insufficient evidence -> report the gap instead of guessing.

## Efficiency

Keep normal research handoffs around 1,000-2,000 tokens.
Prefer a few strong sources over many weak ones.
Stop when enough evidence exists for the next decision.
Keep the parent context thin.

## Hard Rules

- External research -> `gentle-ai-research`.
- Local exploration -> `gentle-ai-explore`.
- Implementation -> `gentle-ai-worker`.
- Verification -> `gentle-ai-verify`.
- Research is read-only.
- Researcher never delegates.
- User owns material product decisions.
- Parent owns architecture decisions.

## Output

Return the conclusion, evidence, tradeoffs, implications, uncertainty, and next decision required.

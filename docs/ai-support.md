---
title: 'AI Support: LLM-Friendly Documentation'
description: Point coding agents at llms.txt, llms-full.txt or raw Markdown pages for accurate Medicus context.
---

# AI Support

Medicus publishes its documentation in AI-friendly formats, so coding agents can read the real API instead of guessing from training data:

- [llms.txt](https://medicus.js.org/llms.txt) is the lightweight index. Best for letting the agent discover the right page.
- [llms-full.txt](https://medicus.js.org/llms-full.txt) is all pages concatenated. Best when the task needs broad context in a single fetch.
- Raw Markdown for every page at the same URL with a `.md` suffix, like [checkers.md](https://medicus.js.org/checkers.md) or [integrations/fastify.md](https://medicus.js.org/integrations/fastify.md). Best for a single topic.

Prefer the smallest format that answers the task.

## Project Instructions

Health checks are a small part of your application, so don't spend agent context on them. If your agent keeps getting Medicus wrong, one line in `AGENTS.md` is enough:

```markdown
Health checks use medicus. Docs: https://medicus.js.org/llms.txt
```

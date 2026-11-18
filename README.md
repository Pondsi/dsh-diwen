# dsh-diwen — Diwen (迪文) Concept Coordinate System

## What Diwen is: a communication language for machines

Diwen is designed for **machine-to-machine communication** — a **machine-verifiable concept coordinate system** for agent-to-agent exchange, the deterministic content in natural-language↔machine interaction, and machine-to-machine interaction.

Natural language is ambiguous and drifts; Diwen anchors meaning to discrete concept coordinates (S3a semantic field × S3b construction), so machines can **align precisely**, and each concept renders back to a unique natural-language definition. Typical uses:

- **Multi-agent collaboration** — agents exchange meaning via concept coordinates, avoiding misunderstandings caused by natural-language ambiguity.
- **Sub-agent communication** — a lead agent and its sub-agents exchange tasks and results as deterministic concepts.
- **Deterministic knowledge-base content** — knowledge anchored to machine-verifiable concepts rather than fuzzy text.
- **Context summaries / prompts** — compressed meaning carried as concept coordinates, stable across turns and models.

Diwen is **not a translator** and does not generate natural language; it is a verifiable semantic intermediate representation above natural language.

> 中文概要见 [说明.md](说明.md)。

## Status: Chinese is deliverable

The Chinese part is **deliverable and usable**:

| Path | Concept accuracy (measured, holdout / real domain) |
|---|---|
| Cloud deepseek (enhanced) | 0.9933 (enhanced holdout reaches 1.0) |
| Local decision d3:4b (enhanced + calibrated) | 0.9636 → curated 0.9828 |
| Local chat qwen3:8b (enhanced) | 0.9727 |
| Cross-family ensemble | 0.9636 |
| Deterministic mechanical (lower bound, not the production path) | 0.5072 (full-gold recompute, round175) |

Current scale: **3055 concepts** (194 semantic fields), **42 surfaces / 211 senses** in the candidate index, **1258 gold sentences / 211 senses**, frozen holdout 116. All 3055 concepts are reachable via the Chinese surface pack. Model accuracies above are measured on frozen holdout / historical pressure subsets; the deterministic row is the current full-gold mechanical lower bound.

Coverage expansion (13 senses + 4 new concepts: convene 3047 / severe 3048 / firm 3049 / issue_document 3050, then T2 concepts 3051–3055) is verified on three paths: cloud cascade 5/5, local decision d3:4b 8/8 (confidence 94–99%), and local chat qwen3:8b. The curated holdout re-test after expansion is 0.9828 (114/116, round163), a slight improvement over 0.9818 with no regression.

Axiom ① (Diwen → unique Chinese definition) is 100% deterministic. `semanticApproval=false` always holds: passing mechanical validation ≠ semantically correct ≠ human-approved. When no concept exists, the original text is preserved verbatim (Axiom ④) — nothing is fabricated.

## Roadmap

1. Continuously improve Chinese usability (coverage expansion, real-domain generalization).
2. Complete development of 27 languages, then support more.
3. Post-hoc, sense-level concept sharing only where coordinates are provably identical (default: do NOT merge; most pairs stay independent and are linked, not merged). Eliminate natural-language partitions as a machine-interoperation overlay — not by deleting language diversity.
4. Machine-expand concepts and semantics for more natural languages.
5. Continuously refine humanity's existing concepts and semantics.
6. Machine-expand concepts that do not yet exist in natural language.
7. Machine-refine concepts describing the physical world.
8. Machine-refine abstract concepts describing the world.
9. Machine-abstract higher-density concepts, evolving structures better suited to each concept.
10. Continuously improve Diwen so it can clearly describe all things in the world.

## Quick start

This repo is Diwen's **open-core public distribution**: open loader shell + closed core (minified bundle) + encrypted concept data (AES-256-GCM). Clone, then `npm install` to use offline.

### npm package
Published on npm (current **diwen@6.4.0**) — install directly:
```bash
npm install diwen
```
```js
import { mapChinese, describeConcept } from 'diwen';

// Natural language → Diwen fill contract (Axiom ②: model sense selection; Axiom ④: no concept → verbatim)
const r = await mapChinese('我吃饭', { model: 'deterministic' }); // 'auto'|'decision'|'off'
console.log(r.contract.status, r.contract.words, r.semanticApproval); // semanticApproval always false

// Diwen → unique Chinese definition (Axiom ①)
console.log(describeConcept(1223).lemma_zh); // 折
```
Or use from this repo: `cd packages/diwen && npm install`, then `import ... from './index.mjs'`.
- `model:'decision'` uses a local ollama decision model (d3:4b etc.) + calibrated abstention; `enhance:true` enables the enhancement layer.
- The runtime segmentation dependency `@node-rs/jieba` is installed automatically.

### Private Diwen (add your own concepts)
You can **add your own private concepts** without touching the public core; they merge into the lexicon and work across mapping / WSD / describe / render. Private concept IDs must be ≥ **524288** (the custom address partition); glyph coordinates `(s3a,s3b)` must avoid base concepts (collision-checked at load).
```bash
diwen private template -o my-private.json    # scaffold (example concept + a free coordinate)
diwen private free-coords 20                 # list free (s3a,s3b) coordinates
diwen private validate my-private.json       # validate id partition / collisions / schema
export DIWEN_PRIVATE_LEXICON=my-private.json  # load; then map/concept include your concepts
```
Set `DIWEN_PRIVATE_CANDIDATES` for private WSD senses. Your private file is your own data (plain JSON, not uploaded/redistributed; no core decryption needed). Programmatic API: `loadLexicon(path,{privatePath,noCache})`, `validatePrivateRoots`, `freeCoordinates`, `privateTemplate`, `mergeLexicon`. See [docs/PACKAGE-USAGE.md](docs/PACKAGE-USAGE.md) §5.

### MCP server (zero third-party protocol dependency; core via npm `diwen`)
```bash
npm install diwen-mcp
npx diwen-mcp        # or repo-local: node packages/diwen-mcp/server.mjs
```
Configure your MCP client with `command=node, args=[<absolute path>/diwen-mcp/server.mjs]`; **3 tools**: `diwen_map{text,model?,enhance?}`, `diwen_describe{id}`, `diwen_select{cases,mode?,weights?}` (cloud cascade/ensemble sense selection; requires `DIWEN_KEYS_FILE`). Self-test: `node packages/diwen-mcp/selftest.mjs` (**45/45**).

### DeepSeek Harness (dsh) plugin
**Open Cordis shell + depends on npm `diwen` core + deterministic force layer** (diwen-dsh@0.3.1): registers `diwen_map`/`diwen_describe` + skill `diwen`. `dsh plugin --profile <p> add diwen-dsh` (or a local path). Force-layer seams (systemPrompt required instruction / pre-step input projection / post-execute result projection) each have a settings toggle (`forceSystemPrompt`/`forcePreStep`/`forcePostExecute`, default on, with descriptions). Self-test: `node packages/diwen-dsh/selftest.mjs`. See docs/DSH-FORCE-USAGE.md.

## Manuals
- [docs/USAGE-MANUAL.md](docs/USAGE-MANUAL.md): non-technical usage manual (install, call, license, attribution).
- [docs/PACKAGE-USAGE.md](docs/PACKAGE-USAGE.md): npm / MCP / dsh integration guide.
- [说明.md](说明.md): Chinese overview.

## Decision-model choice capacity (advice + error feedback)
A decision model's `--choice` option limit **varies per model and is not fixed**. Measured hard limit is 255 for all (ollama interface); effective discrimination limits: tev1:0.8b=32 / d3:4b=128 / clef-flash=255 / clef=128. **You decide which models to use; Diwen does not forbid any**: `checkModelCapacity` gives advisory hints; on a runtime error `decisionSelect` uses `classifyModelError` to report "this is a model-capacity issue (e.g. too many options) — switch model or reduce candidates".

## Repository layout
```
packages/diwen/       npm package: index.mjs/env.cjs open shell + dist/core.mjs closed core + dist/data.enc encrypted data
packages/diwen-mcp/   MCP server (open shell, reuses closed core)
packages/diwen-dsh/   dsh plugin (open Cordis shell + npm diwen core + force layer with settings toggles)
docs/USAGE-MANUAL.md  non-technical usage manual
docs/PACKAGE-USAGE.md integration guide
docs/DSH-FORCE-USAGE.md  dsh force layer + settings toggles
说明.md               Chinese overview
SPONSORS.md           sponsor page
sponsors/             donation QR images
LICENSE               license
```

## License
**Commercial use permitted (free, no separate authorization), no redistribution, attribution required**: credit Diwen / 迪文 + author **Pondsi** + repository link. Full terms in [LICENSE](LICENSE).

## Support
If Diwen helps you, consider sponsoring — see [SPONSORS.md](SPONSORS.md). Donations buy no extra features; everything stays free.

## Limitations
- Currently only Chinese is deliverable; other languages are on the roadmap (Axiom ⑤: language-independent mapping, no pivot).
- Coverage is not 100% (by Axiom ④ design); words without a concept are preserved verbatim, never fabricated.

Author: Pondsi · https://github.com/Pondsi/dsh-diwen
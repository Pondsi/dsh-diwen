# dsh-diwen — Diwen (迪文) Concept Coordinate System

## What Diwen is: a communication language for machines

Diwen is designed for **machine-to-machine communication** — a **machine-verifiable concept coordinate system** for agent-to-agent exchange, the deterministic content in natural-language↔machine interaction, and machine-to-machine interaction.

Natural language is ambiguous and drifts; Diwen anchors meaning to discrete concept coordinates (S3a semantic field × S3b construction), so machines can **align precisely**, and each concept renders back to a unique natural-language definition. Diwen is **not a translator** and does not generate natural language; it is a verifiable semantic intermediate representation above natural language.

> 中文概要见 [说明.md](说明.md)。

## The two mapping directions (asymmetric by design)

- **Natural language → Diwen is NOT unique, and may be unreachable.** A word can carry several senses (polysemy), so mapping needs model word-sense disambiguation (WSD) — it is not mechanical (Axiom ②). When no concept fits, Diwen **does not guess or force a nearby concept**: it preserves the original text **verbatim** (Axiom ④, "no evidence, no concept"). *Unreachable is a first-class, honest outcome.*
- **Diwen → natural language IS unique and deterministic.** Each concept renders to exactly one canonical Chinese definition (Axiom ①), machine-verifiable, zero drift. **Future upgrade**: a concept will render either to a unique deterministic definition **or** be marked unreachable — both outcomes are possible, but **never an uncertain / non-deterministic rendering**. Determinism is the invariant.

This asymmetry is the point: machines align on discrete concepts going up, and get guaranteed-stable meaning coming down.

## Use cases — and the measured benefit in each

Benefits are **measured**, not advertised: token counts use real `cl100k_base` BPE (`npm run benefits` → `scripts/qa/benefits-measure.mjs`); accuracy comes from blind WSD evaluation; `semanticApproval=false` throughout. **Token savings are relative to natural-language definitions / disambiguation, not bare Chinese words** (Chinese is already token-dense).

| Scenario | What Diwen adds | Measured benefit |
|---|---|---|
| **Multi-agent collaboration** | Agents exchange concept coordinates instead of re-describing meanings in ambiguous NL | A concept reference costs **3 tokens (coordinate) vs 13.75 (NL definition) = −78.2%**; by id **1.62 tokens = −88.2%**. Sense alignment: model WSD **0.9923** (qwen4) / **0.9933** (deepseek) concept accuracy |
| **Sub-agent communication** | Lead ↔ sub-agents exchange tasks/results as deterministic concepts | Same compact reference; rendering **100% deterministic** (3317/3317 round-trip, **0 failures**) → no drift across turns or agents |
| **Deterministic knowledge base** | Knowledge anchored to machine-verifiable concepts, not fuzzy text | Canonical concept index: id vs lemma **−12.8%** tokens; coordinate vs definition **−78.2%**; every entry renders identically |
| **Context summaries / prompts** | Compressed meaning carried as concept coordinates, stable across models | Compact concept references (**−78–88%** vs definitions); stable canonical rendering across turns/models |
| **Error correction (any NL→Diwen)** | Model WSD picks the right sense; honest abstention otherwise | Polysemous mapped words: mechanical **0.192 → ~0.99** with WSD (**≈+80pp** error correction); verbatim recall **0.9931** / precision **0.9983** → no fabrication |
| **Real-time / local** | Local decision models, sub-second; deterministic render instant | d3:4b **0.09s**, clef-flash **0.16s**, clef **0.45s** per example; cloud cascade routes easy cases to a small model (cost saving) |

**Honest caveats**: token savings are vs NL *definitions*, not raw sentences (a coordinate list is not always shorter than the original Chinese); coverage is <100% by design (Axiom ④); model accuracies are measured on frozen holdout / pressure subsets, not arbitrary real-world text.

## Status: Chinese is deliverable

**Current scale**: **3317 concepts** / 194 semantic fields; **162 surfaces / 1024 senses** (mapped 852 / verbatim 172 / approximate 0); **2889 gold sentences / 1024 senses**; frozen holdout 116; pinyin 3316/3317; **all 3317 concepts reachable** via the Chinese surface pack. Private Diwen extension supported (user concepts, id ≥ 699051).

**Concept accuracy — blind WSD evaluation (`semanticApproval=false`)**:

| Model | Interface | Concept accuracy | 95% CI | Speed |
|---|---|---|---|---|
| deepseek (cloud) | chat | **0.9933** | [0.9827, 0.9990] | — |
| **qwen4 (cloud)** | chat | **0.9923** | [0.9856, 0.9981] | — |
| Qwen3.6-35B-A3B (local MoE) | chat | 0.9667 | ±~5pp | ~2s |
| clef (27B local decision) | `--ask --choice` | 0.96 | [0.9155, 0.9815] | 0.45s |
| clef-flash (9.1B decision) | `--ask --choice` | 0.9467 | [0.8983, 0.9727] | 0.16s |
| d3:4b (decision) | `--ask --choice` | 0.9267 | [0.8735, 0.9586] | 0.09s |
| Deterministic mechanical (lower bound) | longest match | 0.288 | ±2.81pp cluster | instant |

Model rows are measured on the round136 gold polysemy pressure subset (1040 examples, blind, zero leakage); the deterministic row is the current full-gold (2889) mechanical lower bound — **not the production path**.

**Production path (enhanced + calibrated; frozen holdout / real domain)**:

| Path | Concept accuracy | Basis |
|---|---|---|
| d3:4b enhanced + calibrated curated t40 | **0.9828** (114/116) | curated holdout (verbatim recall 0.9839) |
| cloud deepseek enhanced | 1.0 | holdout110 |
| qwen3:8b chat enhanced | 0.9727 | holdout110 |
| cross-family ensemble (C3 weighted vote) | 0.9636 | holdout110 |
| d3:4b enhanced real-domain t50 | 0.8056 | real domain 36 (small sample, wide CI) |

**±3pp certification (product metric)**: enhanced d3:4b on frozen holdout — concept accuracy 0.9727, **cluster bootstrap 95% CI ±3.07pp** (90 senses, ρ≈0). Deterministic baseline cluster CI **±2.81pp (1024 senses) — baseline ±3pp also achieved** (converged ±5.89→±5.05→±4.43→±3.86→±2.97→±2.81pp); concept coverage C_gold=0.78 after filling 101 genuine concept gaps. The baseline is the disclosed mechanical lower bound, not the production path.

**Regression**: run-all **718/0** + standalone **55/55** + MCP selftest **45/45**; Diwen→Chinese round-trip **3055/3055**, `identityFailures=0 / determinismFailures=0`.

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
Published on npm (current **diwen@6.10.1**) — install directly:
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
**Open Cordis shell + depends on npm `diwen` core + deterministic force layer** (diwen-dsh@0.3.2): registers `diwen_map`/`diwen_describe` + skill `diwen`. `dsh plugin --profile <p> add diwen-dsh` (or a local path). Force-layer seams (systemPrompt required instruction / pre-step input projection / post-execute result projection) each have a settings toggle (`forceSystemPrompt`/`forcePreStep`/`forcePostExecute`, default on, with descriptions). Self-test: `node packages/diwen-dsh/selftest.mjs`. See docs/DSH-FORCE-USAGE.md.

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
- Currently **Chinese is deliverable — 2 languages: Simplified (zh) + Traditional (zh-TW)**, sharing the same concept coordinates. The other 25 languages are future roadmap (Axiom ⑤: language-independent mapping, no pivot).
- Coverage is not 100% (by Axiom ④ design); words without a concept are preserved verbatim, never fabricated.

Author: Pondsi · https://github.com/Pondsi/dsh-diwen
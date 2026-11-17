// 迪文（Diwen）v6.0 TypeScript 类型声明
// 覆盖 src/index.js 全部 182 个导出符号；由 tests/run-all.js「类型声明」段自检
// （导出全覆盖、无多余值声明、函数均有返回类型、括号平衡、tsc --strict 编译）。
// 用法：import { renderDocument, decodeDocument, GcfSession } from 'diwen';
// 说明：实现为零依赖 ESM JavaScript，本文件只做静态类型标注，不改变运行时行为。

// ---------- 基础类型 ----------

/** 8×8 点阵（或任意 n×n）：0/1 矩阵 */
export type Matrix = number[][];

/** 槽位取值对象（S1..S7 原始槽位） */
export type SlotValues = Record<string, unknown>;

/** 一个迪文词：s1..s7 七个数据槽 + 可选扩展字段 */
export interface DiwenWord {
  s1: string; s2: string; s3a: number; s3b: number; s4: string; s5: string; s6: string; s7: string;
  scope?: number; tense?: string; time?: string; wid?: string;
  confidence?: { lower: number; upper: number };
  grounding_id?: string;
  ref?: { scheme: string; id: string; type: string };
  [key: string]: unknown;
}

/** 迪文文档（机器层 JSON） */
export interface DiwenDocument {
  format?: string;
  reasoning: string;
  words: DiwenWord[];
  pragmatics?: { class?: string; force?: string };
  relations?: DiwenRelation[];
  patch?: Array<{ word_index: number; field: string; value: string | number }>;
  [key: string]: unknown;
}

/** 校验结果（ok=false 时 errors 给出原因） */
export interface CheckResult {
  ok: boolean;
  errors: unknown[];
  [key: string]: unknown;
}

/** 校验结果别名（validateDocument/validateLexicon/validateFrames/validatePatch/validateDrs） */
export type ValidationResult = CheckResult;

// ---------- S8 校验格 ----------

/** S8 逐格定位结果 */
export interface LocalizeS8Result {
  ok: boolean;
  reason: string;
  culprits: unknown[];
  rows: unknown[];
  expected: unknown;
  [key: string]: unknown;
}

/** 九宫格格位（行列均 0 基） */
export interface CellPosition {
  row: number;
  col: number;
  [key: string]: unknown;
}

// ---------- 词典 / 框架 ----------

export type LexiconData = Record<string, unknown>;
export type LexiconIndex = Record<string, unknown>;
export type FrameDef = Record<string, unknown>;

export interface FramesData {
  byName: Map<string, FrameDef>;
  [key: string]: unknown;
}

// ---------- DRS / 可满足性 ----------

export type DrsCondition = Record<string, unknown>;

export interface Drs {
  refs: string[];
  conds: unknown[];
  [key: string]: unknown;
}

export interface SatisfiabilityResult {
  sat: boolean;
  complete: boolean;
  bounds?: { n: number; m: number; [key: string]: unknown };
  boundsExhausted?: boolean;
  model?: unknown;
  [key: string]: unknown;
}

// ---------- 对话协议（L4） ----------

export type MoveName = 'ASSERT' | 'COMMIT' | 'CHALLENGE' | 'RESPOND' | 'WITHDRAW' | 'DECLARE';

export interface ProtocolState {
  seq: number;
  commitments: Record<string, unknown>;
  [key: string]: unknown;
}

// ---------- 组合引擎 ----------

export interface UnifyResult {
  ok: boolean;
  outputType: unknown;
  errors: unknown[];
  [key: string]: unknown;
}

export interface DepthCheck {
  ok: boolean;
  depth: number;
  maxDepth: number;
}

export type ComposeResult = Record<string, unknown>;
export type CompositionSpec = Record<string, unknown>;

// ---------- 基准 / 批处理 ----------

export type BenchMeasurement = Record<string, unknown>;
export type BenchResult = Record<string, unknown>;

export interface BatchReport {
  ok: boolean;
  rows: unknown[];
  total: number;
  passed: number;
  failed: number;
  [key: string]: unknown;
}

export interface DocDiffResult {
  changed: unknown;
  patch: Record<string, unknown>;
  ops: { mod: number; ins: number; del: number; doc: number; [key: string]: unknown };
  lines: unknown;
  [key: string]: unknown;
}

export interface SnapshotDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

export interface WatchResult {
  cycles: unknown;
  events: unknown[];
  [key: string]: unknown;
}

// ---------- GCF 编解码 ----------

export interface GcfEncodeResult {
  text: string;
  stats: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RoundTripResult {
  ok: boolean;
  text: string;
  value: unknown;
  stats: Record<string, unknown>;
  [key: string]: unknown;
}

export type CompareJsonResult = Record<string, unknown>;

// ---------- 补丁（patch） ----------

export type DocumentPatch = Record<string, unknown>;
export type PatchSizeComparison = Record<string, unknown>;

export interface PatchRoundTripResult {
  ok: boolean;
  patch: DocumentPatch;
  back: unknown;
  [key: string]: unknown;
}

// ---------- 渲染 ----------

export interface RenderOptions {
  columns?: number;
  maxWidth?: number;
  pad?: number;
  [key: string]: unknown;
}

export interface Layout {
  columns: number;
  rows: number;
  width: number;
  height: number;
  fits: boolean;
  [key: string]: unknown;
}

export interface RenderedWord {
  index: number;
  word: DiwenWord;
  cells: unknown;
  outer: unknown;
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface RenderedDocument {
  words: RenderedWord[];
  layout: Layout;
  grid: unknown;
  doc: DiwenDocument;
  svg?: string;
  [key: string]: unknown;
}

export interface RenderCellsResult {
  cells: unknown[];
  grid: unknown;
  warnings: unknown[];
  word: DiwenWord;
  doc: DiwenDocument;
  [key: string]: unknown;
}

export interface DecodeCellsResult {
  ok: boolean;
  word: DiwenWord | null;
  errors: string[];
  s8: unknown;
  [key: string]: unknown;
}

export interface DecodeDocumentResult {
  ok: boolean;
  words: DiwenWord[];
  pragmatics: unknown;
  errors: string[];
  [key: string]: unknown;
}

export interface WordRoundTripResult {
  ok: boolean;
  word: DiwenWord | null;
  errors: string[];
  cells: unknown;
  [key: string]: unknown;
}

export interface RoundTripDocumentResult {
  ok: boolean;
  [key: string]: unknown;
}

// ---------- 外环（语力/置信/接地） ----------

export interface OuterDescriptor {
  force?: string;
  confidence?: number;
  grounding?: { value?: string; hash?: string; bits?: number[]; [key: string]: unknown };
  [key: string]: unknown;
}

export interface OuterRoundTripResult {
  ok: boolean;
  first: unknown;
  second: unknown;
  decoded: unknown;
  [key: string]: unknown;
}

export interface ConfidenceTicks {
  lower: number;
  upper: number;
  quantized: boolean;
}

// ---------- 图案 / 几何 ----------

export interface PatternMatch {
  value: unknown;
  distance: number;
}

export interface SvgGeometry {
  width: number | null;
  height: number | null;
  rects: unknown[];
}

export type SegmentResult = Record<string, unknown>;
export type DecodeSvgResult = Record<string, unknown>;

// ---------- 发音层 / 一致性 ----------

export type ConsistencyReport = Record<string, unknown>;
export type ProbeGrid = Record<string, unknown>;

export interface LookupTables {
  forward: unknown;
  reverse: unknown;
  grid: unknown;
  [key: string]: unknown;
}

export interface ConstraintReport {
  ok: boolean;
  minS3A: number;
  minS3B: number;
  violations: unknown[];
  [key: string]: unknown;
}

// ---------- 常量（src/core/constants.js） ----------

export declare const DIWEN_VERSION: string;
export declare const S1: string[];
export declare const NSM_COUNT: number;
export declare const S3B_CONSTRUCTIONS: readonly CompositionSpec[];
export declare const SYLLABLES: string[];
export declare const S3A_MAX: number;
export declare const S3B_MAX: number;
export declare const GRID_LAYOUT: ReadonlyArray<readonly string[]>;
export declare const READING_ORDER: string[];
export declare const DATA_SLOTS: string[];
export declare const SLOT_TO_FIELD: Readonly<Record<string, string>>;
export declare const MIN_HAMMING: number;

// ---------- S8（src/core/s8.js） ----------

export declare const S8_WEIGHTS: Readonly<Record<string, number>>;
export declare const S8_MODULUS: number;
export declare const S8_SIZE: number;
export declare const S8_SLOT_VALUES: Readonly<Record<string, readonly unknown[]>>;
export declare const S8_ROW_SLOTS: string[];
export declare function slotPatternId(slot: string, value: unknown): number;
export declare function s8Code(rawSlots: SlotValues): number;
export declare function s8Matrix(code: number): Matrix;
export declare function s8SlotSignature(slot: string, value: unknown): number;
export declare function s8SignatureValue(slot: string, sig: number): unknown;
export declare function s8RowsOf(rawSlots: SlotValues): number[];
export declare function s8RowsFromMatrix(matrix: Matrix): number[];
export declare function s8MatrixFromRows(rows: number[]): Matrix;
export declare function computeS8(slots: SlotValues): Matrix;
export declare function verifyS8(matrix: Matrix, slots: SlotValues): boolean;
export declare function localizeS8(rawSlots: SlotValues, actualMatrix: Matrix): LocalizeS8Result;
export declare function hamming(a: unknown, b: unknown): number;
export declare function normalizeSlots(input: unknown): SlotValues;

// ---------- Schema / 词典 / 框架 ----------

export interface DiwenRelation { from: string; to: string; type: string; label?: string; note?: string; }
export interface DRSLike { refs?: string[]; conds?: unknown[]; [k: string]: unknown; }
export interface DecisionResult {
  sat: boolean; complete: boolean; verdict: string; decidable: boolean; reason: string;
  bounds?: { n: number; m: number }; error?: string;
}
export interface MappingCase { id: string; domain?: string; text: string; gold: string[]; expectStatus?: string; }
export interface MappingResult {
  cases: number; precision: number; recall: number; f1: number;
  exact: number; exactRate: number; statusOk: number; statusRate: number;
  unknownLemmas?: number; rows: Array<Record<string, unknown>>; byDomain: Record<string, unknown>;
}
export declare function validateDocument(doc: DiwenDocument): ValidationResult;
export declare function checkStructure(words: unknown[]): ValidationResult;
export declare function parentsOf(words: unknown[]): Array<number | null>;
export declare const TENSES: readonly string[];
export declare const RELATION_TYPES: readonly string[];
export declare const BFO_REF_TYPES: readonly string[];
export declare const SCALAR_PATCH_FIELDS: readonly string[];
export declare function normalizeDoc(doc: DiwenDocument): DiwenDocument;
export declare function normalizeWord(w: unknown): unknown;
export declare function normalizeRelations(relations: unknown[]): unknown[];
export declare function canonicalJson(doc: DiwenDocument): string;
export declare function stableStringify(value: unknown): string;
export declare function contentHash(doc: unknown): number;
export declare function equivalentDocs(a: DiwenDocument, b: DiwenDocument): boolean;
export declare function normalizeSemantic(doc: DiwenDocument, opts?: { aliases?: unknown; ignoreWordOrder?: boolean }): DiwenDocument;
export declare function semanticCanonicalJson(doc: unknown): string;
export declare function equivalentSemantics(a: unknown, b: unknown): boolean;
export declare function loadAxioms(path?: string): unknown;
export declare function validateAxioms(data: unknown, constructions?: unknown[]): ValidationResult;
export declare function axiomFor(key: string | number, data?: unknown): unknown | null;
export declare function checkInstance(axiom: unknown, facts?: string[]): { ok: boolean; violations: string[]; entailed: string[] };
export declare function parseAtom(text: string): { pred: string; args: string[] };
export declare const AXIOMS_PATH: string;
/** 匹配区间（2026-11-16 决策④：新增 surface 原文切片，对齐 matchSurfaces 既有约定） */
export interface MatchSpan {
  start: number;
  end: number;
  lemma: string;
  /** text.slice(start,end) 逐字相等；不折叠大小写/不归一化 */
  surface: string;
  root: unknown;
}
export interface MapTextResult {
  status: string;
  roots: string[];
  words: DiwenWord[];
  coverage: number;
  spans: MatchSpan[];
  /** 仅当中文降级态（segmentZh:false 或分词器不可用）时存在且为 true */
  degraded?: boolean;
}
export declare function mapText(text: string, lex?: unknown, opts?: { lang?: "zh"; segmentZh?: boolean; minRoots?: number; minCoverage?: number }): MapTextResult;
export declare function matchRoots(text: string, lex?: unknown, aliases?: unknown, opts?: { lang?: "zh"; segmentZh?: boolean }): { roots: unknown[]; coverage: number; contentChars: number; matchedChars: number; spans: MatchSpan[] };
export declare function lemmaIndex(lex?: unknown): Map<string, unknown>;
export declare function evaluateMapping(cases: MappingCase[], options?: unknown): MappingResult;
export declare function formatMappingReport(result: unknown): string;
export declare function evaluatePredicted(cases: MappingCase[], predictions: Record<string, string[]>, options?: unknown): MappingResult;
export declare function formatModelReport(result: unknown, meta?: { model?: string }): string;
export declare function buildMappingPrompt(cases: MappingCase[], lemmas: string[]): string;
export declare function evaluateThresholds(cases: MappingCase[], options?: { lang?: "zh"; segmentZh?: boolean; lexicon?: unknown; grid?: { minRoots?: number[]; minCoverage?: number[] } }): { cases: number; best: Record<string, unknown>; rows: Array<Record<string, unknown>> };
export declare function formatCalibrationReport(result: unknown): string;
export declare const DEFAULT_GRID: { minRoots: readonly number[]; minCoverage: readonly number[] };
/** 已知运行时选项提示；unknown兼容重载仍保留，类型通过不代表选项已获运行时验证。 */
export declare function measureCoverage(cases: Array<{ id: string; text: string }>, options?: { lang?: "zh"; segmentZh?: boolean; lexicon?: unknown; minRoots?: number; minCoverage?: number }): Record<string, unknown>;
/** 历史宽类型兼容：运行时仅支持显式lang:zh，其余值会抛错。 */
export declare function measureCoverage(cases: Array<{ id: string; text: string }>, options?: unknown): Record<string, unknown>;
export declare function formatCoverageReport(result: unknown, meta?: { label?: string }): string;
export declare function parseMappingResponse(text: string): { ok: boolean; predictions: Record<string, string[]>; error?: string };
export declare function evaluateModelResponse(cases: MappingCase[], text: string, options?: unknown): { ok: boolean; error?: string; result: MappingResult | null; predictions?: Record<string, string[]> };
export declare function mapChinese(text: string, opts?: { model?: "auto" | "deterministic" | "off" | "decision"; enhance?: boolean; decisionModel?: string; threshold?: number; providers?: unknown[]; transport?: unknown; maxRetries?: number; maxInvalidRate?: number; votes?: number; lex?: unknown; candidates?: unknown; lang?: string; minRoots?: number; minCoverage?: number; segmentZh?: boolean }): Promise<{ contract: Record<string, unknown>; mechanical: MapTextResult; tokens: unknown[]; selection: Record<string, unknown> | null; modelUsed: boolean; fallbackUsed: boolean; fallbackReason: string | null; validation: ValidationResult; semanticApproval: false }>;
export declare function describeConcept(id: number, opts?: { lex?: unknown; candidates?: unknown }): { ok: boolean; id?: number; coord?: string; lemma_zh?: string; field?: string; bfo_type?: string; nsm?: string[]; pinyin?: string | null; definitions?: Array<Record<string, unknown>>; slots?: Array<Record<string, unknown>>; error?: string; semanticApproval: false };
export declare function fillContractToDoc(contract: { words?: Array<{ slots: Record<string, unknown> }> }, reasoning?: string): { reasoning: string; words: Array<Record<string, unknown>> };
export declare function loadCandidates(path?: string): { format: string; sourceLanguage: string; entries: Array<{ surface: string; senses: Array<Record<string, unknown>> }> };
export declare const CANDIDATES_PATH: string;
export declare function selectSenses(cases: Array<{ id: string; surface: string; sentence: string }>, candidates: unknown, opts?: { providers?: unknown[]; transport?: unknown; maxRetries?: number; maxInvalidRate?: number }): Promise<{ predictions: Record<string, { conceptId: number | null; verbatim: boolean; sense_key: string | null; invalid?: boolean }>; selections: Record<string, string | null>; audit: Record<string, unknown>; semanticApproval: false }>;
export declare function evaluateAdapter(cases: Array<{ id: string; surface: string; sentence: string }>, candidates: unknown, gold: { entries: Array<Record<string, unknown>> }, opts?: unknown): Promise<Record<string, unknown>>;
export declare function deterministicSelect(cases: Array<{ id: string; surface: string }>, candidates: unknown): Record<string, string | null>;
export declare const PROVIDER_PRESETS: Readonly<Record<string, { name: string; baseURL: string; model: string; schemaMode: string; think: boolean; apiKeyEnv: string | null }>>;
export declare function resolveProvider(spec: string | Record<string, unknown>): { name: string; baseURL: string; model: string; schemaMode: string; think: boolean; apiKeyEnv: string | null; apiKey: string | null; hasKey: boolean };
export declare function wrapAsFillContract(mapTextResult: MapTextResult, sourceText: string, opts?: { lang?: string }): Record<string, unknown>;
export declare function validateFillContract(doc: unknown, opts?: { lex?: unknown; byId?: Map<number, unknown>; byCoord?: Map<string, unknown>; candidates?: Map<string, unknown[]> }): ValidationResult;
export declare function validateCandidateChoice(candidateSenses: Array<{ concept: number | null }>, chosenConcept: number | null): { ok: boolean; errors: string[] };
export declare function rootIndex(lex?: unknown): { byId: Map<number, unknown>; byCoord: Map<string, unknown> };
export declare function buildSenseSelectionPrompt(cases: Array<{ id: string; surface: string; sentence: string }>, candidates: unknown): string;
export declare function parseSenseSelectionResponse(text: string): { ok: boolean; selections: Record<string, string | null>; error?: string };
export declare function senseSelectionPredictions(cases: Array<{ id: string; surface: string }>, selections: Record<string, string | null>, candidates: unknown): Record<string, { conceptId: number | null; verbatim: boolean; sense_key: string | null; invalid?: boolean }>;
export declare function candidateIndex(candidates: { entries?: Array<{ surface: string; senses?: Array<Record<string, unknown>> }> }): Map<string, Map<string, Record<string, unknown>>>;
export declare function evaluateSenseSelection(cases: Array<{ id: string; surface: string; sentence: string }>, text: string, candidates: unknown, gold: { entries: Array<Record<string, unknown>> }): Record<string, unknown>;
export declare function dualStrategyDivergence(predsA: Record<string, number | null>, predsB: Record<string, number | null>): { total: number; divergent: number; agreementRate: number; divergentCases: Array<{ id: string; a: number | null; b: number | null }>; semanticApproval: false };
export declare function toStructureSVG(doc: DiwenDocument, opts?: { columns?: number; title?: string }): string;
export declare function canonicalizeWordOrder(doc: unknown): unknown;
export declare function loadRootAliases(path?: string): unknown;
export declare function validateAliases(data: unknown): ValidationResult;
export declare function aliasIndex(data: unknown): Map<string, string>;
export declare function applyAliases(doc: unknown, data: unknown): unknown;
export declare const ALIASES_PATH: string;
export declare function decideDrs(drs: DRSLike, opts?: { maxIndividuals?: number; maxTimePoints?: number; maxWork?: number }): DecisionResult;
export declare function isDecided(result: { verdict?: string }): boolean;
export declare const DECISION: { SAT: string; UNSAT: string; UNKNOWN: string };
export declare const GCD_KEYWORDS: readonly string[];
export declare function auditSchemaKeywords(schema: unknown): { ok: boolean; keywords: string[]; forbidden: string[]; unknown: string[] };
export declare function runGcdAcceptance(cases: unknown[]): { total: number; passed: number; ok: boolean; rows: unknown[] };
export declare function downsample(matrix: number[][], factor: number): number[][];
export declare function perturb(matrix: number[][], flips: number, seed?: number): number[][];
export declare function slotAccuracy(slot: string, cond?: { factor?: number; flips?: number; seed?: number }): { slot: string; factor: number; flips: number; total: number; correct: number; accuracy: number; misses: unknown[] };
export declare function robustnessMatrix(options?: unknown): unknown[];
export declare const ROBUST_SLOTS: readonly string[];
export declare function benchmarkDedup(docs: unknown[], options?: { rounds?: number }): Record<string, unknown>;
export declare function formatDedupReport(result: unknown): string;
export declare function toYaml(roots: unknown[]): string;
export declare function validateNamespacePack(pack: unknown, baseLex: unknown, baseFrames?: unknown[]): { valid: boolean; errors: string[] };
export declare function mergeLexicon(baseLex: unknown, pack: unknown): { roots: DiwenWord[]; size: number };
export declare const BASE_ROOTS: number;
export declare const MAX_CUSTOM_ROOTS: number;
export declare const BASE_FRAMES: number;
export declare function toOwl(roots: unknown[]): string;
export declare function loadLexiconAliases(path?: string): unknown;
export declare function validateLexiconAliases(data: unknown, lex?: unknown): ValidationResult;
export declare const LEXICON_ALIASES_PATH: string;
export declare function timeIt(fn: () => void, iterations?: number): { iterations: number; min: number; p50: number; p95: number; max: number; mean: number; opsPerSec: number };
export declare function runPerfSuite(options?: { iterations?: number; sizes?: number[]; edgeCounts?: number[] }): { iterations: number; rows: Array<Record<string, unknown>>; memoryMb: { heapUsed: number; rss: number } };
export declare function formatPerfReport(result: unknown): string;
export declare function loadLexicon(path?: string): LexiconData;
export declare function validateLexicon(roots: unknown): ValidationResult;
export declare function buildIndex(roots: unknown): LexiconIndex;
export declare function loadFrames(path?: string): FramesData;
export declare function validateFrames(frames: unknown): ValidationResult;
export declare function resolvedSlots(frame: unknown, byName?: unknown): unknown[];
export declare function matchFrame(term: unknown, byName: unknown): unknown[];
export declare function instantiate(frameName: string, fill?: Record<string, unknown>, byName?: unknown): ComposeResult;
export declare function frameStats(byName?: unknown): unknown[];

// ---------- L2 类型检查 / L3 情境与可满足性 ----------

export declare function checkTypes(words: unknown, opts?: Record<string, unknown>): CheckResult;
export declare function resolveFrame(name: string, frames: unknown): unknown;
export declare const L2_ERRORS: Readonly<Record<string, string>>;
export declare const MAX_TYPE_DEPTH_DEFAULT: number;
export declare function checkSituational(words: unknown, opts?: Record<string, unknown>): CheckResult;
export declare function checkSatisfiability(words: unknown): CheckResult;
export declare function checkDrs(words: unknown, opts?: Record<string, unknown>): CheckResult;
export declare function isCompatible(s4: string, bfoType: string): boolean;
export declare const S4_BFO_COMPAT: Readonly<Record<string, readonly string[]>>;

// ---------- DRS 构造与判定 ----------

export declare function drs(refs?: string[], conds?: unknown[]): Drs;
export declare function atom(pred: string, ...args: unknown[]): DrsCondition;
export declare function rel(relation: string, ...args: unknown[]): DrsCondition;
export declare function not(inner: unknown): DrsCondition;
export declare function imp(ifDrs: unknown, thenDrs: unknown): DrsCondition;
export declare function or(left: unknown, right: unknown): DrsCondition;
export declare function exists(inner: unknown): DrsCondition;
export declare function validateDrs(d: unknown): ValidationResult;
export declare function drsTrue(d: unknown, model: unknown, g?: unknown): boolean;
export declare function isSatisfiable(d: unknown, opts?: Record<string, unknown>): SatisfiabilityResult;
export declare function wordsToDrs(words: unknown): Drs;
export declare const TEMPORAL_RELATIONS: readonly string[];

// ---------- L4 对话协议 ----------

export declare const MOVES: readonly MoveName[];
export declare function createProtocol(opts?: Record<string, unknown>): ProtocolState;
export declare function commitments(state: unknown): unknown[];
export declare function openObligations(state: unknown): unknown[];
export declare function isConsistent(state: unknown): boolean;
export declare function applyMove(state: unknown, move: unknown): ProtocolState;
export declare function runDialogue(moves: readonly unknown[]): ProtocolState;
export declare function detectBreaches(state: unknown): unknown[];
export declare function breaches(state: unknown): unknown[];
export declare function transitionTable(): unknown[];
export declare function exportTransitionTable(format?: string): string;

// ---------- 组合引擎 ----------

export declare function unifySignature(construction: unknown, argTypes?: readonly unknown[]): UnifyResult;
export declare function composeRoot(baseEntry: unknown, construction: unknown, args?: readonly unknown[]): ComposeResult;
export declare function composeRecursive(spec: unknown, opts?: Record<string, unknown>): ComposeResult;
export declare function checkDepth(bfoType: unknown): DepthCheck;
export declare const MAX_DEPTH: number;
export declare function makeChainSpec(d: number): CompositionSpec;
export declare function makeTreeSpec(d: number): CompositionSpec;
export declare function countSpecNodes(spec: unknown): number;

// ---------- 基准 / CLI 工具 ----------

export declare function measure(fn: (...args: unknown[]) => unknown, iterations: number, now?: () => number): BenchMeasurement;
export declare function runBenchmark(opts?: Record<string, unknown>): BenchResult;
export declare function formatBenchMarkdown(result: unknown, info?: Record<string, unknown>): string;
export declare function listJsonFiles(dir: string, opts?: Record<string, unknown>): string[];
export declare function runBatch(dir: string, opts?: Record<string, unknown>): BatchReport;
export declare function formatBatchTable(report: unknown): string;
export declare function docDiff(prev: unknown, next: unknown): DocDiffResult;
export declare function snapshotDir(dir: string, opts?: Record<string, unknown>): Record<string, string>;
export declare function diffSnapshots(prev: unknown, next: unknown): SnapshotDiff;
export declare function watchCycles(opts?: Record<string, unknown>): Promise<WatchResult>;
export declare function isEmptyChanges(changes: unknown): boolean;
export declare function summarizeChanges(changes: unknown): string;

// ---------- GCF 编解码（src/codec/gcf.js） ----------

export declare function encode(value: unknown, session?: GcfSession, opts?: Record<string, unknown>): GcfEncodeResult;
export declare function decode(text: string, session?: GcfSession): unknown;
export declare function roundTrip(value: unknown, session?: GcfSession): RoundTripResult;
export declare function compareToJson(value: unknown, session?: GcfSession): CompareJsonResult;
export declare function estimateTokens(text: string): number;
export declare class GcfSession {
  constructor();
  reset(): void;
  stats(): Record<string, unknown>;
}
export declare const MAGIC: string;
export declare const VERSION: number;

// ---------- 补丁（src/codec/patch.js） ----------

export declare function diffDocument(prev: unknown, next: unknown): DocumentPatch;
export declare function applyPatch(prev: unknown, patch: unknown): unknown;
export declare function encodePatch(patch: unknown, session?: GcfSession): GcfEncodeResult;
export declare function decodePatch(text: string, session?: GcfSession): DocumentPatch;
export declare function comparePatchSize(prev: unknown, next: unknown): PatchSizeComparison;
export declare function patchRoundTrip(prev: unknown, next: unknown): PatchRoundTripResult;
export declare function validatePatch(patch: unknown): ValidationResult;
export declare function deepEqual(a: unknown, b: unknown): boolean;
export declare const PATCH_VERSION: number;

// ---------- 渲染（src/render/index.js） ----------

export declare function renderCells(doc: unknown): RenderCellsResult;
export declare function renderDocument(doc: unknown, opts?: RenderOptions): RenderedDocument;
export declare function wordCellsOf(word: unknown, index?: number): unknown;
export declare function decodeCells(cells: unknown): DecodeCellsResult;
export declare function describeS8(s8: unknown): string;
export declare const SLOT_POSITION: Readonly<Record<string, CellPosition>>;
export declare function decodeDocument(input: unknown): DecodeDocumentResult;
export declare function flattenCells(cells: unknown): unknown[];
export declare function flattenDocument(rendered: unknown): unknown[];
export declare function roundTripWord(word: unknown): WordRoundTripResult;
export declare function roundTripDocument(doc: unknown, opts?: RenderOptions): RoundTripDocumentResult;
export declare function toSVG(doc: unknown, opts?: RenderOptions): string;
export declare function toAscii(doc: unknown, opts?: RenderOptions, on?: string, off?: string): string;
export declare function slotsOf(word: unknown): SlotValues;
export declare const CELL_SIZE: number;
export declare const CELL_GAP: number;
export declare const OUTER_PAD: number;
export declare const CORNER_SIZE: number;
export declare const WORD_GAP: number;
export declare const MAX_COLUMNS: number;
export declare const DOC_FORMAT: string;

// ---------- 外环（src/render/outer.js） ----------

export declare function encodeOuter(outer?: Record<string, unknown>): OuterDescriptor;
export declare function decodeOuter(desc?: Record<string, unknown>): SlotValues;
export declare function renderOuterSpec(desc?: Record<string, unknown>, w?: number, h?: number): string;
export declare function parseOuterSvg(svg: string): SlotValues;
export declare function outerRoundTrip(outer?: Record<string, unknown>): OuterRoundTripResult;
export declare function normalizeForce(input: unknown): string;
export declare function fnv1a32(str: string): number;
export declare function bitsOf32(n: number): number[];
export declare function bitsTo32(bits: readonly number[]): number;
export declare function confidenceTicks(confidence: number): ConfidenceTicks;
export declare function verifyGrounding(desc: unknown, groundingId: string): boolean;
export declare const FORCE_LEVELS: readonly string[];
export declare const OUTER_CONF_STEP: number;
export declare const OUTER_CONF_TICKS: number;
export declare const OUTER_GROUND_BITS: number;
export declare const OUTER_GROUND_COLS: number;
export declare const OUTER_GROUND_ROWS: number;

// ---------- 图案库（src/render/pattern.js） ----------

export declare const SLOT_PATTERNS: Readonly<Record<string, readonly Matrix[]>>;
export declare const SLOT_VALUES: Readonly<Record<string, readonly unknown[]>>;
export declare function patternFor(slot: string, value: unknown): Matrix | null;
export declare function valueForPattern(slot: string, matrix: Matrix): unknown;
export declare function nearestPattern(slot: string, matrix: Matrix): PatternMatch;
export declare function slotMinDistance(slot: string): number;

// ---------- 几何切块 / SVG 逆向 ----------

export declare function parseSvgGeometry(svgText: string): SvgGeometry;
export declare function inferFrameSize(rects: readonly unknown[], tol?: number): number | null;
export declare function segmentRects(rects: readonly unknown[], opts?: Record<string, unknown>): SegmentResult;
export declare function segmentSvg(svgText: string, opts?: Record<string, unknown>): SegmentResult;
export declare const SEGMENT_TOL: number;
export declare function decodeSVG(svgText: string, opts?: Record<string, unknown>): DecodeSvgResult;
export declare function inferCellSize(block: unknown, rects: readonly unknown[], tol?: number): number | null;
export declare function matrixAt(x0: number, y0: number, cell: number, rects: readonly unknown[], tol?: number): Matrix;

// ---------- 知识库 ----------

export declare class KnowledgeBase {
  constructor(entries?: unknown[]);
  entries: unknown[];
  static load(path?: string): KnowledgeBase;
  save(path?: string): void;
  add(entry: unknown): void;
  stats(): { entries: number; structured: number; raw: number; terms: number };
  audit(opts?: Record<string, unknown>): {
    entries: number;
    structured: number;
    raw: number;
    invalidStructured: number;
    invalidNoText: number;
    usableStructured: number;
    terms: number;
  };
  search(query: string, opts?: Record<string, unknown>): unknown[];
  searchParallel(query: string, opts?: Record<string, unknown>): {
    query: string;
    structured: unknown[];
    raw: unknown[];
    discarded: unknown[];
    hitCount: number;
  };
  query(query: string, opts?: Record<string, unknown>): unknown;
  evaluate(cases: readonly unknown[], opts?: Record<string, unknown>): {
    total: number;
    correct: number;
    accuracy: number;
    macroF1: number;
    confusion: Record<string, Record<string, number>>;
    perState: Record<string, { support: number; tp: number; fp: number; fn: number; precision: number; recall: number; f1: number }>;
    failures: Array<{ name: string; query: string; expect: string; got: string }>;
  };
}
export declare function createKB(entries: readonly unknown[]): KnowledgeBase;
export declare function evaluateSpec(spec: unknown, opts?: Record<string, unknown>): { kb: KnowledgeBase; report: unknown };
export declare function formatGuardReport(report: unknown): string;
export declare const GUARD_STATES: readonly string[];
export declare const KB_PATH: string;

// ---------- 发音层（src/phon/syllables.js）与一致性 ----------

export declare const SYLLABLE_SLOTS: string[];
export declare const SLOT_WEIGHTS: Readonly<Record<string, number>>;
export declare function syllableFor(slots: SlotValues): string | null;
export declare function isValidSyllable(s: string): boolean;
export declare function parseSyllable(s: string): SlotValues;
export declare function slotsToKey(slots: SlotValues): string;
export declare function syllableIndex(slots: SlotValues): number;
export declare function toneFor(pragmaticClass: string): string | null;
export declare const TONE_CONTOURS: Readonly<Record<string, string>>;
export declare function slotDomain(slot: string): unknown[];
export declare function buildProbeGrid(): ProbeGrid;
export declare function buildLookupTables(grid?: unknown): LookupTables;
export declare function slotsForSyllable(syllable: string, grid?: unknown): unknown[];
export declare function checkPhonS8Consistency(opts?: Record<string, unknown>): ConsistencyReport;

// ---------- 字形读音层（src/phon/form-reading.js）：按造型定音、与义无关、无多音字 ----------

export declare const S3A_GEOMETRY: readonly string[];
export declare const S3B_GEOMETRY: readonly string[];
export declare const CONSONANT_BY_GEOMETRY: Readonly<Record<string, string>>;
export declare const VOWEL_BY_GEOMETRY: Readonly<Record<string, string>>;
export declare const S3A_SKELETON_COUNT: number;
export declare const S3B_SKELETON_COUNT: number;
export declare function s3aGeometry(i: number): string;
export declare function s3bGeometry(j: number): string;
export declare function readingOfGlyph(s3a: number, s3b: number): string;
export declare function readingOf(word: { s3a: number; s3b: number }): string;
export declare function readingOfSequence(words: Array<{ s3a: number; s3b: number }>, opts?: { separator?: string }): string;
export declare function isValidReading(s: unknown): boolean;
export declare function geometryOfReading(syl: string): { consonant: string; vowel: string; s3aGeometries: string[]; s3bGeometries: string[] } | null;
export declare function activeReadings(): string[];
export declare function verifyConstraints(opts?: Record<string, unknown>): ConstraintReport;
export declare const S3A_GLYPHS: readonly Matrix[];
export declare const S3B_MARKERS: readonly Matrix[];

// ---------- WSD 增强层（src/mapping/wsd-enhance.js / decision-provider.js，round141） ----------

export declare function loadEnhance(): Record<string, { contrastive?: Record<string, string>; fewshot?: Array<{ sentence: string; sense_key: string; source?: string }>; notes?: string }>;
export declare function buildEnhanceAddon(surfaces: string[], enh?: Record<string, unknown>): string;
export declare function buildDecisionPrompt(sentence: string, surface: string, senses: Array<{ sense_key: string; definitionZh?: string }>, enh?: Record<string, unknown>): { question: string; choices: Array<{ key: string; desc: string }> };
export declare function abstain(predKey: string | null, conf: number, threshold?: number): string | null;
export declare const ABSTAIN_THRESHOLD: number;
export declare function decisionSelect(cases: Array<{ id: string; surface: string; sentence: string }>, candidates: unknown, opts?: { model?: string; threshold?: number; timeout?: number }): { predictions: Record<string, { conceptId: number | null; verbatim: boolean; sense_key: string | null; conf?: number; invalid?: boolean }>; audit: Record<string, unknown>; semanticApproval: false };
export declare function retrieveFewshot(surface: string, sentence: string, k?: number, model?: string): Array<{ sentence: string; sense_key: string; source: string; score: number }>;
export declare function escalationFlag(votes: Array<string | null>, conf?: number | null, threshold?: number): { requiresReview: boolean; disagree: boolean; lowConf: boolean };
export declare function buildCritiquePrompt(sentence: string, surface: string, firstPick: string | null, senses: Array<{ sense_key: string; definitionZh?: string }>): string;
export declare function calibrateThreshold(rows: Array<{ gold: string | null; pred: string | null; conf: number; goldVerbatim: boolean; predVerbatim: boolean }>, candidates?: number[]): { threshold: number; acc: number };
export declare function clearDecisionCache(): void;
export declare const CAPS_PATH: string;
export declare function loadCaps(path?: string): Record<string, { hardMaxChoices: number; effectiveMaxChoices: number | null; discrimination?: Record<string, number>; allowed?: boolean; note?: string }>;
export declare function requiredChoices(cases: Array<{ surface: string }>, candidates: { entries: Array<{ surface: string; senses?: unknown[] }> }): number;
export declare function checkModelCapacity(model: string, required: number, caps?: Record<string, { hardMaxChoices: number; effectiveMaxChoices?: number | null }>): { ok: boolean; model: string; required: number; hardMax: number | null; effectiveMax: number | null; reason: string | null; warn?: string | null };
export declare function modelAllowed(model: string, required: number, caps?: Record<string, { hardMaxChoices: number; effectiveMaxChoices?: number | null }>): boolean;
export declare function ensembleSelect(cases: Array<{ id: string; surface: string; sentence: string }>, candidates: unknown, opts?: { specs?: Array<{ key: string; model: string }> }): Promise<{ predictions: Record<string, { conceptId: number | null; verbatim: boolean; sense_key: string | null; votes: Array<string | null> }>; models: string[]; semanticApproval: false }>;

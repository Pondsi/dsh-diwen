---
name: diwen
description: 迪文（Diwen）概念坐标系统使用指引：何时用 diwen_map/diwen_describe、公理②（模型选义）与公理④（无概念→verbatim）、semanticApproval=false 恒成立、不伪造。
---

# 迪文（Diwen）概念坐标系统

迪文是一个概念坐标系统：把中文文本映射为带七个数据槽（S1..S7）的概念词，并按数字 id 查询概念详情。当前仅支持中文。本说明书告诉你何时使用两个工具、以及必须遵守的边界。

## 何时用 diwen_map

- 用户要求「映射/编码/转成迪文」，或需要中文文本的概念坐标、覆盖率、机器可读语义契约时。
- 参数：`text`（必填，中文文本）；`model`（可选，默认 `deterministic`）；`enhance`（可选，布尔）。
- `model` 取值：
  - `deterministic`（默认）：离线确定性基线，无需网络或密钥；只做机械匹配，不做模型选义。
  - `off`：仅机械匹配，不选义。
  - `decision` / `auto`：调用模型选义（需要可用的模型 provider 与密钥）；`enhance=true` 启用 WSD 增强层（对比定义/few-shot/注记）。
- 返回：`contract{status, words[{span, slots{S1..S7}, root}], uncovered, coverage}`，以及 `mechanical`、`tokens`、`selection`、`validation`、`semanticApproval` 等字段。

## 何时用 diwen_describe

- 已有数字概念 id（例如 `diwen_map` 返回的 `words[].root.id`），需要概念详情时：`lemma_zh`、`coord`（s3a:s3b）、`field`、`bfo_type`、`nsm`、`pinyin`、`definitions`。
- `ok=false` 表示无此概念或 id 无效：如实报告，不要猜测或编造详情。

## 公理②：自然语→迪文需模型选义

自然语词是多义的；一个词在句中对应哪个概念，需要选义。`deterministic` 路径只是机械基线，不构成语义判断。需要语义准确时用 `decision`/`auto`（须有可用 provider），并说明结果仍需人工审查。

## 公理④：无概念→verbatim

没有对应概念的文本片段按原文 verbatim 保留在 `contract.uncovered`（reason: no-concept），不就近吞并、不伪造概念。汇报时如实给出 `uncovered` 与 `coverage`；`status=partial` 是常态，不是错误，不要把它粉饰成 full。

## semanticApproval=false（恒成立）

所有返回都带 `semanticApproval:false`：机器规范校验通过 ≠ 语义正确 ≠ 人工批准。不要宣称映射「已获语义批准」或「语义正确」；如实呈现 status、coverage、uncovered，把语义正确性留给人工审查。

## 不伪造

- 只报告工具实际返回的字段；不编造概念 id、槽位值、拼音、定义。
- 不给 uncovered 片段强行安概念，不改写原文以凑匹配。
- describe 查不到的概念，直接说查不到。

## 许可与署名

迪文作者 Pondsi（https://github.com/Pondsi/dsh-diwen）：允许商用、不可再分发、必须署名。集成进程序时须在文档/关于页注明使用「Diwen / 迪文」、作者 Pondsi，并附仓库链接。
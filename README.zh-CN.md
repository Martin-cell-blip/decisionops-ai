# DecisionOps AI

**证据驱动的业务决策双 Agent：结算风险 + 商家增长，运行在真实电商数据上。**

[在线交互站点](https://martin-cell-blip.github.io/decisionops-ai/)（中英双语） · [English README](README.md) · [产品需求文档](docs/PRD.md) · [用户研究](docs/research/synthesis.md)

DecisionOps AI 包含两个有界 Agent：

- **Settlement Agent（结算）**：核对账单完整性、妥投状态、重复计费与合同容差，输出付款、拒付、追回、补票或人工复核建议。
- **Growth Agent（增长）**：对 SKU 组合做质量、现金释放、扩量与提价实验的排序诊断，不把假设包装成因果预测。

设计刻意保守：**确定性 Python 负责计算与政策，LLM 只输出带引用的解释，校验器拒绝无效 `[E#]` 引用，高风险动作强制人工审批。**

## 数据是真实的

在线站点与仓库数据包运行在公开的巴西电商 **Olist 数据集**（2016-10 ~ 2018-08，112,650 条订单行、约 1,360 万雷亚尔 GMV、3,095 个卖家）以及带标注注入异常的承运商账单管道（99,485 条账单行）之上：

- **24 个真实商家**（含 2 个薄数据商家，用于演示"证据不足即拒绝排名"）——决策由仓库的 Python Agent 预计算，见 `scripts/build_real_datasets.py`。
- **30 个真实结算案例**——每个案例的分类都对照注入 ground truth 校验（30/30 一致）。
- **字段来源逐项披露**：真实（Olist 原始值）/ 代理（推导公式已披露）/ 假设（占位值）/ 合成（确定性生成）。观测不到的字段绝不冒充真实数据。

## 在线站点能做什么

- **经营浏览器**：浏览 24 个真实卖家的决策队列、证据链与 SKU 明细（来源徽章逐列标注）。
- **结算工作台**：审查 30 个真实案例，批准/驳回，审批队列保存在你的浏览器（localStorage）。
- **用你自己的数据**：拖入 SKU CSV 或账单 CSV，在浏览器内本地运行同样的决策引擎——**任何数据都不会被上传**。页面内引擎是 Python 包的 JS 镜像（Python 为权威实现）。
- **中英双语**：右上角一键切换，偏好自动记忆。

## 已验证状态

| 能力 | 状态 | 证据 |
|---|---|---|
| 离线决策路径 | 已测试 | 200/200 固定种子二值评测通过 |
| API | 已测试 | FastAPI 健康检查、目录与两个 Agent 端点 |
| OpenAI 叙述 | 在线实测 | `gpt-4.1-mini` 结算与经营场景各一 |
| 百度千帆叙述 | 在线实测 | `ernie-5.1` 与 `ernie-4.5-turbo-32k`；引用归一化后 6/6 通过，校验未放宽（[详情](docs/eval_history.md)） |
| 薄数据防线 | 已测试 | 低于 30 单 / 500 浏览时返回明确的"证据不足"决策，不输出任何建议 |
| 真实数据一致性 | 已测试 | 30 个真实结算案例分类与注入 ground truth 全部一致 |
| 第一方访谈 | 未开展 | 访谈提纲与空日志在仓库中；30 人合成面板已明确标注、仅用于假设生成 |
| 商业影响 / PMF | 不声称 | 需要真实试点与付费意愿验证 |

## 快速开始

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"

pytest                       # 9 项测试
python scripts/run_evals.py  # 200 例可执行评测
python -m decisionops.cli settlement S005_OVERBILLED
python -m decisionops.cli growth M001_HOMEWARE
uvicorn decisionops.api:app --reload
```

重建真实数据包（需要本地 Olist 原始数据）：

```bash
pip install -e ".[data]"
python scripts/build_real_datasets.py --olist-dir <olist原始csv目录> --bill-csv <carrier_bill.csv路径>
```

## 模型接入

默认离线模式无需任何 key。接入模型时复制 `.env.example`：

```bash
# OpenAI
set LLM_PROVIDER=openai
set OPENAI_API_KEY=...

# 百度千帆（OpenAI 兼容 V2 接口）
set LLM_PROVIDER=qianfan
set QIANFAN_API_KEY=...
set QIANFAN_MODEL=ernie-4.5-turbo-32k
```

模型不可用或 API 失败时，确定性决策路径不受影响，叙述层降级为已验证模板；`/health` 端点可诊断 provider 状态。

## 方法：评测、失败与修复

1. **经营评测首轮 20/60**：场景把尾货风险与增长意图混在一起。我们重构场景为四类决策意图，而不是放宽政策凑分——现在 200/200，失败记录在 [eval_history](docs/eval_history.md)。
2. **ERNIE 在线实测发现真 bug**：模型会写 `[E16, E17]` 合并引用，严格校验器直接拒绝。修复是校验前做格式归一化（`citations.py`），每个 ID 仍逐一核验，接受率从时好时坏变成 6/6。
3. **不足 30 单，它会直说**：Growth Agent 拒绝在证据不足时为 SKU 排名。

## 声称边界

本项目在真实数据上展示决策机制与工程纪律，**不声称**已验证需求、收入影响或产品市场匹配——那需要真实试点、领域政策评审与人工结果标注。

## 许可

MIT

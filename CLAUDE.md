# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **n8n Workflow Automatic Design System** - an AI-driven framework that generates complete n8n workflow JSON files from business requirements. The system uses a structured 3-phase process (Phase 1: Requirements & Design, Phase 2: JSON Generation, Phase 3: Integration & Output) with 12-layer architecture and 12-element framework.

## Core Architecture

### 12-Layer Architecture Framework

**Data Flow Layers (L1-L7):**
- L1: Trigger - Event detection and reception
- L2: Input - Data reception and initialization
- L3: Validation - Input validation and format checking
- L4: Transformation - Data transformation and processing
- L5: Core Logic - AI judgment and business logic (AI Agent Node placement)
- L6: Integration - External integration and API calls
- L7: Output - Result output and notifications

**Cross-Cutting Concerns (L8-L12):**
- L8: Error Handling - Error detection and recovery
- L9: Security - Authentication, authorization, encryption
- L10: Monitoring - Logging and metrics collection
- L11: Performance - Caching and parallel processing
- L12: Orchestration - Flow control and conditional branching

### 3-Phase Workflow Generation Process

**Phase 1: Requirements & Design (Step010-060)**
- Step010: Business understanding (12-element framework interview)
- Step020: AI configuration (optimal AI model selection)
- Step030: Technical requirements conversion (12-layer architecture mapping)
- Step040: Task decomposition and grouping
- Step050: AI Agent responsibility definition
- Step060: Pattern application and detailed design

**Phase 2: JSON Generation (Step070-149)**
- Step070-129: Main flow group JSON generation (up to 30 groups)
- Step130-149: Error flow group JSON generation (up to 10 groups)
- Each group uses template from `.claude/agents/step070-メインフローグループJSON生成テンプレート.md`

**Phase 3: Integration & Output (Step150-190)**
- Step150: Inter-group connection integration
- Step160: Workflow validation
- Step170: Layout optimization
- Step180: Sticky Note completion
- Step190: Final output (complete workflow JSON)

## Working with Agent Prompts

### Location
All agent prompts are in `.claude/agents/` directory:
- step010-業務理解.md
- step020-AI設定.md
- step030-技術要件変換.md
- step040-タスク分解とグループ化.md
- step050-AIエージェント責務定義.md
- step060-パターン適用と詳細設計.md
- step070-メインフローグループJSON生成テンプレート.md
- step150-グループ間接続統合.md
- step160-ワークフロー全体検証.md
- step170-配置最適化.md
- step180-StickyNote完成.md
- step190-最終出力.md

### Prompt Structure
Each prompt follows this format:
```markdown
# 目的 (Purpose)
# 背景 (Background)
# 言葉の定義 (Term Definitions)
# 制約 (Constraints)
# 処理手順 (Processing Steps)
## 処理手順の全体フロー (Overall Flow)
## 処理手順1-N (Detailed Steps)
# 初回質問 (Initial Question)
```

### Agent Naming Convention
Each step specifies an agent name based on real-world experts/frameworks:
- システムアーキテクト (System Architect - Grady Booch)
- データエンジニア (Data Engineer - Martin Kleppmann)
- SREエンジニア (SRE Engineer)
- n8nエキスパート (n8n Expert)
- データフローエンジニア (Data Flow Engineer)
- テクニカルライター (Technical Writer)

## Output Directory Structure

When executing the workflow design process, outputs are saved in:
```
./{業務目的}/
├── step010_業務理解/
│   └── 業務理解書.md
├── step020_AI設定/
│   └── AI設定書.md
├── step030_技術要件変換/
│   └── 技術要件書.md
├── step040_タスク分解/
│   └── グループ構成表.md
├── step050_AIエージェント責務/
│   └── AIエージェント責務定義書.md
├── step060_パターン適用/
│   └── 詳細設計書.md
├── step070_Group1_JSON/
│   └── Group1_[グループ名].json
├── ...
├── step150_統合JSON/
│   └── 統合ワークフロー.json
└── step190_最終成果物/
    ├── README.md
    ├── {業務目的}_workflow_integrated_v4.json
    ├── {業務目的}_metadata_v4.json
    ├── 実装手順書.md
    └── 検証レポート.md
```

## n8n-MCP Integration

### Required MCP Tools
- `search_nodes({query, category})` - Search n8n nodes
- `get_node_essentials({nodeType, includeExamples})` - Get node details
- `get_node_documentation({nodeType})` - Get readable documentation
- `validate_node_operation({nodeType, config})` - Validate node configuration
- `validate_workflow({workflow})` - Full workflow validation

### Node Type Format
Always use full node type with prefix:
- Core nodes: `n8n-nodes-base.webhook`, `n8n-nodes-base.httpRequest`
- AI nodes: `@n8n/n8n-nodes-langchain.agent`

## Execution Flow

### Starting a New Workflow Design

1. Execute prompts sequentially from Step010
2. Each step outputs to `./{業務目的}/step{番号}_{ステップ名}/`
3. Get user approval after each step before proceeding
4. Use n8n-MCP to validate node types and configurations
5. Apply 12-layer architecture throughout design

### Template Usage (Phase 2)

For Group N JSON generation:
1. Copy `step070-メインフローグループJSON生成テンプレート.md`
2. Replace `[N]` with actual group number (1, 2, 3, ...)
3. Replace `[グループ名]` with group name from Step060
4. Extract Group N information from Step060 detailed design
5. Execute prompt to generate JSON

### Token Optimization

- Each group JSON should be ≤2500 tokens
- Group size: 3-15 nodes recommended
- If exceeding: reduce group size or simplify parameters

## Sticky Note Design Policy

All Sticky Notes must follow these rules:

**Pattern 1 (Overall Flow):**
- Minimum size: 760×650
- Color: 7 (light pink) - FIXED
- Must include `### 🔗 関連ノードブロック` section with all nodes' roles and connections

**Pattern 2 (Each Group):**
- Minimum size: 540×420
- Colors: Main flow (2/3/4/6), Error flow (5)
- NEVER use white colors (0/1)
- Must include group flow and related nodes block
- Must display layer, dependencies, and main data visually in Markdown

## Git Workflow

Follow `.github/GIT_WORKFLOW.md` for branch strategy and commit conventions:
- Branch naming: `feature/[機能名]-[YYYYMMDD]`
- Commit format: `[種別]: [変更内容]`
  - Types: feat, fix, docs, style, refactor, test, chore
- Always work on feature branches, never on main
- Create PR after pushing changes
- Clean up merged branches regularly

## Common Constraints

### Output Constraints (All Steps)
- Request user confirmation after each step completion
- Proceed to next step only after approval
- Save outputs to designated directories

### Validation Requirements
- Use n8n-MCP for node selection and validation
- All nodes must have correct typeVersion
- Verify all required parameters are defined
- Check connection compatibility between nodes

### Design Principles
- Single Responsibility Principle for AI Agents
- Complete 12-layer mapping required
- Data flow must be explicit (input → processing → output)
- Cross-cutting concerns integrated at appropriate layers

## Example Workflow

See `./Google_Meet議事録自動化_v4.0/` for a complete example:
- Contains all step outputs from Step010 to Step190
- Includes group JSONs (Step070-092)
- Final integrated workflow: `step190_最終成果物/Google_Meet議事録自動化システム_workflow_integrated_v4.json`
- Helper scripts in `scripts/` for validation and conversion

## Important Notes

- This is a **design framework**, not executable code
- Output is n8n workflow JSON for import into n8n
- AI CLI (Claude Code) executes the prompts, not automated scripts
- Each business requirement creates a new directory under project root
- Process is iterative - steps can be revised based on feedback

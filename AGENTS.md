# Repository Guidelines

## Project Structure & Module Organization
The repository centers on `Google_Meet議事録自動化_v4.0/`, a stepwise workspace where each `step0XX_GroupY_JSON/` directory stores modular n8n workflow fragments. Script utilities live under `Google_Meet議事録自動化_v4.0/scripts/`, and final delivery assets (integrated workflow JSON, guides, metadata) are published in `Google_Meet議事録自動化_v4.0/step190_最終成果物/`. Historical research, documentation, and alternative workflows remain in `google calendar登録/` for reference—keep that tree untouched unless you are updating legacy guides referenced by current tasks.

## Build, Test, and Development Commands
- `node Google_Meet議事録自動化_v4.0/scripts/convert_to_ai_agent_nodes.js`: replaces legacy HTTP Request nodes with LangChain Agent nodes before integration.
- `node Google_Meet議事録自動化_v4.0/scripts/integrate_workflow.js`: stitches every group JSON into `step150_統合JSON/Google_Meet議事録自動化システム_workflow_integrated_v4.json` and refreshes metadata.
- `node Google_Meet議事録自動化_v4.0/scripts/check_orphaned_nodes.js`: validates that no functional node is left disconnected (Sticky Notes are ignored).
- `npx n8n import:workflow --input step190_最終成果物/Google_Meet議事録自動化システム_workflow_integrated_v4.json`: loads the integrated workflow into a local n8n instance for end-to-end verification.

## Coding Style & Naming Conventions
Scripts use CommonJS modules, Node 18+ features, and 2-space indentation. Keep filenames descriptive and versioned (e.g., `step078_Group5_JSON/Group5_チャンク並列処理.json`). n8n nodes should retain the `Service: 処理概要 (StepX + context)` pattern so downstream scripts can target them deterministically. Favor camelCase for JavaScript variables, constant-case for directory-level identifiers, and keep prompts inside template literals with clear numbered instructions.

## Testing Guidelines
Before exporting any workflow, rerun `convert_to_ai_agent_nodes` (if you touched inference steps), then `integrate_workflow`, and finally `check_orphaned_nodes`. Import the integrated JSON into n8n, execute a dry run with representative audio files, and capture console output plus n8n execution logs. When altering metadata or documentation, ensure `workflow_metadata.json` statistics align with the actual node count reported by the integration script.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style (`feat:`, `refactor:`, `style:`) as seen in `feat: AI Agent Nodeを活用したワークフロー実装 (#8)`. Scope titles in English where possible, append Japanese specifics in the description, and mention related steps (e.g., “touches step086”). Pull requests should include: summary of workflow impact, regenerated artifacts paths, validation evidence (script logs or n8n screenshots), and linked issue/Notion tickets. Request review from an agent familiar with both the Google Meet workflow and credential management before merging.

## Security & Configuration Tips
Never commit service credentials or OAuth tokens—use n8n credential stores or local `.env` files ignored by git. When sharing sample data, scrub meeting content and rename attendees. For Gemini/Claude model switches, document quota or region requirements inside the relevant step README so other agents can reproduce the setup.

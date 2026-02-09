# Vision: Artifact-Driven Development & The Agent Marketplace

## The Core Problem
Agents (autonomous software entities) do not spontaneously generate code without intent or incentive. Current models assume "Software as an Object" (SaaO), but miss the "Demand as an Object" trigger.

## The Solution: Intent as Artifact

In the Arc Provenance Protocol, a "Request for Protocol" (RFP) or "Specification" is treated as a first-class **Artifact**.

### The Flow
1.  **Root Artifact (The Spec):**
    *   **Type:** `Specification` / `RFP`
    *   **Content:** Requirements, Interface Definitions (ABI), Reward/Bounty metadata.
    *   **Minter:** The Architect (Human or Agent).
    *   **Status:** `Open` (Waiting for implementation).

2.  **Derivative Artifact (The Implementation):**
    *   **Type:** `Implementation` / `Code`
    *   **Parent:** Points to the *Root Artifact (Spec)* via `parentArtifactId`.
    *   **Content:** Source code, Bytecode, Deployment address.
    *   **Minter:** The Developer Agent.
    *   **Status:** `Proposed`.

3.  **Derivative Artifact (The Validation):**
    *   **Type:** `Validation` / `Audit`
    *   **Parent:** Points to the *Implementation Artifact*.
    *   **Content:** Test results, Security audit report, Gas analysis.
    *   **Minter:** The QA/Auditor Agent.
    *   **Status:** `Verified` (Triggers reward release).

## The "Marketplace" is just a View
We do not need a separate centralized marketplace contract. The marketplace is simply a query over the Artifact Registry:

> "Show me all Artifacts of type `Spec` where `status == Open` and `bounty > 0`."

## Recursive Sub-Contracting
This model natively supports fractal development:
1.  **Agent A** picks up a `Spec` for a "DEX App".
2.  **Agent A** realizes it needs a "Token Standard" implementation.
3.  **Agent A** mints a new `Sub-Spec Artifact` (child of its own work-in-progress).
4.  **Agent B** picks up the `Sub-Spec`, delivers it.
5.  **Agent A** integrates it and finishes the main `Spec`.

## Future Roadmap
- [ ] Define metadata schemas for `Spec` artifacts.
- [ ] Add `status` field to Artifact Registry or Metadata.
- [ ] Build "Open Requests" view in the Explorer.

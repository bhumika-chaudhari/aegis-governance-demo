# AEGIS

AEGIS is a local-first prototype for dynamic pre-execution governance of autonomous AI agent actions. The browser app uses a deterministic local policy engine and does not connect to agents, payment services, or databases. An optional Qualcomm Cloud AI Playground adapter can generate decision explanations when explicitly configured. All scenarios are simulated.

## Run

Run the app through its small Node backend (Node 18+):

```powershell
npm start
```

Open `http://localhost:4173`. Demo sign-in accepts the prefilled `operator@aegis.demo` / `governance` credentials. Audit entries, theme preference, and the session are stored in the browser. The backend serves the app and provides the optional Qualcomm proxy routes.

## Included

- Routed Control Plane, Attack Lab, Audit Trail, and Architecture pages
- Deterministic five-dimension risk evaluation with critical override rules
- Scenario loading, agent switching, environment switching, human review actions
- Action DNA, risk explanation, simulated counterfactual map, and audit CSV export
- Eleven Attack Lab cases with evidence detection, severity filters, and direct evaluation
- Interactive SVG trust graph with selectable checkpoints, data-lineage view, and an animated injection path intercepted at the AEGIS gate
- Trust Simulator with live context controls, same-action baseline comparison, one-click trusted/risky presets, and a trust sensitivity curve
- Web3-inspired decision receipts linked with browser SHA-256 digests and a local integrity verifier (not connected to a public chain)
- Responsive layout, keyboard focus styles, semantic form labels, reduced motion support

The audit trail is local browser storage for demonstration and is not tamper-proof. It must not be used to govern real actions.

## Optional Qualcomm Cloud AI Playground

Configure the provider on the server, not in the browser. In PowerShell, set `QAI_API_KEY`, `QAI_MODEL`, and (if needed) `QAI_ENDPOINT` before `npm start`. For example:

```powershell
$env:QAI_API_KEY = 'your-key'
$env:QAI_MODEL = 'your-playground-model-id'
$env:QAI_ENDPOINT = 'https://aisuite.cirrascale.com/apis/v2/chat/completions'
npm start
```

The default endpoint host is restricted to `aisuite.cirrascale.com`; to use another trusted HTTPS provider, set `QAI_ALLOWED_HOSTS` to its hostname(s). The browser never receives the API key. **Architecture → Test backend connection** verifies the server configuration. On the Control Plane, evaluate an action and choose **Explain current decision**. The scenario is sent to the local backend, which calls the configured provider; the deterministic AEGIS policy engine remains the sole authority for Allow / Review / Block. Use synthetic demo data. Never commit provider keys or put them in frontend files.

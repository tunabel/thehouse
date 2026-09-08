# Project instructions

## Repository and workflow

- Repository: https://github.com/tunabel/thehouse.
- Keep `main` limited to `README.md` and agent instruction files until the user changes this policy.
- Implement on `develop`. Commit and push each verified code iteration to `develop` with a descriptive message. Never force-push or rewrite shared history.
- Preserve original user references and unrelated changes. Do not commit personal source drawings or photos unless the user explicitly requests their publication; use local references for comparison.
- Keep the app local-only. Do not deploy or add authentication/backend services without a request.

## Model fidelity

- Recheck the source drawing before changing building dimensions or room boundaries. Written dimensions take priority over estimating photographed linework.
- Digital blueprint and 3D geometry must share the same building data. Do not maintain a separate decorative floor plan that can drift from the model.
- EG rear room spans the house width. Include the door to the garage. Preserve the drawn lift-lobby clearances and turning stair geometry.
- Keep building structure fixed in the user interface. Future finish edits must target stable room/surface IDs, with independent faces on shared walls.
- Use metres throughout. Record uncertain measurements and approximations in `MODEL_NOTES.md` and the app's model notes.

## Verification

- Run TypeScript and the production build for code iterations, plus relevant navigation/geometry checks.
- For geometry changes, compare digital plan and model against the reference and test doorway access, stairs, lift clearance, and floor transitions.
- Report known gaps candidly. Do not claim a floor or room is verified until its accessible route and source comparison have been checked.

## Architecture

- Application directory: `house-app/`; TypeScript, React and Three.js.
- Keep measured data, geometry, navigation and UI separate.
- Later milestones are finish editing, GLB furniture catalog, then the surrounding site; do not implement them prematurely.

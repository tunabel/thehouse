# The House

A local, interactive 3D model of a house in Böhlen, reconstructed from architectural drawings. Explore the completed building, compare its digital floor plans with the source blueprint, and later experiment with finishes, furniture, and the surrounding garden.

## Branches

- `main` intentionally contains only this README and `AGENTS.md` for now.
- `develop` contains the working application and implementation documentation. Verified code iterations are committed and pushed there.

## Run the application

Check out `develop`, then use Node.js 22.13 or newer:

```sh
cd house-app
npm install
npm run dev
```

Open the local address printed by the server. No Blender installation is required. The application is local-only; source references are not deployed.

For the comparison view, keep `blueprint.pdf` in the repository root and run `npm run references` from `house-app` (requires Poppler). This creates ignored local sheet images. **Compare plans** shows the original drawing and dimensioned digital plan beside the selected 3D floor; Close or Escape returns to the explorer. See `MODEL_NOTES.md` for traced measurements and remaining stair limitations.

## Milestones

1. Fixed house structure, desktop walkthrough, and source-comparable digital blueprints.
2. Paint colors, materials, and patterns for individual surfaces and rooms.
3. Reusable GLB furniture catalog and saved furnishing arrangements.
4. Garden, plot, and simplified neighborhood context.

The drawings describe the planned building. Undimensioned or simplified details are documented on `develop`; this visualization is not an as-built survey.

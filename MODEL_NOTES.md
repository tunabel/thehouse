# Model notes

All dimensions use metres. The digital blueprint and the 3D house both use `house-app/lib/house-data.ts` as their only building-data source.

## Ground floor corrections

- The rear EG room is a continuous room across the building width. It is represented by `ground/rear-room`; the original office references 09, 07, and 03 are kept as source labels only.
- The garage door is located from the side dimension chain: 4.895 m from the rear and a 1.135 m structural opening. The previous 1.00 m label was incorrect. The utility wall starts at the utility room instead of cutting off the garage-side part of the open rear room.
- The lift shaft is 1.56 m wide x 1.67 m deep, with a 1.14 m clear side passage. The previously claimed 2.41 m shaft depth was a misread dimension above the shaft. Shaft placement along the building depth is traced, not an independently confirmed dimension.
- The stair remains approximate. The earlier endpoint-only test did not verify a walkable flight: the existing walking function jumps approximately 0.75 m at its turn. Inter-floor walking is NOT verified. Use the floor selector until the stair is reconstructed and tested continuously.

## Floor-by-floor comparison review

- EG, sheet 2/6: retained the continuous rear room; repositioned the corridor divider and openings; removed the fictitious full-width service wall; restored the garage connection to the open west space; added the entrance-lobby separating wall and its door.
- OG, sheet 3/6: office/archive wall faces now follow the written width chain 6.09 / 0.125 / 3.77 / 0.125 / 1.615 / 0.15 / 4.325 m between outer wall faces. Restored the stepped west-WC outline and entrance-lobby door. The WC notch is a trace (approximately 1.04 m); its absolute position needs confirmation because photographed linework and dimension chains are not perfectly aligned.
- DG, sheet 4/6: corrected the west living partition, bedroom door offsets, and hallway doors to the stair landing and WC. Bedroom, bath and central bay geometry remains a combination of written widths and approximate traced depths.
- Colored room extents are finish regions, not additional walls. The digital plan only draws actual modeled wall segments; openings are cut out at their real model width and wall thickness is respected.

## Comparison view and dimensions

Use **Compare plans**: original sheet upper left, digital plan lower left, selected 3D floor on the right. EG/OG/DG switches all panes. Close or Escape exits. Both drawing panes have independent zoom and scrolling. Dimensions shows every wall's coordinates, thickness and openings.

Original pages are generated locally with `npm run references` from the private root `blueprint.pdf`. `public/local-references/` is ignored and must not be committed. These files are for the local preview only.

Overall/chain dimensions, opening widths, source room areas and model extents are displayed. Model values and source room areas are labeled separately. Door swing orientation, undimensioned offsets, and room extents remain approximate; there is no claim of a complete construction drawing or fixed on-screen print scale.

## Verification

`node --import tsx scripts/check-geometry.ts` checks opening bounds and real production collision/navigation data. A 0.10 m grid search reaches every modeled room on its own floor from that floor's spawn, including the garage from EG. This demonstrates a route to each room, not survey accuracy or full-room accessibility. The same check reports the stair discontinuity separately; floor transitions remain unverified.

## Remaining approximations

- Undimensioned internal partitions are traced from the source sheets and should be treated as approximate.
- Roof joins, skylights, finishes, balcony details, exterior escape stair, garden, and neighbouring buildings are simplified or deferred.
- The drawings describe a planned building, not an as-built survey.

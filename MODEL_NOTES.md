# Model notes

All dimensions use metres. The digital blueprint and the 3D house both use `house-app/lib/house-data.ts` as their only building-data source.

## Ground floor corrections

- The rear EG room is a continuous room across the building width. It is represented by `ground/rear-room`; the original office references 09, 07, and 03 are kept as source labels only.
- The garage connects to the house through a 1.00 m T30 door in the shared west wall.
- The lift shaft uses the EG sheet’s 1.67 m x 2.41 m clear dimensions. The surrounding lobby includes the approximately 1.15 m clear passage shown at the shaft’s east side.
- The stair is represented as a turning stair within a 1.26 m envelope. Its landing and turning sequence are used by both the geometry and walking route; exact individual winder geometry and rails remain an approximation.

## Remaining approximations

- Undimensioned internal partitions are traced from the source sheets and should be treated as approximate.
- Roof joins, skylights, finishes, balcony details, exterior escape stair, garden, and neighbouring buildings are simplified or deferred.
- The drawings describe a planned building, not an as-built survey.

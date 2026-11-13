/**
 * Feature flags.
 *
 * NEW_HOME_V2: the "You already play on AMD" homepage layer (all code in src/v2).
 * true  → the new layer renders around the locked homepage (see CHANGES.md).
 * false → the homepage is exactly the locked build in FEATURES_LOCKED.md.
 *
 * Switch it off by setting the value below to false, or for one build without editing:
 *   VITE_NEW_HOME_V2=false npm run build
 */
export const NEW_HOME_V2 = import.meta.env.VITE_NEW_HOME_V2 !== 'false' && true;

import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listBrandKits from "./tools/list-brand-kits";
import listCases from "./tools/list-cases";
import listDevices from "./tools/list-devices";
import listRoiDeals from "./tools/list-roi-deals";
import listUptimeSites from "./tools/list-uptime-sites";
import updateDevice from "./tools/update-device";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "omnihub-cms",
  title: "OmniHub CMS",
  version: "0.1.0",
  instructions:
    "Tools for the OmniHub CMS operations workspace. Read and update Device Hub devices, read Case Tracker entries, brand kits, ROI deals and connected Uptime Kuma instances. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  // Casted: these tools omit `outputSchema`, which the SDK type marks required under
  // the project's exactOptionalPropertyTypes setting.
  tools: [listDevices, updateDevice, listCases, listBrandKits, listRoiDeals, listUptimeSites] as never,
});

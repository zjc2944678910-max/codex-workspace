# Merged Profile Chinese Names - 2026-08-11

## Scope And Authorization

- Risk level: L3 local live-configuration repair.
- Authorization: the user explicitly said
  `按合并订阅中文名称进入修复阶段`.
- Route Lock: `proxy-nodes`.
- In scope: the local Clash Verge profile named `自建+三毛合并`, its display
  metadata, saved selections, and name-dependent provider filters.
- Out of scope: the 38 airport nodes, provider URLs, proxy connection fields,
  the active Clash profile, VPS services, and all external infrastructure.

## Diagnosis

- The merged profile uses two HTTP proxy providers rather than embedding
  proxies directly.
- The self-hosted provider had already refreshed automatically to 13 Chinese
  node names; the airport provider still contained 38 nodes.
- The card description still reported 11 self-hosted nodes.
- Two saved selections still referenced previous English node names.
- The `住宅出口` filter matched only legacy `webshare|9444` names, so the
  Chinese residential names produced an empty group.
- The `自动选择` exclusion used the same legacy terms, so renamed residential
  nodes could become eligible for automatic selection and consume limited
  residential quota.

## Applied Change

- Updated the merged card description to
  `自建13节点 + 三毛机场38节点；统一选择、自动选择、住宅出口`.
- Updated the saved self-hosted selection to `自建 | CF直连｜移动优先`.
- Updated the saved residential selection to
  `自建 | 住宅线路｜兼容WS`.
- Extended the existing name filters while preserving legacy compatibility:
  - automatic exclusion now also matches `住宅线路｜`;
  - residential selection now also matches `住宅线路｜`.
- Did not modify the provider cache, provider URLs, proxy definitions, airport
  nodes, routing rules, or the currently active profile.
- Did not restart Clash Verge or switch profiles.

## Rollback Evidence

The ignored, mode-0700 rollback bundle is:

`ops/projects/proxy-nodes/rollback/20260811T145551+0800-merged-profile-chinese-names`

It contains mode-0600 copies of:

- `profiles.yaml` from the start of the operation;
- `profiles-prewrite.yaml` from immediately before the successful write;
- the merged profile YAML;
- the self-hosted provider cache.

The first write attempt aborted safely because Clash Verge refreshed the
airport profile timestamp after the initial backup. The candidate was rebuilt
from the latest file so that application-owned timestamp was preserved.

Rollback requires restoring `profiles-prewrite.yaml` to the app's
`profiles.yaml` and restoring `merged-profile.yaml` to the merged profile's
local file. No proxy service restart is required, although reopening the
profiles page may be needed to refresh its display.

## Verification

- Source/candidate round-trip checks proved that `profiles.yaml` changed only
  the approved description and two saved selections.
- A separate round-trip check proved that the merged profile changed only the
  two approved filter fields.
- Updated metadata remained unchanged during repeated post-write checks.
- Provider inventory: 13 self-hosted nodes and 38 airport nodes.
- All saved provider selections resolved to current prefixed names.
- The residential group contained exactly six Chinese residential nodes.
- Automatic selection excluded all residential and XHTTP nodes.
- Clash Verge Rev's bundled Mihomo loaded the isolated merged configuration.
- End-to-end HTTP 204 requests succeeded through the saved self-hosted and
  residential selections.

## Residual Risk

- The profile card may retain its previous text until the profiles view is
  reopened because the GUI was intentionally not restarted.
- Name-based filters retain both legacy and current terms so a temporary
  provider rollback does not break selection behavior.
- The merged subscription and provider URLs remain credentials and must not be
  published.

# Merged Residential Selector Repair - 2026-08-11

## Scope And Authorization

- Risk level: L3 local live-configuration repair.
- Authorization: the user explicitly said
  `按合并配置住宅出口进入修复阶段`.
- Route Lock: `proxy-nodes`.
- In scope: the local Clash Verge profile `自建+三毛合并` and the connection
  between its `统一选择` and `住宅出口` groups.
- Out of scope: proxy-provider records, subscription URLs, airport nodes,
  residential upstreams, VPS/NAS services, and every other profile.

## Confirmed Diagnosis

- Clash was in rule mode and the final rule was `MATCH,统一选择`.
- `统一选择` offered `自动选择`, `自建节点`, `三毛机场`, and `DIRECT`, but
  did not offer `住宅出口`.
- The UI's global selector was set to `住宅出口`, but the global selector is
  not used in rule mode.
- Consequently, selecting a city inside `住宅出口` did not affect real
  traffic. The active chain remained `统一选择 → 自动选择`, and a live probe
  exited through a Tokyo Amazon address.
- The separate self-hosted profile worked because its final rule directly used
  its visible `节点选择` group.

## Applied Change

Added exactly one selector reference to the merged profile:

`统一选择 → 住宅出口`

The resulting top-level choices are:

1. `自动选择`
2. `自建节点`
3. `住宅出口`
4. `三毛机场`
5. `DIRECT`

No proxy, provider, rule, filter, URL, node name, connection parameter, or
other profile field changed.

During the repair the user switched to the separate self-hosted profile. That
profile remained active and was not reloaded or modified. The repaired merged
profile was therefore published while inactive, avoiding an unnecessary
connection interruption.

## Rollback Evidence

- Local ignored bundle, mode 0700:
  `ops/projects/proxy-nodes/rollback/20260811T181223+0800-merged-residential-route`
- Secret-bearing candidate directory, mode 0700:
  `scratch/projects/proxy-nodes/merged-residential-route-20260811T181223+0800`
- Publish manifest, mode 0600:
  `scratch/projects/proxy-nodes/merged-residential-route-publish.json`

Rollback requires restoring `merged-profile.yaml` from the rollback bundle to
the target retained in the manifest. The bundled `profiles.yaml` is evidence
only and was not modified by this repair.

## Verification

- A structural round trip proved that removing the one new selector reference
  reconstructs the original YAML object exactly.
- Mihomo configuration validation succeeded.
- An isolated core loaded the repaired merged profile with the real local
  self-hosted and airport provider caches.
- The isolated runtime selected
  `统一选择 → 住宅出口 → 住宅线路｜萨克拉门托`.
- A real request through that chain reached a United States residential
  upstream rather than the previously observed Tokyo Amazon exit.
- The published merged profile hash matched the validated candidate.
- The user's active separate self-hosted profile remained unchanged throughout
  publication.

## Usage After Repair

After switching back to `自建+三毛合并`, select in this order:

1. proxy group: `统一选择`;
2. node: `住宅出口`;
3. proxy group: `住宅出口`;
4. node: the desired residential city.

This two-level selection is intentional: it keeps automatic, self-hosted,
airport, residential, and direct choices available in the same merged profile.

## Residual Risk

- The inactive merged profile was not force-loaded, so the user must switch
  back to it before the new selector appears in the running core.
- One isolated Washington request encountered a transient upstream EOF, while
  the Sacramento path completed successfully. This is independent of the
  confirmed selector-wiring defect.
- Provider and subscription URLs remain credentials and must not be published.

## 2026-08-12 Follow-up

The nested selector model was replaced by a single flat `节点选择` group under
separate L3 authorization. Concrete self-hosted and airport nodes can now be
selected directly without first selecting a child group. See
`2026-08-12-mixed-flat-selector-network-compat-repair.md`.

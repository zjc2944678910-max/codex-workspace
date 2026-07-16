# NAS WireGuard SSH Access Runbook

Last verified: 2026-07-16 13:54 CST

## Current State

- Primary NAS SSH path: `home-nas-wg`
- Fallback NAS SSH path: `home-nas`
- Admin fallback path: `home-nas-admin`
- Removed path: `home-nas-direct6`
- NAS host: `zjcNAS`
- WireGuard NAS address: `10.77.0.1`
- Allowed WireGuard client: `10.77.0.2/32`

The intended steady state is:

- Use `home-nas-wg` for daily low-latency access.
- Keep `home-nas` and `home-nas-admin` through the VPS reverse tunnel as rescue paths.
- Do not use direct public IPv6 SSH to the NAS.
- Keep relay/API services on the VPS unless a separate canary proves the NAS is better.

## 2026-07-16 Mac Client Recovery

- The Mac had no active WireGuard address or route, so `home-nas-wg` was
  unavailable and a Docker image transfer fell back to the VPS reverse-tunnel
  path. The fallback completed an SSH command in about 15.7 seconds and
  transferred the image at less than 13 KiB/s.
- The same-LAN NAS path remained healthy at about 5.3 ms ICMP latency, while
  direct LAN SSH stayed closed or filtered as intended by the firewall policy.
- One existing owner-only WireGuard configuration was found with mode `0600`,
  narrow NAS-only `AllowedIPs`, no DNS setting, no route hooks, valid key
  formats, and a peer still registered on the NAS. Its prior endpoint was
  stale and no longer matched a reachable NAS address.
- The Mac configuration endpoint was changed to the same-LAN NAS listener on
  the existing WireGuard port. A mode-`0600` pre-change backup remains adjacent
  to the private configuration; no key or endpoint value is recorded here.
- The repaired path established a recent peer handshake and matched host
  identity `zjcNAS`. Synthetic 8 MiB tests reached about 9.88 MiB/s down and
  11.98 MiB/s up. The final persistent-config SSH check completed in about
  0.36 seconds, and the public Xiaoxin health endpoint remained HTTP 200.
- No NAS, VPS, Cloudflare, firewall, SSH alias, production container, or
  database state was modified. NAS commands in this recovery were read-only.
- The repaired endpoint is intentionally same-LAN specific. Away from the home
  LAN, use the VPS fallback unless a separately reviewed remote WireGuard
  endpoint is restored.

## Local SSH Aliases

Expected aliases in `~/.ssh/config`:

```sshconfig
Host home-nas
  HostName 127.0.0.1
  Port 2222
  User cc
  ProxyJump home-vps
  HostKeyAlias 192.168.31.6

Host home-nas-wg
  HostName 10.77.0.1
  AddressFamily inet
  Port 22
  User cc
  HostKeyAlias 192.168.31.6

Host home-nas-admin
  HostName 127.0.0.1
  Port 33333
  User cc
  ProxyJump home-vps
  HostKeyAlias 192.168.31.6
```

`home-nas-direct6` was removed from local SSH config so it cannot accidentally
use NAS public IPv6 SSH.

Backup before removing it:

```text
/Users/zhangjincheng/.ssh/config.bak-codex-home-nas-direct6-20260520T005547Z
```

## NAS Firewall Service

Persistent service:

```text
codex-ssh-wg-only.service
```

Installed files on NAS:

```text
/usr/local/sbin/codex-ssh-wg-only.sh
/etc/systemd/system/codex-ssh-wg-only.service
```

Intended firewall behavior:

- Allow established connections.
- Allow local loopback SSH to preserve VPS reverse tunnel fallback.
- Allow `10.77.0.2/32` on `wg0` to connect to NAS `22/tcp`.
- Reject other sources to NAS `22/tcp`.
- Do not modify WireGuard `51820/udp`.
- Do not modify Docker-published `22100`.

## Quick Health Check

Run from the Mac:

```bash
ssh home-nas-wg hostname
ssh home-nas hostname
ssh home-nas-admin hostname
ssh home-nas-direct6 hostname
```

Expected result:

- `home-nas-wg`, `home-nas`, and `home-nas-admin` return `zjcNAS`.
- `home-nas-direct6` fails because the alias has been removed.

Run on NAS through `home-nas-wg`:

```bash
sudo systemctl is-enabled codex-ssh-wg-only.service
sudo systemctl is-active codex-ssh-wg-only.service
sudo /usr/local/sbin/codex-ssh-wg-only.sh status
sudo wg show
```

Expected result:

- Service is `enabled`.
- Service is `active`.
- `CODEX_SSH_WG_ONLY` exists in both IPv4 and IPv6 firewall paths.
- WireGuard still shows the client peer with `allowed ips: 10.77.0.2/32`.

## Reboot Verification

After rebooting NAS, wait for both paths to return:

```bash
ssh home-nas-wg hostname
ssh home-nas hostname
```

Observed recovery during setup:

- First reboot requested at `2026-05-20T00:56:29Z`; both paths recovered by about `00:59:02Z`.
- Second reboot requested at `2026-05-20T01:03:13Z`; both paths recovered by about `01:05:37Z`.

## Rollback

Disable and remove the persistent firewall restriction:

```bash
sudo systemctl disable --now codex-ssh-wg-only.service
```

Optional manual removal if the service is unavailable:

```bash
sudo /usr/local/sbin/codex-ssh-wg-only.sh remove
```

Backups on NAS:

```text
/tmp/codex-ssh-wg-only-20260520T004257Z
/var/backups/codex-ssh-wg-only/20260520T005106Z
/var/backups/codex-ssh-wg-only/20260520T010241Z-fix-order
```

## Notes

- Shadowrocket is expected to stay in Config/rules mode.
- NAS/WireGuard traffic should remain DIRECT.
- VPS remains the public gateway and fallback.
- Public IPv6 SSH is intentionally not part of the normal access path.

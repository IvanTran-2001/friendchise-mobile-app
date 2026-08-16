// Demo accounts are provisioned with an email on this domain. Mirrors the
// web app's `isDemoEmail` (FriendChise/lib/demo/provision/config.ts) — kept
// in sync manually since the two apps don't share a package.
const DEMO_EMAIL_SUFFIX = "@demo.friendchise.app";

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(DEMO_EMAIL_SUFFIX);
}

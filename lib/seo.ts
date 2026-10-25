const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

// Keep production metadata and crawler files on the site's canonical origin
// when the deployment does not provide NEXT_PUBLIC_APP_URL.
export const siteUrl = new URL(
  configuredUrl || "https://wekonnectika.com"
).origin;

// The `disposable-email-domains` package ships a plain CommonJS array of
// domain strings with no bundled types. Declare the shape we rely on.
declare module "disposable-email-domains" {
  const domains: string[];
  export default domains;
}

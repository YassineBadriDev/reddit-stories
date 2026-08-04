export default (typeof process !== "undefined"
  ? (process.env as Record<string, string | undefined>)
  : {}) as Record<string, string | undefined>;

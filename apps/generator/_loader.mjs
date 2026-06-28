// Resolution hook: redirect the (locally unresolvable) `winston` import to a
// no-op stub so pure generator modules can run offline. node_modules untouched.
const STUB = new URL('./_winston-stub.mjs', import.meta.url).href
export async function resolve(specifier, context, next) {
  if (specifier === 'winston') return { url: STUB, shortCircuit: true }
  return next(specifier, context)
}

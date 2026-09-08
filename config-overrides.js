module.exports = function override(config) {
  const oneOfRule = config.module.rules.find(rule => Array.isArray(rule.oneOf))

  if (!oneOfRule) {
    throw new Error('Unable to locate the CRA webpack oneOf rules')
  }

  const dependencyBabelRule = oneOfRule.oneOf.find(
    rule => rule.test && rule.test.toString() === '/\\.(js|mjs)$/'
  )

  if (!dependencyBabelRule) {
    throw new Error('Unable to locate the CRA dependency Babel rule')
  }

  // Supabase 2.116.0 exposes its CommonJS browser entry as .cjs. CRA 3's
  // fallback file loader otherwise emits it as an asset URL at runtime.
  dependencyBabelRule.test = /\.(js|mjs|cjs)$/

  // The SDK's CommonJS entry requires several sibling packages. CRA 3
  // otherwise prefers their ESM entries, which contain imports Webpack 4
  // cannot reconcile with CommonJS exports.
  config.resolve.mainFields = ['browser', 'main']

  return config
}

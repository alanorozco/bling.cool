const postcss = require('postcss');

module.exports = postcss.plugin('bling-merge-media-queries', (options = {}) => {
  return root => {
    const atDecls = {};
    root.walkAtRules(decl => {
      const { params, nodes } = decl;
      if (!(params in atDecls)) {
        atDecls[params] = decl;
      } else {
        atDecls[params].nodes = atDecls[params].nodes.concat(nodes);
        root.removeChild(decl);
      }
    });
    for (const decl of Object.values(atDecls)) {
      root.append(decl);
    }
  };
});

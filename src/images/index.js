const context = require.context('', false, /\.(png|jpe?g|svg)$/)

const obj = {};
context.keys().forEach((key) => {
  obj[key.replace('./', '')] = context(key);
  });

export default obj;
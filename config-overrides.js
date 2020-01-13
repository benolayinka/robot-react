const webpack = require('webpack');
const rewireReactHotLoader = require('react-app-rewire-hot-loader')

module.exports = function override(config, env) {
    config = rewireReactHotLoader(config, env)

    if (!config.plugins) {
        config.plugins = [];
    }

    config.plugins.push(
        new webpack.ProvidePlugin({ adapter: 'webrtc-adapter' })
    );

    if (!config.module.rules) {
        config.module.rules = [];
    }

    config.module.rules.push(
    	{
        	test: require.resolve('janus-gateway'),
        	use: 'exports-loader?Janus=Janus'
      	}
    );

    return config;
}
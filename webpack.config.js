 
var webpack = require('webpack')
var path = require('path')

module.exports = {
  entry: {
    browser: './index.js'
  },
  output: {
    // Use relative path (to the module)
    // path: path.join(__dirname,'public')
    // Use relative path (to the current working directory)
    path: '.'
  , filename: '[name].js'
  , library: 'Zappa'
  , libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        exclude: /node_modules/,
        loader: "json-loader"
      }
    ]
  }
}

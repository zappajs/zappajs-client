var webpack = require('webpack')
var path = require('path')

module.exports = {
  entry: {
    browser: './index.js'
  },
  output: {
    path: path.join(__dirname,'.')
  , filename: '[name].js'
  , library: 'Zappa'
  , libraryTarget: 'umd'
  },
  module: {
    rules: [
    ]
  }
}

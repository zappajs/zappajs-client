    pkg = require './package.json'
    debug = (require 'debug') pkg.name
    request = (require 'superagent-as-promised') require 'superagent'
    socketio = require 'socket.io-client'
    domready = require 'domready'
    {observable} = riot = require 'riot'
    invariate = require 'invariate'

    zappa = (options,f) ->
      if typeof options is 'function'
        [options,f] = [{},options]
      options ?= {}

      context = {}

Context
=======

      ev = context.ev = observable()
      io = context.io = socketio options.io ? {}

      context.on = invariate (message,action) ->
        io.on message, ->
          action.apply context, arguments

      context.emit = invariate.acked (message,action,ack) ->
        io.emit.call io, message, action, (data) ->
          ack.call context, data


Bind the socket with the session, then provide the session ID back to the socket server.

Apply User Function
===================

      if f?
        f.call context, context

Automatically binding ExpressJS and Socket.IO
=============================================

The main purpose of ZappaJS-Client is to automatically bind the ExpressJs and the Socket.IO `@session` objects on the server side, so that all code on the server gains access to the same session object.
This works even if the ExpressJS and the Socket.IO code are running on different servers.

Share
-----

The goal of the `share` function is to bind the socket ID with the ExpressJS session, then provide the session ID back to the socket.IO server.

      share = (next) ->
        zappa_prefix = context.settings.zappa_prefix ? '/zappa'
        channel_name = context.settings.zappa_channel ? '__local'

Let the Express server save its session.id and bind it to the key.

        uri = "#{zappa_prefix}/socket/#{channel_name}/#{io.id}"
        debug "Requesting #{uri}"
        request
        .get uri
        .accept 'json'
        .catch (error) ->
          next? key:null
          return
        .then ({body:{key}}) ->

Let the socket.io server know how to retrieve the session.id by providing it the key.

          debug "Sending __zappa_key to server", {key}
          io.emit '__zappa_key', {key}, next

On IO connect
-------------

When the IO socket is connected,

      io.on 'connect', ->
        debug "Connect"

retrieve the Zappa application settings,

        io.emit '__zappa_settings', null, (settings) ->

          debug 'Received settings', settings
          context.settings = settings

then bind the socket in the ExpressJS session, and provides the ExpressJS session ID to the Socket.IO server.

          share ({key}) ->
            debug 'Received key', key

We do not save the key inside the context until all the steps are completed.
Note: The key is normally not needed.

            context.key = key

Finally, once the DOM is ready, trigger a `ready` event so that our client-side application may start.

            domready ->
              debug 'DOM is ready'
              ev.trigger 'ready'

        debug "Waiting for Zappa settings"

      context

    module.exports = zappa
    module.exports.request = request
    module.exports.io = socketio
    module.exports.riot = riot

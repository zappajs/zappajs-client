    request = (require 'superagent-as-promised') require 'superagent'
    socketio = require 'socket.io-client'
    domready = require 'domready'
    {observable} = riot = require 'riot'
    invariate = require 'invariate'

    zappa = (options,f) ->
      if typeof options is 'function'
        [options,f] = [{},f]
      options ?= {}

      context = {}

      ev = context.ev = observable()

      context.on = invariate (message,action) ->
        io.on message, ->
          action.apply context, arguments

      context.emit = invariate (message,action,ack) ->
        if typeof ack is 'function'
          io.emit.call io, message, action, (data) ->
            ack.call context, data
        else
          io.emit.call io, message, action

      io = context.io = socketio options.io ? {}

      share = (next) ->
        zappa_prefix = context.settings.zappa_prefix ? '/zappa'
        channel_name = context.settings.zappa_channel ? '__local'

Let the Express server save its session.id and bind it to the key.

        request
        .get "#{zappa_prefix}/socket/#{channel_name}/#{io.id}"
        .accept 'json'
        .catch (error) ->
          next? key:null
          return
        .then ({body:{key}}) ->

Let the socket.io server know how to retrieve the session.id by providing it the key.

          io.emit '__zappa_key', {key}, next

      io.on 'connect', ->
        io.emit '__zappa_settings', (settings) ->
          context.settings = settings
          share ({key}) ->

We do not save the key inside the context until all the steps are completed.

            context.key = key
            domready ->
              ev.trigger 'ready'

      if f?
        f.call context, context
      context

    module.exports = zappa
    module.exports.request = request
    module.exports.io = socketio
    module.exports.riot = riot

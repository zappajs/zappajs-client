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

The ZappaJS-Client context contains the following objects:
* `@io`, the Socket.IO client.
* `@request`, a Promisified `superagent` REST client.
* `@riot`, the riotjs module.
* `@ev`, a [riot-observable](https://github.com/riot/observable/tree/master/doc) -- basically you can run `.on` and `.trigger` on it.

      ev = context.ev = observable()
      io = context.io = socketio options.io ? {}
      context.request = request
      context.riot = riot

These objects are always available inside handlers as well!

      build_ctx = (o) ->
        ctx =
          ev: context.ev
          io: context.io
          request: context.request
          riot: context.riot
          emit: context.emit
          on: context.on
        ctx[k] = v for own k,v of o
        ctx

Ready
=====

When all the ZappaJS-Client handshake is done, and once the DOM is ready, the callback of `@ready` is called with its context set to the ZappaJS-Client context.

```
@ready ->
  @emit 'ready'
  @request.get '/data.json'
  .then (data) -> alert data
  # etc.
```

      context.ready = (f) ->
        context.ev.on 'ready', ->
          ctx = build_ctx
            settings: context.settings
          f.apply ctx

Router
======

The router is [riot's router](https://github.com/riot/route/tree/master/doc). However it is not started until you explicitely call `@start()`, so feel free to use your own router instead if you'd like.

* `@start()` is required to start the Riot router.

      context.start = ->
        riot.route.start()
        riot.route.exec()

* `@get` can be used the same way as ZappaJS' `@get`; except it works on the hash-path, not the URI path.
  You can use `@route` if you prefer to use the riotjs name instead of `@get`.

      context.get = context.route = invariate (k,v) ->
        riot.route k, ->

Route context
-------------

* `params` contains the (positional) parameters in an array.
* `query` contains the optional query parameters as an object.

Use '..' at the end of a path to match query arguments.

For example to capture `/foo?bar=3`
```
@get '/foo..': -> @query.bar
```

          ctx = build_ctx
            params: arguments
            query: riot.route.query()
          v.apply ctx, arguments

Socket.IO
=========

A socket.io client is included, you can handle incoming messages from the server using `@on` and send messages back using `@emit`.

      context.on = invariate (event,action) ->
        io.on event, (data,ack) ->

Message handler context
-----------------------

The same context is provided for `@on` handler as in server-side ZappaJS:
* `@event` contains the event's name;
* `@data` contains the optional event's data;
* `@ack` is provided if the sender requested acknowledgment.

Additionally, `@data` and `@ack` are provided as regular arguments if you'd rather use that.

          ctx = build_ctx
            event: event
            data: data
            ack: ack
          action.apply ctx, arguments

      context.emit = invariate.acked (event,data,ack) ->
        io.emit.call io, event, data, (ack_data) ->

Ack context
-----------

When emitting event, you might provide a `ack` callback.

* `@event` contains the event's name;
* `@data` contains the optional ack data.

          ctx = build_ctx
            event: event
            data: ack_data
          ack.apply ctx, arguments

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
          body: key: null
        .then ({body:{key}}) ->

Let the socket.io server know how to retrieve the session.id by providing it the key.

          if key?
            debug "Sending __zappa_key to server", {key}
            io.emit '__zappa_key', {key}, next
          else
            next key: null

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

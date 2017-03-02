Usage
-----

In e.g. browserify or webpack, do

    Zappa = require 'zappajs-client'

In the browser, use `browser.js`, a UMD module that will export `Zappa`.

`Zappa` exposes `.request` ([SuperAgent](https://visionmedia.github.io/superagent/), `.io` ([Socket.IO client](https://github.com/socketio/socket.io-client#socketio-client)), and `.riot` ([Riot.js](http://riotjs.com/)).

Synopsis
--------

    Zappa io:'https://socket.example.net:6531/', ->

      @on 'event-from-server', (data) ->
        # do stuff with data
        @emit 'back-to-server'

      @emit 'to-server-again', ok:true

      # ack callback
      @emit 'to-server-with-ack', ok:true, (data) ->
        # do stuff with data
        @emit 'back-again-to-server'

      # hash-path routing
      @get '/', ->
        alert 'ready'

      @ready ->
        # do startup stuff; session object is now shared between ExpressJS and Socket.IO

        # start the router
        @start()

Reference
---------

The Zappa function is called with (optional) options; the `io` option is passed to Socket.IO.

    z = Zappa io:'https://socket.example.net:6531/'

The return value is the same object as the [root scope](#root-scope) in the callback function.

If no `io` option is provided, then the existing ExpressJS connection is used:

    Zappa ->

      @get '/', ->
        @emit 'client at root'

      @ready ->
        @start()

Handler scope
--------------

All handlers have access to:

### this.io

The Socket.IO client.

### this.ev

A (Riot.js) observable.

In my own Riot.js applications, trying to follow the [Flux Architecture](https://facebook.github.io/flux/docs/overview.html#structure-and-data-flow), I use `@ev` as the dispatcher.

### this.riot

Riot.JS.

### this.request

Promisied SuperAgent.

### this.emit

Emitting events can be done without acknowledgement function:

    @emit 'to-server-again', ok:true

or with an acknowledgement function:

    @emit 'to-server-with-ack', ok:true, ->
      # do stuff with @data
      @emit 'back-again-to-server'

The scope of the `ack` handler contains all the elements of the handler scope, plus:
- `event`: name of the event
- `data`: data sent with the acknowledgement.

### this.on

    @on 'event-from-server', ->
        console.log 'Got', @data
        @emit 'back-to-server'

The scope of the `@on` handler contains all the elements of the handler scope, plus:
- `event`
- `data`
- `ack`

    @on 'event-from-server', ->
      @ack ok:true

Root scope
----------

The scope of the main callback function contains all the elements of the handler scope, plus:

### this.include

`this.include(mod)` will execute `mod.include` in the Root scope.

### this.ready

The `ready` callback is triggered once the DOM is ready and the server-side Socket.IO and ExpressJS sessions are bound together.

The scope of the `ready` handler contains the same elements as the root scope, plus:
- `settings`: from ZappaJS server-side

### this.start

Starts the [Riot.js router](http://riotjs.com/api/route/).

The default router is not started automatically so that you may use a different router if you'd like.

### this.get

Add a [client-side route](http://riotjs.com/api/route/#riotroutefilter-callback).

    @get '/', ->
      alert 'Got /'

    @get
      '/foo': ->
        alert 'Got /foo'
      '/bar': ->
        alert 'Got /bar'

Note that the Riot.js router converts `*` to `([^/?#]+?)` and `..` to `.*`.

    @get '/foo', ->
      # Only matches on /foo

    @get '/blog/*-*/*', ->
      [year,month,date] = @params

    @get '/bar/*', ->
      [name] = @params

    @get '/search..', ->
      # For example, /search?keyword=fruit
      search_for @query.keyword

The route handler scope contains all the elements for the handler scope, plus:
- `params`: the positional arguments of the route path;
- `query`: the named arguments if the hash path contains a query.

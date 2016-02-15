Usage
-----

In e.g. browserify, do

    Zappa = require 'zappajs-client'

`Zappa` exposes `.request` ([SuperAgent](https://visionmedia.github.io/superagent/) + [Promised](https://github.com/shimaore/superagent-as-promised)), `.io` ([Socket.IO client](https://github.com/socketio/socket.io-client#socketio-client)), and `.riot` ([Riot.js](http://riotjs.com/)).

Synopsis
--------

    Zappa io:'https://socket.example.net:6531/', ->

      @on 'event-from-server', (data) ->
        # do stuff with data
        @emit 'back-to-server'

      @emit 'to-server-again', ok:true

      @emit 'to-server-with-ack', ok:true, (data) ->
        # do stuff with data
        @emit 'back-again-to-server'

      @ev.on 'ready', =>
        # do startup stuff; session object is shared between ExpressJS and Socket.IO

Usage
-----

The Zappa function is called with (optional) options; the `io` option is passed to Socket.IO.

    z = Zappa io:'https://socket.example.net:6531/'

The resulting object contains `.on`, `.emit`, and `.io` (the socket created from the options). This object is also the one used as context in the (optional) main callback function.

### this.on

The context inside the callbacks for `.on` is the same object:

    z.on 'event-from-server', (data) ->
        # do stuff with data
        @emit 'back-to-server'

### this.emit

Emitting events can be done without acknowledgement function:

    z.emit 'to-server-again', ok:true

or with a function, which is called using the main context, again:

    z.emit 'to-server-with-ack', ok:true, (data) ->
      # do stuff with data
      @emit 'back-again-to-server'

### this.ev

The main context also contains `.ev` which is a (Riot.js) observable.

### this.settings

The `ready` event is triggered on `.ev` once the DOM is ready and the server-side Socket.IO and ExpressJS sessions are bound together (the services may be located on different domains, it is assumed that the current code is served by ExpressJS). The context also contains `.settings` (from ZappaJS server-side) at that point.

    z.ev.on 'ready', ->
       # do startup stuff; session object is shared between ExpressJS and Socket.IO

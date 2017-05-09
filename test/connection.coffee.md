    pkg = require '../package.json'
    debug = (require 'debug') "#{pkg.name}:test:connection"

    describe 'The ZappaJS client', ->

      handler = ->
          @with 'client'

          {MemoryStore} = @session
          @use session:
            store: new MemoryStore()
            secret: 'foo'
            resave: true
            saveUninitialized: true

          @use morgan:'combined'

          @get '/', ->
            debug 'server: GET /', @session.touched
            @session.touched = "#{@id}+some-secret"
            @json value: @session.touched

          @get '/again', ->
            debug 'server: GET /', @session.touched
            @json value: @session.touched

          @get '/index.html', '<html><head><title>FooBar</title></head><body></body></html>'

          @get '/browser.js', ->
            @res.sendFile 'browser.js', root: __dirname + '/..'

          @on 'check', ->
            debug 'server: On check', @session.touched
            @broadcast 'checked', null if @session.touched is "#{@id}+some-secret"

          @on 'set it', ->
            debug 'server: On set it'
            @broadcast 'set it', @data

          @on 'set', ->
            debug 'server: On set'
            @session.touched = @data
            @broadcast 'was set', null

          @on 'get it', ->
            debug 'server: On get it'
            @broadcast 'get it', null

          @on 'got', ->
            debug 'server: On got'
            @broadcast 'got', @data

          @on 'received', ->
            debug 'server: On received', @session
            @session.touched = @data
            @broadcast 'getit', null

          @browserify '/test.js', ->
            Debug = require 'debug'
            Debug.enable '*'
            pkg = require '../package.json'
            debug = Debug "#{pkg.name}:test:connection:client"

            debug 'Starting client'
            ZappaClient = require '..'
            debug 'Got Client'

First we let ZappaJS-client negotiate all the parameters.

            ZappaClient ->

Once everything is ready client-side (including the DOM),

              @ready ->
                debug 'Client initialized'
                return unless @settings?

we trigger the ExpressJS request to set the session variable,

                ZappaClient.request
                .get '/'
                .then =>
                  debug 'Session data initialized'

then we force the broadcast.

                  @emit 'check'

Then the test runner will ask us to

              @on 'set it', (data) ->
                debug 'On set it'
                @emit 'set', data

              @on 'get it', ->
                debug 'On get it'
                ZappaClient.request
                .get '/again'
                .then ({body:{value}}) =>
                  debug 'Got', value
                  @emit 'got', value

            debug 'Client Ready'

          @coffee '/test-browser.js', ->
            Zappa ->
              @ready ->
                return unless @settings?
                Zappa.request
                .get '/'
                .then =>
                  @emit 'check'
              @on 'set it', (data) ->
                @emit 'set', data
              @on 'get it', ->
                Zappa.request
                .get '/again'
                .then ({body:{value}}) =>
                  @emit 'got', value

      port_1 = 3210
      port_2 = 3211
      server_1 = null
      server_2 = null

      before (done) ->
        @timeout 10*1000

        Zappa = require 'zappajs'

        {server:server_1} = Zappa port_1, handler
        {server:server_2} = Zappa port_2, handler
        debug 'Wait for ZappaJS to start.'
        server_2.on 'listening', ->

          debug 'And wait for browserify to finish.'
          setTimeout (-> done()), 8*1000

      after ->
        server_1.close()
        server_2.close()

      {JSDOM} = jsdom = require 'jsdom'
      old_jsdom = require 'jsdom/lib/old-api'

      virtualConsole = new jsdom.VirtualConsole()
      virtualConsole.sendTo console

      it 'should establish the session server-side (using browserify)', (done) ->
        @timeout 15*1000
        debug 'Starting JSDOM'
        old_jsdom.env
          url: "http://127.0.0.1:#{port_1}/index.html"
          scripts: ["http://127.0.0.1:#{port_1}/test.js"]
          done: (err,window) ->
            debug "JSDOM Failed: #{err.stack ? err}" if err?
            debug 'JSDOM Done'
          virtualConsole: virtualConsole

        io = require 'socket.io-client'
        socket = io "http://127.0.0.1:#{port_1}"
        another_value = Math.random()
        socket.on 'checked', ->
          debug 'runner: On checked -- Session data OK'
          socket.emit 'set it', another_value
        socket.on 'was set', ->
          debug 'runner: On was set'
          socket.emit 'get it', null
        socket.on 'got', (data) ->
          debug 'runner: On got', data
          done() if data is another_value

      it 'should establish the session server-side (using browser.js)', (done) ->
        @timeout 15*1000
        debug 'Starting JSDOM'
        old_jsdom.env
          url: "http://127.0.0.1:#{port_2}/index.html"
          scripts: [
            "http://127.0.0.1:#{port_2}/browser.js"
            "http://127.0.0.1:#{port_2}/test-browser.js"
          ]
          done: (err,window) ->
            debug "JSDOM Failed: #{err.stack ? err}" if err?
            debug 'JSDOM Done'
          virtualConsole: virtualConsole

        io = require 'socket.io-client'
        socket = io "http://127.0.0.1:#{port_2}"
        another_value = Math.random()
        socket.on 'checked', ->
          debug 'runner: On checked -- Session data OK'
          socket.emit 'set it', another_value
        socket.on 'was set', ->
          debug 'runner: On was set'
          socket.emit 'get it', null
        socket.on 'got', (data) ->
          debug 'runner: On got', data
          done() if data is another_value

// Generated by CoffeeScript 1.10.0
(function() {
  var domready, invariate, observable, request, riot, socketio, zappa;

  request = (require('superagent-as-promised'))(require('superagent'));

  socketio = require('socket.io-client');

  domready = require('domready');

  observable = (riot = require('riot')).observable;

  invariate = require('invariate');

  zappa = function(options, f) {
    var context, ev, io, ref, ref1, share;
    if (typeof options === 'function') {
      ref = [{}, options], options = ref[0], f = ref[1];
    }
    if (options == null) {
      options = {};
    }
    context = {};
    ev = context.ev = observable();
    context.on = invariate(function(message, action) {
      return io.on(message, function() {
        return action.apply(context, arguments);
      });
    });
    context.emit = invariate(function(message, action, ack) {
      if (typeof ack === 'function') {
        return io.emit.call(io, message, action, function(data) {
          return ack.call(context, data);
        });
      } else {
        return io.emit.call(io, message, action);
      }
    });
    io = context.io = socketio((ref1 = options.io) != null ? ref1 : {});
    share = function(next) {
      var channel_name, ref2, ref3, zappa_prefix;
      zappa_prefix = (ref2 = context.settings.zappa_prefix) != null ? ref2 : '/zappa';
      channel_name = (ref3 = context.settings.zappa_channel) != null ? ref3 : '__local';
      return request.get(zappa_prefix + "/socket/" + channel_name + "/" + io.id).accept('json')["catch"](function(error) {
        if (typeof next === "function") {
          next({
            key: null
          });
        }
      }).then(function(arg) {
        var key;
        key = arg.body.key;
        return io.emit('__zappa_key', {
          key: key
        }, next);
      });
    };
    io.on('connect', function() {
      return io.emit('__zappa_settings', function(settings) {
        context.settings = settings;
        return share(function(arg) {
          var key;
          key = arg.key;
          context.key = key;
          return domready(function() {
            return ev.trigger('ready');
          });
        });
      });
    });
    if (f != null) {
      f.call(context, context);
    }
    return context;
  };

  module.exports = zappa;

  module.exports.request = request;

  module.exports.io = socketio;

  module.exports.riot = riot;

}).call(this);

//# sourceMappingURL=index.js.map

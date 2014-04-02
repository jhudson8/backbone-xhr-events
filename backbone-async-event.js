(function(Backbone) {
  // allow backbone to send async events on models
  var _sync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    options = options || {};
    var eventName = options && options.event || method,
        events = _.extend({}, Backbone.Events),
        allEvents = _.extend({}, Backbone.Events);

    model.trigger('async', eventName, events);
    model.trigger('async:' + eventName, events);

    function onComplete(type) {
      var _type = options[type];
      options[type] = function() {
        events.trigger.apply(events, arguments);
        var args = _.toArray(arguments);
        _.each([events, allEvents], function(events) {
          // trigger success or error event
          args = (type === 'success') ? [model] : args;

          args.splice(0, 0, type);
          events.trigger.apply(events, args);
          
          // trigger the complete event
          args.splice(0, 1, 'complete');
          events.trigger.apply(events, args);
        });
      };
    }
    onComplete('success');
    onComplete('error');

    _sync.call(this, method, model, options);
  };
})(Backbone);

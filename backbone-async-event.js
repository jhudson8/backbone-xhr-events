/*!
 * backbone-async-event v0.1.3
 * 
 * Copyright (c) 2014 Joe Hudson
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(main) {
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore'], function(Backbone, _) {
      main(Backbone, _);
    });
  } else if (typeof exports !== 'undefined' && typeof require !== 'undefined') {
    module.exports = function(Backbone) {
      main(Backbone, require('underscore'));
    };
  } else {
    main(Backbone, _);
  }
})(function(Backbone, _) {
  // allow backbone to send async events on models
  var _sync = Backbone.sync;
  Backbone.sync = function(method, model, options) {

    options = options || {};
    var loads = model._pendingAsyncEvents = model._pendingAsyncEvents || [],
        eventName = options && options.event || method,
        lifecycleEvents = _.extend({}, Backbone.Events);
    loads.push(lifecycleEvents);

    model.trigger('async', eventName, lifecycleEvents, options);
    model.trigger('async:' + eventName, lifecycleEvents, options);

    if (Backbone.asyncHandler) {
      Backbone.asyncHandler.trigger('async', eventName, model, lifecycleEvents, options);
      Backbone.asyncHandler.trigger('async:' + eventName, model, lifecycleEvents, options);
    }

    function onComplete(type) {
      var _type = options[type];
      options[type] = function() {

        // options callback
        var _args = arguments;
        _type && _type.apply(this, _args);

        // remove the load entry
        var index = loads.indexOf(lifecycleEvents);
        if (index >= 0) {
          loads.splice(index, 1);
        }

        // trigger the success/error event (args for error: xhr, type, error)
        var args = (type === 'success') ? [type, model, options] : [type, model, _args[1], _args[2], options];;
        lifecycleEvents.trigger.apply(lifecycleEvents, args);

        // trigger the complete event
        args.splice(0, 0, 'complete');
        lifecycleEvents.trigger.apply(lifecycleEvents, args);

        if (loads.length === 0) {
          model.trigger('async:load-complete');
        }
      };
    }
    onComplete('success');
    onComplete('error');

    _sync.call(this, method, model, options);
  };

  _.each([Backbone.Model, Backbone.Collection], function(clazz) {
    clazz.prototype.isLoading = function() {
      if (this._pendingAsyncEvents && this._pendingAsyncEvents.length > 0) {
        // if we are loading, return the array of pending events as the truthy
        return this._pendingAsyncEvents;
      }
      return false;
    };
  });
}
);

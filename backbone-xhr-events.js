/*!
 * backbone-xhr-events v1.0.1
 * https://github.com/jhudson8/backbone-async-event
 *
 * Copyright (c) 2014 Joe Hudson<joehud_AT_gmail.com>
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
            // AMD
            return main(Backbone, _);
        });
    } else if (typeof exports !== 'undefined' && typeof require !== 'undefined') {
        // CommonJS
        module.exports = main(require('backbone'), require('underscore'));
    } else {
        main(Backbone, _);
    }
})(function(Backbone, _) {

    // main body start
    // ANY OVERRIDES MUST BE DEFINED BEFORE LOADING OF THIS SCRIPT
    // Backbone.xhrCompleteEventName: event triggered on models when all XHR requests have been completed
    var xhrCompleteEventName = Backbone.xhrCompleteEventName = Backbone.xhrCompleteEventName || 'xhr:complete';
    // the model attribute which can be used to return an array of all current XHR request events
    var xhrLoadingAttribute = Backbone.xhrModelLoadingAttribute = Backbone.xhrModelLoadingAttribute || 'xhrActivity';
    // Backbone.xhrEventName: the event triggered on models and the global bus to signal an XHR request
    var xhrEventName = Backbone.xhrEventName = Backbone.xhrEventName || 'xhr';
    // Backbone.xhrGlobalAttribute: global event handler attribute name (on Backbone) used to subscribe to all model xhr events
    var xhrGlobalAttribute = Backbone.xhrGlobalAttribute = Backbone.xhrGlobalAttribute || 'xhrEvents';

    // initialize the global event bus
    var globalXhrBus = Backbone[xhrGlobalAttribute] = _.extend({}, Backbone.Events);
    var SUCCESS = 'success';
    var ERROR = 'error';

    var Context = function(method, model, options) {
        this.method = method;
        this.model = model;
        this.options = options;
        this._handler = {};
    };
    _.extend(Context.prototype, {
        abort: function() {
            if (!this.aborted) {
                this.aborted = true;
                this.type = 'abort';
                this.triggerAll('abort');
                if (this.xhr) {
                    this.xhr.abort();
                }
            }
        },

        preventDefault: function() {
            this._defaultPrevented = true;
            return this._handler;
        },

        triggerAll: function() {
            var args = _.toArray(arguments);
            args.push(this);
            this.trigger.apply(this, args);
            _.each(this._forwardTo, function(context) {
                args.splice(args.length-1, 1, context);
                context.triggerAll.apply(context, args);
            });
        },

        pushLoadActivity: function() {
            var model = this.model,
                loads = model[xhrLoadingAttribute] = (model[xhrLoadingAttribute] || []);
            loads.push(this);
            _.each(this._forwardTo, function(context) {
                context.pushLoadActivity();
            });
        },

        removeLoadEntry: function() {
            function _remove(context) {
                var model = context.model,
                    loads = model[xhrLoadingAttribute] || [],
                    index = loads.indexOf(context);
                if (index >= 0) {
                    loads.splice(index, 1);
                }

                // if there are no more cuncurrent XHRs, model[xhrLoadingAttribute] should always be undefind
                if (loads.length === 0) {
                    model[xhrLoadingAttribute] = undefined;
                    model.trigger(xhrCompleteEventName, context);
                }
            }
            _remove(this);
            _.each(this._forwardTo, _remove);
        }
    }, Backbone.Events);


    // allow backbone to send xhr events on models
    var _sync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
        options = options || {};
        var context = initializeXHRLoading(method, model, options);
        if (context._defaultPrevented) {
            // it is assumed that either context.options.success or context.options.error will be called
            return;
        }
        var xhr = _sync.call(this, method, model, options);
        context.xhr = xhr;
        return xhr;
    };

    // provide helper flags to determine model fetched status
    globalXhrBus.on(xhrEventName + ':read', function(context) {
        var model = context.model;
        context.on(SUCCESS, function() {
            model.hasBeenFetched = true;
            model.hadFetchError = false;
        });
        context.on(ERROR, function() {
            model.hadFetchError = true;
        });
    });

    // execute the callback directly if the model is fetch
    // initiate a fetch with this callback as the success option if not fetched
    // or plug into the current fetch if in progress
    Backbone.Model.prototype.ensureFetched = Backbone.Collection.prototype.ensureFetched = function(success, error) {
        var model = this;

        function successWrapper() {
            if (success) {
                success(model);
            }
        }
        if (this.hasBeenFetched) {
            return successWrapper();
        }
        // find current fetch call (if any)
        var _fetch = _.find(this[xhrLoadingAttribute], function(req) {
            return req.method === 'read';
        });
        if (_fetch) {
            _fetch.on('success', successWrapper);
            if (error) {
                _fetch.on('error', error);
            }
        } else {
            this.fetch({
                success: successWrapper,
                error: error
            });
        }
    };

    // forward all or some XHR events from the source object to the dest object
    Backbone.forwardXHREvents = function(sourceModel, destModel, typeOrCallback) {
        var handler = handleForwardedEvents(!_.isFunction(typeOrCallback) && typeOrCallback, sourceModel, destModel);
        if (_.isFunction(typeOrCallback)) {
            // forward the events *only* while the function is executing wile keeping "this" as the context
            try {
                sourceModel.on(xhrEventName, handler, destModel);
                typeOrCallback.call(this);
            } finally {
                Backbone.stopXHRForwarding(sourceModel, destModel);
            }
        } else {
            var eventName = typeOrCallback ? (xhrEventName + ':') + typeOrCallback : xhrEventName;
            sourceModel.on(eventName, handler, destModel);
        }
    };

    // stop the XHR forwarding
    Backbone.stopXHRForwarding = function(sourceModel, destModel, type) {
        type = type || '_all';
        var eventForwarders = getEventForwardingCache(sourceModel, destModel),
            handler = eventForwarders[type];
        if (handler) {
            delete eventForwarders[type];
            sourceModel.off(xhrEventName, handler, destModel);
        }

        // clear model cache
        var count = 0;
        _.each(eventForwarders, function() { count ++; });
        if (!count) {
            delete sourceModel._eventForwarders[destModel];
            _.each(sourceModel._eventForwarders, function() { count ++; });
            if (!count) {
                delete sourceModel._eventForwarders;
            }
        }
    };

    function getEventForwardingCache(sourceModel, destModel) {
        var eventForwarders = sourceModel._eventForwarders = (sourceModel._eventForwarders || {});
        if (!eventForwarders[destModel]) {
            eventForwarders[destModel] = {};
        }
        return eventForwarders[destModel];
    }

    function handleForwardedEvents(type, sourceModel, destModel) {
        var eventForwarders = getEventForwardingCache(sourceModel, destModel);

        type = type || '_all';
        var func = eventForwarders[type];
        if (!func) {
            // cache it so we can unbind when we need to
            func = function(sourceContext) {
                var forwardTo = sourceContext._forwardTo = (sourceContext._forwardTo || []);
                forwardTo.push(initializeXHRLoading(sourceContext.method, destModel, sourceContext.options || {}, true));
            };
            eventForwarders[type] = func;
        }
        return func;
    }

    // set up the XHR eventing behavior
    // "model" is to trigger events on and "sourceModel" is the model to provide to the success/error callbacks
    // these are the same unless there is event forwarding in which case the "sourceModel" is the model that actually
    // triggered the events and "model" is just forwarding those events
    function initializeXHRLoading(method, model, options, forwarding) {
        var eventName = options.event || method,
            context = new Context(method, model, options),
            scopedEventName = xhrEventName + ':' + eventName,
            finished;

        // at this point, all we can do is call the complete event
        var origCallbacks = {
            success: options.success,
            error: options.error
        };

        function finish(type) {
            if (!forwarding && !finished) {
                finished = true;
                context.removeLoadEntry();
                type = type || 'halt';

                // trigger the complete event
                context.triggerAll('complete', type);
            }
        }
        // allow complete callbacks to be executed from the preventDefault response
        context._handler.complete = finish;

        function wrapCallback(type) {

            function triggerEvents() {
                if (!finished) {

                    try {
                        var args = Array.prototype.slice.call(arguments, 0, 3);

                        // options callback
                        var typeCallback = origCallbacks[type];
                        if (typeCallback) {
                            typeCallback.apply(context, args);
                        }

                        // trigger the success/error event
                        args.splice(0, 0, type);
                        args.push(context);
                        context.triggerAll.apply(context, args);

                    } finally {
                        finish(type);
                    }
                }
            }
            // allow success/error callbacks to be executed from the preventDefault response
            context._handler[type] = triggerEvents;

            // success: (data, status, xhr);  error: (xhr, type, error)
            options[type] = function(p1, p2, p3) {

                if (!context._defaultPrevented) {
                    context.triggerAll('after-send', p1, p2, p3, type);

                    // if context.preventDefault is true, it is assumed that the option success or callback will be manually called
                    if (context._defaultPrevented) {
                        return;
                    } else if (context.data) {
                        p1 = context.data || p1;
                    }

                    triggerEvents(p1, p2, p3);
                }
            };
        }

        if (!forwarding) {
            // wrap the orig callbacks
            wrapCallback(SUCCESS);
            wrapCallback(ERROR);
        }

        // trigger the model xhr events
        model.trigger(xhrEventName, context, eventName);
        model.trigger(scopedEventName, context);

        if (!forwarding) {

            // don't call global events if this is XHR forwarding
            globalXhrBus.trigger(xhrEventName, context, eventName);
            globalXhrBus.trigger(scopedEventName, context);

            // allow for 1 last override
            var _beforeSend = options.beforeSend;
            options.beforeSend = function(xhr, settings) {
                context.xhr = xhr;
                context.xhrSettings = settings;

                if (_beforeSend) {
                    var rtn = _beforeSend.call(this, xhr, settings);
                    if (rtn === false) {
                        return rtn;
                    }
                }
                context.triggerAll('before-send', xhr, settings);
                if (context._defaultPrevented) {
                    return false;
                }
                context.pushLoadActivity();
            };
        }

        return context;
    }

    // allow fetch state flags to be reset if the collection has been reset or the model has been cleared
    _.each({
        'reset': Backbone.Collection,
        'clear': Backbone.Model
    }, function(Clazz, key) {
        var protoFunc = Clazz.prototype[key];
        Clazz.prototype[key] = function(models) {
            if (key === 'clear' || _.isUndefined(models)) {
                this.hasBeenFetched = this.hadFetchError = false;
            }
            protoFunc.apply(this, arguments);
        };
    });
    // main body end

});

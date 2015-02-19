registerProject({"title":"backbone-xhr-events","summary":"Do more than what the default [Backbone](#link/http%3A%2F%2Fhttp%3A%2F%2Fbackbonejs.org%2F) Model/Collection ```request``` event does for you.  The primary benefits are\n\n* Provide robust lifecycle events (```before-send```, ```after-send```, ```success```, ```error```, ```complete```)\n* Emit type specific XHR events to allow for focused binding\n* Give ability to see if a model currently has any pending XHR activity\n* Provide a global event bus to bind to all Model/Collection XHR activity\n* Allow requests to be intercepted to, for example, return cached content\n* Add ability to intercept and override response data before it is returned to the Model/Collection\n* Provide event forwarding capabilities so other objects can simulate XHR activity to match another Model/Collection\n* Make all event names and additional attributes overrideable to meet the needs of your particular project\n* Give external entities a way to observe ajax activity on your Collections and Models","installation":"\nBrowser:\n\n```\n    <script src=\".../underscore[-min].js\"></script>\n    <script src=\".../backbone[-min].js\"></script>\n    <script src=\".../backbone-xhr-events[-min].js\"></script>\n```\n\nCommonJS\n\n```\n    require('backbone-xhr-events')(require('backbone'), require('underscore'));\n```\n\nAMD\n\n```\n    require(\n      ['backbone', 'underscore', 'backbone-xhr-events'], function(Backbone, _, backboneXhrEvents) {\n      backboneXhrEvents(Backbone, _); \n    });\n```\n\n","sections":[{"body":"Listen to all XHR activity\n\n```\n    Backbone.xhrEvents.on('xhr', function(context) {\n      context.on('success', function() {\n        // context.model has been updated\n      });\n    });\n```\n\nOverride fetch XHR payload or cache it\n\n```\n    Backbone.xhrEvents.on('xhr:read', function(context) {\n      context.on('after-send', function(data, status, xhr, responseType) {\n\n        // responseType will either be 'success' or 'error'\n        if (responseType === 'success') {\n\n          // wrap the response as a \"response\" attribute (just to show how to modify it)\n          context.data = { response: data };\n\n          // cache the response\n          _cacheFetchResponse(JSON.stringify(data), context.options.url);\n        }\n      });\n    });\n```\n\nIntercept a fetch request and return a cached payload\n\n```\n    Backbone.xhrEvents.on('xhr:read', function(context) {\n\n      // use the \"before-send\" event (rather than just doing it here) to ensure that options.url exists\n      context.on('before-send', function() {\n\n        var cachedResult = _getFetchCache(context.options.url);\n        if (cachedResult) {\n          context.preventDefault().success(JSON.parse(cachedResult), 'success');\n        }\n      });\n    });\n```\n\nMake a successful XHR look like a failure\n\n```\n    model.on('xhr', function(context) {\n\n      context.on('after-send', function(data, status, xhr, responseType) {\n        if (responseType === 'success') {\n\n          // provide the parameters that you would have wanted coming back directly from the $.ajax callback\n          context.preventDefault().error(xhr, 'error', 'Not Found');\n        }\n      });\n    });\n```\n\nAlter the payload asynchronously after the initial response is returned\n\n```\n    Backbone.xhrEvents.on('xhr', function(context) {\n\n      context.on('after-send', function(data, status, xhr) {\n        var handler = context.preventDefault();\n\n        yourOwnGetDataAsyncMethod(function(data) {\n          handler.success(data, status, xhr);\n        });\n      });\n    });\n```\n\nAdd simulated 1 second latency\n\n```\n    Backbone.xhrEvents.on('xhr', function(context) {\n\n      context.on('after-send', function(p1, p2, p3, responseType) {\n        var handler = context.preventDefault();\n\n        setTimeout(function() {\n          var successOrErrorMethod = handler[responseType];\n          successOrErrorMethod(p1, p2, p3);\n        }, 1000);\n      });\n    });\n```\n\nSet a default connection timeout on all XHR activity\n\n```\n    Backbone.xhrEvents.on('xhr', function(context) {\n      context.options.timeout = 3000;\n    });\n```\n\nDetermine fetch status of a model\n\n```\n    model.fetch();\n    !!model.xhrActivity === true;\n\n    // model fetch complete now\n    !!model.xhrActivity === false;\n\n    // if the model fetch succeeded\n    model.hasBeenFetched === true;\n    model.hadFetchError === false;\n\n    // if the model fetch has failed...\n    model.hadFetchError === true;\n    model.hasBeenFetched === false;\n```\n\nForward xhr events to another model\n(source model will continue to emit xhr events as well)\n\n```\n    // forward all events\n    Backbone.forwardXHREvents(sourceModel, receiverModel);\n    // stop forwarding all events\n    Backbone.stopXHRForwarding(sourceModel, receiverModel);\n\n    // forward events for a specific Backbone.sync method\n    Backbone.forwardXHREvents(sourceModel, receiverModel, 'read');\n    // stop forwarding all events\n    Backbone.stopXHRForwarding(sourceModel, receiverModel, 'read');\n\n    // forward events *only while the callback function is executed*\n    Backbone.forwardXHREvents(sourceModel, receiverModel, function() {\n      // any XHR activity that sourceModel executes will be emitted by\n      // receiverModel as well\n    });\n```\n\nPrevent duplicate concurrent submission of any XHR request\n\n```\n    Backbone.xhrEvents.on('xhr', function(context) {\n      context.on('before-send', function(xhr, settings) {\n        // we need to use before-send because Backbone.sync creates settings.data\n\n        // see if any current XHR activity matches this request\n        var match = _.find(model.xhrActivity, function(_context) {\n          return context.options.url === _context.options.url\n              && method === _context.method\n              && _.isEqual(settings.data, _context.settings.data);\n        });\n        if (match) {\n          var handler = context.preventDefault();\n          // when the pending request comes back, simulate the same activity on this request\n          match.on('success', handler.success);\n          match.on('error', handler.error);\n          \n        }\n      });\n    });\n```\n\nPrevent the error callback if the request is aborted\n\n```\n    Backbone.xhrEvents.on('xhr', function(context) {\n      context.on('abort', function() {\n        context.preventDefault().complete('abort');\n      });\n    });\n```","title":"General Usage Examples","sections":[]},{"body":"Almost all event names and model/global attributes can be overridden to suit your needs.\n\n* ***Backbone.xhrCompleteEventName***: the event triggered on a model/collection when all XHR activity has completed (default: ```xhr:complete```)\n* ***Backbone.xhrModelLoadingAttribute***: the model attribute which can be used to return an array of all current XHR request events and determind if the model/collection has current XHR activity (default: ```xhrActivity```)\n* ***Backbone.xhrEventName***: the event triggered on models/collection and the global bus to signal an XHR request (default: ```xhr```)\n* ***Backbone.xhrGlobalAttribute***: global event handler attribute name (on Backbone) used to subscribe to all model xhr events (default: ```xhrEvents```)","title":"Overrides","sections":[]},{"body":"The RequestContext is the object provided as the only parameter with the ```xhr``` events.  It is the context providing the ability to bind to the request lifecycle events.\n\n```\n    model.on('xhr', function(requestContext) { ... });\n```\n\nsee the [RequestContext events](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fapi%2FEvents) and [RequestContext functions and attributes](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fpackage%2FRequestContext)","title":"RequestContext","sections":[]},{"body":"The RequestHandler is the response from [requestContext.preventDefault()](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestContext%2FpreventDefault).  When ```preventDefault``` is called, the request lifecycle is halted.  When this happens, you *must* either call [success](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestHandler%2Fsuccess), [error](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestHandler%2Ferror), or [complete](#link/l%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestHandler%2Fcomplete).","title":"RequestHandler","sections":[]}],"api":{"Events":{"methods":{},"packages":{"RequestContext events":{"overview":"","methods":{"\"before-send\"":{"profiles":["xhr, settings, requestContext"],"params":{},"summary":"* ***xhr***: the XMLHTTPRequest\n* ***settings***: the actual jquery settings object sent by Backbone.sync\n* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.","dependsOn":[],"overview":"Triggered after Backbone.sync has been executed and an XHR object has been created (but before execution).\n\n```\n    model.on('xhr', function(requestContext) {\n      requestContext.on('before-send', function(xhr, settings, requestContext) {\n        ...\n      });\n    });\n```"},"\"after-send\"":{"profiles":["{jquery callback params}, responseType, requestContext"],"params":{},"summary":"* ***jqueryParams***: if success ```data, status, xhr```;  if error ```xhr, status, error```; [more details](#link/http%3A%2F%2Fapi.jquery.com%2Fjquery.ajax%2F)\n* ***responseType***: if success ```success```;  if error ```error```;\n* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.","dependsOn":[],"overview":"Triggered after the [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) has completed and before the Backbone.sync callback has been executed.  This can be used to override the response data or alter the default behavior of the response.\n\n```\n    model.on('xhr', function(requestContext) {\n      requestContext.on('after-send', function(p1, p2, p3, responseType, requestContext) {\n\n        if (responseType === 'success') {\n          var data = p1, status = p2, xhr = p3;\n          // we can change the response payload using requestContext.data\n          requestContext.data = {foo: 'bar'};\n\n        } else if (responseType === 'error') {\n          var xhr = p1, status = p2, error = p3;\n          // or we can completely change the default behavior and make an error look like a success\n          requestContext.preventDefault().success({foo: 'bar'}, 'success', xhr);\n        }\n      });\n    });\n```"},"\"success\"":{"profiles":["data, status, xhr, requestContext"],"params":{},"summary":"* ***data***: the response payload\n* ***status***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest) text status\n* ***xhr***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest)\n* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.","dependsOn":[],"overview":"Triggered after the success callback handler has executed.  This can be used to perform actions after the model has been updated.\n\n```\n    model.on('xhr', function(requestContext) {\n      requestContext.on('success', function(data, status, xhr, requestContext) {\n        // the updated mode/collection is requestContext.model\n      });\n    });\n```"},"\"error\"":{"profiles":["xhr, status, error, requestContext"],"params":{},"summary":"* ***xhr***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest)\n* ***status***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest) text status\n* ***error***: the error thrown\n* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.","dependsOn":[],"overview":"Triggered after the error callback handler has executed.  This can be used to perform actions when an error scenario has occurred.\n\n```\n    model.on('xhr', function(requestContext) {\n      requestContext.on('error', function(xhr, status, error, requestContext) {\n        ...\n      });\n    });\n```"},"\"complete\"":{"profiles":["responseType, requestContext"],"params":{},"summary":"* ***responseType***: if success ```success```; if error ```error```\n* ***requestContext***: the same object passed to the ```xhr``` event.  It is provided in case the function does not have access to the closure scope.","dependsOn":[],"overview":"```\n    model.on('xhr', function(requestContext) {\n      requestContext.on('complete', function(type, requestContext) {\n        ...\n      });\n    });\n```"}}},"Backbone.Model, Backbone.Collection & Backbone.xhrEvents":{"overview":"","methods":{"\"xhr\"":{"profiles":["requestContext, method"],"params":{},"summary":"* ***method***: the Backbone.sync method (by default, ```read```, ```update```, or ```delete```)\n* ***requestContext***: the [RequestContext](#link/%23section%2FRequest%2520Context)","dependsOn":[],"overview":"This event is triggered on any model or collection when *any* XHR activity is initiated from that model / collection.  It is also triggered on ```Backbone.xhrEvents``` when XHR activity is initiated from *any* model / collection.\n\n```\n    model.on('xhr', function(requestContext, method) {\n      // the method is also available as requestContext.method\n\n      // for any fetch operations\n      if (method === 'read') {\n        ...\n      }\n    });\n```\n\nor, to watch XHR activity from *any* model or collection\n\n```\n    Backbone.xhrEvents.on('xhr', function(requestContext, method) {\n      var theModel = requestContext.model;\n      ...\n    });\n```"},"\"xhr:{method}\"":{"profiles":["requestContext"],"params":{},"summary":"* ***method***: the Backbone sync method (by default, ```read```, ```update```, or ```delete```)\n* ***requestContext***: the [request context](#link/%23section%2FRequest%2520Context)","dependsOn":[],"overview":"Emitted when only XHR activity matching the method in the event name occurs\n\n```\n    model.on('xhr:read', function(requestContext) {\n      // this is only triggered on model.fetch()\n    });\n```\n\nor, to watch XHR activity from *any* model or collection\n\n```\n    Backbone.xhrEvents.on('xhr:read', function(method, model, context) {\n      ...\n    });\n```"},"\"xhr:complete\"":{"profiles":["requestContext"],"params":{},"summary":"* ***context***: the context representing the *last* XHR activity (see [RequestContext](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fsection%2FRequestContext))","dependsOn":[],"overview":"Triggered on a model or collection (not Backbone.xhrActivity) when any XHR activity has completed *and* there is no more concurrent XHR activity"}}}}},"API":{"methods":{},"packages":{"RequestContext":{"overview":"The RequestContext is the object provided as the only parameter with the ```xhr``` events.  It is the context providing the ability to bind to the request lifecycle events.\n\n```\n    model.on('xhr', function(requestContext) { ... });\n```\n\nalso refer to the [RequestContext events](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fpackage%2FRequestContext%2520events)","methods":{"preventDefault":{"profiles":[""],"params":{},"summary":"Prevent the default execution of the request lifecycle.  A ResponseHandler is returned and either the ```success```, ```error``` or ```complete``` method *must* be called.","dependsOn":[],"overview":"The following example demonstrates preventing an [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) from being created and simulating a success response.\n\n```\n    model.on('xhr', function(requestContext) {\n      var responseHandler = requestContext.stopPropogation();\n      setTimeout(function() {\n        // this can be used asynchronously\n        responseHandler.success({foo: 'bar'}, 'success');\n      }, 100);\n    });\n```"},"abort":{"profiles":[""],"params":{},"summary":"Abort the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest) and trigger the ```abort``` event.","dependsOn":[],"overview":"```\n    model.on('xhr', function(requestContext) {\n      // if we need to abort for some reason\n      requestContext.abort();\n    });\n```"},"model":{"profiles":[],"params":{},"summary":"The model or collection that initiated the request","dependsOn":[],"overview":"```\n    var myModel = ...;\n    myModel.on('xhr', function(requestContext) {\n      requestContext.model === myModel;\n    });\n```"},"method":{"profiles":[],"params":{},"summary":"The Backbone.sync method.  This is either ```read```, ```update```, or ```delete``` if the default methods are used.","dependsOn":[],"overview":"##### options\n\nThe options provided to the Backbone.ajax method.\n\n```\n  var myModel = ...;\n  myModel.on('xhr', function(requestContext) {\n    requestContext.options === {foo: 'bar'};\n  });\n  myModel.fetch({foo: 'bar'});\n```"},"xhr":{"profiles":[],"params":{},"summary":"The [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest)","dependsOn":[],"overview":"```\n  model.on('xhr', function(requestContext) {\n    // this is a valid object on or after the \"before-send\" event\n    requestContext.xhr;\n  });\n```"}}},"RequestHandler":{"overview":"The RequestHandler is the response from [requestContext.preventDefault()](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestContext%2FpreventDefault).  When ```preventDefault``` is called, the request lifecycle is halted.  When this happens, you *must* either call [success](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestHandler%2Fsuccess), [error](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestHandler%2Ferror), or [complete](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fmethod%2FRequestHandler%2Fcomplete).","methods":{"success":{"profiles":["data, status, xhr"],"params":{},"summary":"* ***data***: the response payload\n* ***status***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest) text status\n* ***xhr***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest)","dependsOn":[],"overview":"Initiate a success response if the [preventDefault](#project/jhudson8/backbone-xhr-events/method/RequestContext/preventDefault) method was called.\n\n```\n    model.on('xhr', function(requestContext) {\n      var requestHandler = requestContext.preventDefault();\n      requestHandler.success({foo: 'bar'}, 'success', undefined);\n    });\n```"},"error":{"profiles":["xhr, status, error"],"params":{},"summary":"* ***xhr***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest)\n* ***status***: the [XMLHttpRequest](#link/https%3A%2F%2Fdeveloper.mozilla.org%2Fen-US%2Fdocs%2FWeb%2FAPI%2FXMLHttpRequest) text status\n* ***error***: the error thrown","dependsOn":[],"overview":"Initiate an error response if the [preventDefault](#project/jhudson8/backbone-xhr-events/method/RequestContext/preventDefault) method was called.\n\n```\n    model.on('xhr', function(requestContext) {\n      var requestHandler = requestContext.preventDefault();\n      requestHandler.error(undefined, 'error', 'Not Found');\n    });\n```"},"complete":{"profiles":["type"],"params":{},"summary":"* ***type***: the completion type; normally ```success``` or ```error``` but can technically be anything.  This will be the value passed to the ```complete``` event triggered from the [RequestContext](#link/%23project%2Fjhudson8%2Fbackbone-xhr-events%2Fsection%2FRequestContext).","dependsOn":[],"overview":"Using this method will bypass any success / error handlers bound to the XHR request but any completion handlers will still be executed.\n\n```\n    model.on('xhr', function(requestContext) {\n      var requestHandler = requestContext.preventDefault();\n      requestHandler.complete('abort');\n    });\n```"}}},"Backbone.Model / Backbone.Collection":{"overview":"","methods":{"whenFetched":{"profiles":["successCallback, errorCallback"],"params":{"successCallback":"function to be called when the model/collection has been fetched","errorCallback":"function to be called when if model/collection fetch failed"},"summary":"Initiate a fetch if not already fetching or fetched.  Once the model/collection has been fetch, execute the appropriate callback.","dependsOn":[],"overview":"```\n    myModel.whenFetched(function(model) {\n        // executed when model is fetched (model and myModel are the same)\n      },\n      function(model) {\n        // executed if the model fetch fails\n      }\n    );\n```"},"xhrActivity":{"profiles":[],"params":{},"summary":"This is a Model or Collection attribute that can be evaluated as a truthy if there is any current XHR activity.","dependsOn":[],"overview":"```\n    var isCurrentXhrActivity = !!model.xhrActivity;\n```"},"hasBeenFetched":{"profiles":[],"params":{},"summary":"This will be true if the Model or Collection has previously been fetched with a sucessful response.  If the Model or Collection is cleared, this value will be reset to undefined.","dependsOn":[],"overview":"```\n    var isTheModelPopulated = model.hasBeenFetched;\n```"},"hadFetchError":{"profiles":[],"params":{},"summary":"This will be true if the Model or Collection encountered an XHR error when performing a fetch.  It will reset to false upon a successful fetch operation.","dependsOn":[],"overview":"```\n    var wasThereAFetchError = model.hadFetchError;\n```"}}},"Backbone":{"overview":"","methods":{"forwardXHREvents":{"profiles":["sourceModel, destModel[, method]) or (sourceModel, destModel, autoStopFunc"],"params":{},"summary":"* ***sourceModel***: the originator model of the XHR events\n* ***destModel***: the receiver or proxy of the source model XHR events\n* ***method***: the optional Backbone.sync method to filter the forwarded events\n* ***autoStopFunc***: callback function that, if provided, will stop the forwarding after the function completes execution","dependsOn":[],"overview":"Forward XHR events that originate in ```sourceModel``` to ```destModel```.  These events will also be emitted in ```sourceModel``` as well.\n\nThis can be useful if you have a composite model containing sub-models and want to aggregate xhr activity to the composite model.\n\n```\n    var CompositeModel = Backbone.Model.extend({\n      initialize: function() {\n        Backbone.Model.prototype.initialize.apply(this, arguments);\n\n        // when model1 or model2 have xhr activity, \"this\" will expose the same xhr events\n        this.model1 = new Backbone.Model();\n        Backbone.forwardXHREvents(this.model1, this);\n\n        this.model2 = new Backbone.Model();\n        Backbone.forwardXHREvents(this.model2, this);\n      }\n    });\n```"},"stopXHRForwarding":{"profiles":["sourceModel, destModel[, method]"],"params":{"sourceModel":"the originator model of the XHR events","destModel":"the receiver or proxy of the source model XHR events","method":"***optional*** Backbone.sync method to filter the forwarded events"},"summary":"Stop forwarding XHR events.  This must match a previous ```forwardXHREvents``` call.","dependsOn":[],"overview":"```\n    Backbone.forwardXHREvents(sourceModel, destModel, 'read');\n```"}}}}}}});

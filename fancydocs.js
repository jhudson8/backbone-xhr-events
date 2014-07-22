{"title":"backbone-async-event","summary":"Give external entities a way to monitor ajax activity on your [backbone.js](#link/http%3A%2F%2Fbackbonejs.org%2F).Collections and [backbone.js](#link/http%3A%2F%2Fbackbonejs.org%2F).Models.\n\nWith standard Backbone, there is no way to tell if a model or collection is currently performing a fetch, save or destroy (unless you provided callback options when that operation was called).\n\nTo provide this functionality in a decoupled way, we add events that are triggered on your Backbone.Model or Backbone.Collection signaling this ajax activity, giving an access point to listen for the response to occur.\n\nThis is used, for example, in the [jhudson8/react-backbone](#link/https%3A%2F%2Fgithub.com%2Fjhudson8%2Freact-backbone) project to allow UI components to know when their associated models are doing something that should require a loading indicator to be displayed.\n\n[View the fancydocs](#link/http%3A%2F%2Fjhudson8.github.io%2Ffancydocs%2Findex.html%23project%2Fjhudson8%2Freact-backbone)","api":{"Events":{"methods":{},"packages":{"Model / Collection Events":{"overview":"","methods":{"async":{"profiles":["eventName, lifecycleEvents, options"],"params":{"eventName":"the Backbone sync event name (```read```, ```update``` or ```delete```)","lifecycleEvents":"a Backbone.Events object used to bind to specific request ```success```, ```error``` and ```complete``` events","options":"the fetch/save/destroy options"},"summary":"The follwing event names may be bound on ```lifecycleEvents```","dependsOn":[],"overview":"* ***success***: (model, options); triggered when/if the ajax request was successful\n* ***error***: (model, errorType, thrownError, options); triggered when/if the ajax request failed\n* ***complete***; ({\"error\"|\"success\"}, model[, errorType, thrownError], options); triggered on either success or error\n\n##### Examples\n```\n    model.on('async', function(eventName, lifecycleEvents) {\n      lifecycleEvents.on('success', function(model, options) {\n        // the operation was successful and the updated model is provided as a parameter\n      });\n      lifecycleEvents.on('error', function(model, errorType, error, options) {\n        // the operation failed and the parameters are proxied straight from the $.ajax error call\n      });\n      lifecycleEvents.on('complete', function(type, model) {\n        // the operation was successful or errored and the payload will either look like a success or error payload\n        // type is either \"success\" or \"error\"\n      });\n    });\n```"},"async:{eventName}":{"profiles":["lifecycleEvents, options"],"params":{"eventName":"the Backbone sync event name (```read```, ```update``` or ```delete```)","lifecycleEvents":"a Backbone.Events object used to bind to specific request ```success```, ```error``` and ```complete``` events","options":"the fetch/save/destroy options"},"summary":"Same as ```async``` but is only triggered for the specified event name","dependsOn":[],"overview":"##### Example\n```\n    model.on('async:read', function(lifecycleEvents) {\n      // notice that the event name is not provided to this function\n    });\n```"}}}}},"API":{"methods":{},"packages":{"Model / Collection API":{"overview":"","methods":{"isLoading":{"profiles":["()"],"params":{},"summary":"return a truthy (array of async events) if the Model/Collection has any current async activity","dependsOn":[],"overview":"##### Example\n```\n    model.fetch();\n    // or\n    model.save();\n    // or\n    model.destroy();\n    // model.isLoading() == true\n```"},"hasBeenFetched":{"profiles":["()"],"params":{},"summary":"return true if the Model/Collection has previously been fetched (and the fetch response occured)","dependsOn":[],"overview":"##### Example\n```\n    model.fetch()\n    // model.hasBeenFetched() === false;\n    // now, once the model fetch success callback has executed\n    // model.hasBeenFetched() === true;\n```"},"hadFetchError":{"profiles":["()"],"params":{},"summary":"return true if the Model/Collection has a fetch error and has had no successful fetch since the error.","dependsOn":[],"overview":""}}}}}},"sections":[{"body":"* Browser: backbone-async-event.js/backbone-async-event.min.js; *after* [backbone.js](#link/http%3A%2F%2Fbackbonejs.org%2F)\n* CommonJS: ```require('backbone-async-event')(require('backbone'));```","title":"Installation","sections":[]},{"body":"The async event name can be overridden by setting the ```event``` attribute on the request options but otherwise it will be:\n\n * ***fetch***: read\n * ***save***: update\n * ***destroy***: delete\n\nTo override the event name, use the ```event``` fetch option.\n```\n    model.fetch({event: 'aDifferentAsyncEventName'})\n```\n\nor call Backbone.sync directly\n```\n    Backbone.sync('aDifferentAsyncEventName', model, options);\n```","title":"Event Names","sections":[]},{"body":"Aside from async events being triggered on the model, a global event handler can be used to capture all async events for all models.  The event signature is the same for the model async events except that the first (or second) parameter is the model that the async event initiated from.\n```\n    Backbone.asyncHandler = myGlobalAsyncHandler;\n    // capture all async events for all models\n    myGlobalAsyncHandler.on('async', function(asyncEventName, model, lifecycleEvents, options) {\n      ...\n    });\n    // capture only \"read\" async events for all models\n    myGlobalAsyncHandler.on('async:read', function(model, lifecycleEvents, options) {\n      ...\n    });\n```\n\nAlternatively, ```Backbone.async``` is already available and will fire all events that a global event handler would.\n```\n    Backbone.async.on('async:read', function(model, lifecycleEvents, options) {\n      ...\n    });\n```","title":"Global Event Handler","sections":[]},{"body":"To incercept the ajax request and override the response (for example to incorporate a client response cache), the ```intercept``` attribute can be set on the sync options data with a function which is expected to either call options.success or options.error with a simulated response.\n```\n    App.on('async', function(event, model, lifecycle, options) {\n      options.intercept = function() {\n        options.success(...);\n      }\n    });\n```","title":"Ajax Response Interception","sections":[]}]}

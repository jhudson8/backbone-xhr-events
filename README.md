backbone-async-event
====================
Give external entities a way to monitor ajax activity on your [backbone.js](http://backbonejs.org/).Collections and [backbone.js](http://backbonejs.org/).Models.

With standard Backbone, there is no way to tell if a model or collection is currently performing a fetch, save or destroy (unless you provided callback options when that operation was called).

To provide this functionality in a decoupled way, we add events that are triggered on your Backbone.Model or Backbone.Collection signaling this ajax activity, giving an access point to listen for the response to occur.

This is used, for example, in the [jhudson8/react-backbone](https://github.com/jhudson8/react-backbone) project to allow UI components to know when their associated models are doing something that should require a loading indicator to be displayed.

[View the fancydocs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone)


API: Events
--------

### Model / Collection Events

#### async (eventName, lifecycleEvents, options)
* ***eventName***: the Backbone sync event name (```read```, ```update``` or ```delete```)
* ***lifecycleEvents***: a Backbone.Events object used to bind to specific request ```success```, ```error``` and ```complete``` events
* ***options***: the fetch/save/destroy options

The follwing event names may be bound on ```lifecycleEvents```

* ***success***: (model, options); triggered when/if the ajax request was successful
* ***error***: (model, errorType, thrownError, options); triggered when/if the ajax request failed
* ***complete***; ({"error"|"success"}, model[, errorType, thrownError], options); triggered on either success or error

##### Examples
```
    model.on('async', function(eventName, lifecycleEvents) {
      lifecycleEvents.on('success', function(model, options) {
        // the operation was successful and the updated model is provided as a parameter
      });
      lifecycleEvents.on('error', function(model, errorType, error, options) {
        // the operation failed and the parameters are proxied straight from the $.ajax error call
      });
      lifecycleEvents.on('complete', function(type, model) {
        // the operation was successful or errored and the payload will either look like a success or error payload
        // type is either "success" or "error"
      });
    });
```


#### async:{eventName} (lifecycleEvents, options)
* ***eventName***: the Backbone sync event name (```read```, ```update``` or ```delete```)
* ***lifecycleEvents***: a Backbone.Events object used to bind to specific request ```success```, ```error``` and ```complete``` events
* ***options***: the fetch/save/destroy options

Same as ```async``` but is only triggered for the specified event name

##### Example
```
    model.on('async:read', function(lifecycleEvents) {
      // notice that the event name is not provided to this function
    });
```


API
--------

### Model / Collection API

#### isLoading ()
return a truthy (array of async events) if the Model/Collection has any current async activity

##### Example
```
    model.fetch();
    // or
    model.save();
    // or
    model.destroy();
    // model.isLoading() == true
```

#### hasBeenFetched ()
return true if the Model/Collection has previously been fetched (and the fetch response occured)

##### Example
```
    model.fetch()
    // model.hasBeenFetched() === false;
    // now, once the model fetch success callback has executed
    // model.hasBeenFetched() === true;
```

#### hadFetchError ()
return true if the Model/Collection has a fetch error and has had no successful fetch since the error.


Sections
----------

### Installation
* Browser: backbone-async-event.js/backbone-async-event.min.js; *after* [backbone.js](http://backbonejs.org/)
* CommonJS: ```require('backbone-async-event')(require('backbone'));```


### Event Names
The async event name can be overridden by setting the ```event``` attribute on the request options but otherwise it will be:

 * ***fetch***: read
 * ***save***: update
 * ***destroy***: delete

To override the event name, use the ```event``` fetch option.
```
    model.fetch({event: 'aDifferentAsyncEventName'})
```

or call Backbone.sync directly
```
    Backbone.sync('aDifferentAsyncEventName', model, options);
```


### Global Event Handler
Aside from async events being triggered on the model, a global event handler can be used to capture all async events for all models.  The event signature is the same for the model async events except that the first (or second) parameter is the model that the async event initiated from.
```
    Backbone.asyncHandler = myGlobalAsyncHandler;
    // capture all async events for all models
    myGlobalAsyncHandler.on('async', function(asyncEventName, model, lifecycleEvents, options) {
      ...
    });
    // capture only "read" async events for all models
    myGlobalAsyncHandler.on('async:read', function(model, lifecycleEvents, options) {
      ...
    });
```

Alternatively, ```Backbone.async``` is already available and will fire all events that a global event handler would.
```
    Backbone.async.on('async:read', function(model, lifecycleEvents, options) {
      ...
    });
```


### Ajax Response Interception
To incercept the ajax request and override the response (for example to incorporate a client response cache), the ```intercept``` attribute can be set on the sync options data with a function which is expected to either call options.success or options.error with a simulated response.
```
    App.on('async', function(event, model, lifecycle, options) {
      options.intercept = function() {
        options.success(...);
      }
    });
```

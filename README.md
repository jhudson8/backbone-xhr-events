backbone-xhr-events
====================
Do more than what the default [Backbone](http://http://backbonejs.org/) Model/Collection ```request``` event does for you.  The primary benefits are

* Provide robust lifecycle events (```before-send```, ```after-send```, ```success```, ```error```, ```complete```)
* Emit type specific XHR events to allow for focused binding
* Give ability to see if a model currently has any pending XHR activity
* Provide a global event bus to bind to all Model/Collection XHR activity
* Allow requests to be intercepted to, for example, return cached content
* Add ability to intercept and override response data before it is returned to the Model/Collection
* Provide event forwarding capabilities so other objects can simulate XHR activity to match another Model/Collection
* Make all event names and additional attributes overrideable to meet the needs of your particular project
* Give external entities a way to observe ajax activity on your Collections and Models


[View the fancydocs](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/backbone-xhr-events)


Sections
--------
### General Usage Examples
Bind to a model to listen to all XHR activity
```
// method is "read", "save", or "delete" or custom (Backbone.sync method)
// context is a Backbone.Events to bind to XHR lifecycle events
model.on('xhr', function(method, context) {
  // 'xhr' event is sent before core Backbone.sync is executed

  // xhr = the XMLHttpRequest; settings = $.ajax settings
  context.on('before-send', function(xhr, settings, context) {
    // after core Backbone.sync has executed $.ajax and an XMLHttpRequest has been created
    // but before the XHR has been executed = $.ajax settings
  });

  context.on('after-send', function(p1, p2, p3, responseType {
    // after the XHR has returned but before Backbone.sync has handled the response

    if (responseType === 'success') {
      // additional params are (data, status, xhr, context);
    }
    if (responseType === 'error') {
      // additional params are (xhr, type, error)
    }

  });

  context.on('success', function(context) {
    // this will be called after the XHR succeeds
  });

  context.on('error', function(xhr, type, error, context) {
    // this will be called if the XHR fails
  });

  context.on('complete', function(type, {type specific args}) {
    // type will either be "success" or "error" and the type specific args are the same as what is provided to the respective events
    // this will be called when the XHR succeeds or fails
  });
});
```

Bind to a model to listen to only fetches
```
model.on('xhr:read', function(context) {
  ...
});
```

Override the XHR payload or cache it
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  context.on('after-send', function(data, status, xhr, responseType, context) {
    if (responseType === 'success') {
      // wrap the response as a "response" attribute
      context.data = { response: data };
      // cache the response
      if (method === 'read') {
        _cacheFetchResponse(JSON.stringify(data), context.options.url);
      }
    }
  });
});
```

Intercept a request and return a cached payload
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  if (context.method === 'read') {
    var cachedResult = _getFetchCache(context.options.url);
    if (cachedResult) {
      context.preventDefault = true;
      options.success(JSON.parse(cachedResult), 'success');
    }
  }
});
```

Make a successful XHR look like a failure
```
model.on('xhr', function(method, context) {
  context.on('after-send', function(data, status, xhr, responseType) {
    if (!context.preventDefault) {
      // we don't want to call success/error callback more than once
      context.preventDefault = true;

      // provide the parameters that you would have wanted coming back directly from the $.ajax callback
      context.options.error(...);
    }
  });
});
```

Set a default timeout on all XHR activity
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  context.options.timeout = 3000;
});
```

Determine fetch status of a model
```
model.fetch();
!!model.xhrActivity === true;

// model fetch complete now
!!model.xhrActivity === false;

// if the model fetch succeeded
model.hasBeenFetched === true;
model.hadFetchError === false;

// if the model fetch has failed...
model.hadFetchError === true;
model.hasBeenFetched === false;
```

Forward xhr events to another model
(source model will continue to emit xhr events as well)
```
// forward all events
Backbone.forwardXhrEvents(sourceModel, receiverModel);
// stop forwarding all events
Backbone.stopXhrForwarding(sourceModel, receiverModel);

// forward events for a specific Backbone.sync method
Backbone.forwardXhrEvents(sourceModel, receiverModel, 'read');
// stop forwarding all events
Backbone.stopXhrForwarding(sourceModel, receiverModel, 'read');

// forward events *only while the callback function is executed*
Backbone.forwardXhrEvents(sourceModel, receiverModel, function() {
  // any XHR activity that sourceModel executes will be emitted by
  // receiverModel as well
});
```

Prevent duplicate concurrent submission of any XHR request
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  context.on('before-send', function(xhr, settings) {
    // we need to use before-send because Backbone.sync creates settings.data

    // see if any current XHR activity matches this request
    var match = _.find(model.xhrActivity, function(_context) {
      return context.options.url === _context.options.url
          && method === _context.method
          && _.isEqual(settings.data, _context.settings.data);
    });
    if (match) {
      // when the pending request comes back, simulate the same activity on this request
      match.on('after-send', context.options.success);
      match.on('error', context.options.error);
      context.preventDefault = true;
    }
  });
});
```

Prevent the error callback if the request is aborted
```
Backbone.xhrEvents.on('xhr', function(method, model, context) {
  context.on('after-send', function(xhr, errorType, error, responseType) {
    if (errorType === 'abort') {
      context.preventDefault = true;
    }
  });
});
```

### Request Context
Every event has a "context" parameter.  This object is an event emitter as well as an object used for request scoped attributes.

#### Context Lifecycle Events
All XHR events provide a ```context``` as a parameter.  This is an object extending Backbone.Events and is used to bind to the XHR lifecycle events including

* ***before-send***: after Backbone.sync has been executed and an XHR object has been created (but before execution), set context.preventDefault to stop processing.  Unlike other events, the signature here is (xhr, settings, context) where settings is the actual jquery settings object sent by Backbone.sync.
* ***after-send***: ({jquery error or success callback params (data, status, xhr) or (xhr, type, error)}, responseType, context) before the model has handled the response
* ***success***: (context) when the XHR has completed sucessfully
* ***error***: (xhr, type, error, context) when the XHR has failed
* ***complete***: ('success|error', {success or error specific params}) when the XHR has either failed or succeeded

#### Context Attributes
The following read-only context attributes are applicable

* ***options***: the Backbone.ajax options
* ***settings***: available on "before-send" event; the jquery settings object provided by Backbone.sync
* ***xhr***: the actual XMLHttpRequest
* ***method***: the Backbone.sync method
* ***model***: the associated model

These attributes can be set on the context to alter lifecycle behavior

* ***preventDefault***: set this value as true at any stage to prevent further processing.  In this case, you must context.options callbacks manually or they will not be called at all.
* ***data***: set this value within an "after-send" event handler to override the standard response data

#### Context methods
* ***abort***: if after "before-send" lifecycle this will call ```abort``` on the source ```XMLHttpRequest```

### Overrides
Almost all event names and model/global attributes can be overridden to suit your needs.

* ***Backbone.xhrCompleteEventName***: the event triggered on a model/collection when all XHR activity has completed (default: ```xhr:complete```)
* ***Backbone.xhrModelLoadingAttribute***: the model attribute which can be used to return an array of all current XHR request events and determind if the model/collection has current XHR activity (default: ```xhrActivity```)
* ***Backbone.xhrEventName***: the event triggered on models/collection and the global bus to signal an XHR request (default: ```xhr```)
* ***Backbone.xhrGlobalAttribute***: global event handler attribute name (on Backbone) used to subscribe to all model xhr events (default: ```xhrEvents```)


API: Events
-----------
### Model / Collection events

#### "xhr" (method, context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***context***: the request context (see "Request Context" section)

Emitted when any XHR activity occurs

```
model.on('xhr', function(method, context) {
  // method is "read", "save", or "delete" or custom (Backbone.sync method)
  // context is a Backbone.Events to bind to XHR lifecycle events

  context.on('complete', function(type, {type specific args}) {
    // type will either be "success" or "error" and the type specific args are the same as what is provided to the respective events
    // this will be called when the XHR succeeds or fails
  });
  context.on('success', function(model) {
    // this will be called after the XHR succeeds
  });
  context.on('error', function(model, xhr, type, error) {
    // this will be called if the XHR fails
  });
});
```

#### "xhr:{method}" (context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***context***: the request context (see "Request Context" section)

Emitted when only XHR activity matching the method in the event name occurs

```
model.on('xhr:read', function(method, context) {
  ...
});
```

#### "xhr:complete" ()

Emitted when any XHR activity has completed and there is no more concurrent XHR activity


### Backbone.xhrEvents (global events)

#### "xhr" (method, model, context)
* ***method***: the Backbone sync method (by default, "read", "update", or "delete")
* ***model***: the associated model
* ***context***: the request context (see "Request Context" section)

Emitted when any XHR activity occurs

#### "xhr:{method}" (model, context)
* ***model***: the associated model
* ***context***: the request context (see "Request Context" section)

Emitted when only XHR activity matching the method in the event name occurs


API
-----------
### Backbone.Model / Backbone.Collection

#### whenFetched (successCallback, errorCallback)
* ***successCallback***: function to be called when the model/collection has been fetched
* ***errorCallback***: function to be called when if model/collection fetch failed

Initiate a fetch if not already fetching or fetched.  Once the model/collection has been fetch, execute the appropriate callback.

```
myModel.whenFetched(function(model) {
    // executed when model is fetched (model and myModel are the same)
  },
  function(model) {
    // executed if the model fetch fails
  }
);
```


### Backbone

#### forwardXhrEvents (sourceModel, destModel[, method]) or (sourceModel, destModel, autoStopFunc)
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events
* ***autoStopFunc***: callback function that, if provided, will stop the forwarding after the function completes execution

Forward XHR events that originate in ```sourceModel``` to ```destModel```.  These events will also be emitted in ```sourceModel``` as well.

This can be useful if you have a composite model containing sub-models and want to aggregate xhr activity to the composite model.

```
var CompositeModel = Backbone.Model.extend({
  initialize: function() {
    // when model1 or model2 have xhr activity, "this" will expose the same xhr events
    Backbone.Model.prototype.initialize.apply(this, arguments);
    this.model1 = new Backbone.Model();
    Backbone.forwardXhrEvents(this.model1, this);
    this.model2 = new Backbone.Model();
    Backbone.forwardXhrEvents(this.model2, this);
  }
});
```

#### stopXhrForwarding (sourceModel, destModel[, method])
* ***sourceModel***: the originator model of the XHR events
* ***destModel***: the receiver or proxy of the source model XHR events
* ***method***: the optional Backbone.sync method to filter the forwarded events

Stop forwarding XHR events.  This must match a previous ```forwardXhrEvents``` call.

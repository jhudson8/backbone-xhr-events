# Release Notes

## Development

[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v1.0.1...master)

## v1.0.1 - May 9th, 2015
- bug fix: in-browser source include loading - 11d4a00


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v1.0.0...v1.0.1)

## v1.0.0 - April 17th, 2015
All dependencies are peer dependencies now and you no longer provide Backbone and underscore when initializing backbone-xhr-events.

The initialization is now just

```javascript
require('backbone-xhr-events');
```

[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.12.0...v1.0.0)

## v0.12.0 - March 19th, 2015
- rename "whenFetched" to "ensureFetched" - f88cabf


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.11.2...v0.12.0)

## v0.11.2 - February 19th, 2015
- don't eager set options.url (it can be accessed with "before-send" event) - d3de6a8

Compatibility notes:
This should really be a minor release but I'm not doing one since I just pushed a minor release this morning.  I am no longer forcing options.url to have a value and letting Backbone.sync work naturally.  The only real difference to you is that ```options.url``` is only accessable if you provided ```url``` as an option when making the xhr call (like ```model.fetch({url: '...'})```.

If you want to get the actual URL, you will need to access the ajax settings (what Backbone.sync provides to $.ajax) which you get as a parameter with the ```before-send``` event.  So, to get the URL it would look like this:

```
    model.on('xhr', function(requestContext) {
      requestContext.on('before-send', function(xhr, settings) {
        console.log('the URL is ' + settings.url);
      });
    });
```

[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.11.1...v0.11.2)

## v0.11.1 - February 19th, 2015
- bug fix: ensure RequestContext is the first param for xhr & xhr:{method} events - c7499ee


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.11.0...v0.11.1)

## v0.11.0 - February 18th, 2015
Pretty major changes in this release

* The RequestContext object is now the last parameter on all of the lifecycle methods (where it was the first)
* preventDefault functionality has been completely overhauled and is very different - see docs for more details but preventDefault is now a method to be called.  The response from this method has 3 methods (success/error/complete) and one of these methods *must* be called to complete the response.

The docs have changed quite a bit for this release so check them out for the updated API and some additional usage examples


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.10.0...v0.11.0)

## v0.10.0 - February 15th, 2015
- make preventDefault a function rather than a boolean value to be set on the context
- add a "finish" function attribute on context which *must* be called if preventDefault is called in "after-send"

```
      context.on('after-send', function(data, status, xhr, responseType) {
        context.preventDefault();
        context.finish({
          // indicate that the xhr callbacks will be handled manually
          preventCallbacks: true,
	  // indicate that the lifecycle events will be handled manually
	  preventEvents: true
        });
      });
```

See API docs for added examples which demonstrate how this can be used


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.9.5...v0.10.0)

## v0.9.5 - December 11th, 2014
- code cleanup - 636e162


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.9.4...v0.9.5)

## v0.9.4 - December 10th, 2014
no functional code changes.  There is just an additional comment that is used to create react-backbone/with-deps.js


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.9.3...v0.9.4)

## v0.9.3 - December 7th, 2014
- API change forwardXhrEvents -> forwardXHREvents and stopXhrForwarding -> stopXHRForwarding - 9d0d67b


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.9.2...v0.9.3)

## v0.9.2 - December 4th, 2014
- fetch bug fix - eb10cd0


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.9.1...v0.9.2)

## v0.9.1 - December 2nd, 2014
- allow fetch state flags to be reset if the collection has been reset or the model has been cleared - e4db226


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.9.0...v0.9.1)

## v0.9.0 - November 26th, 2014
- for AMD, you must execute the function with params (see README AMD install instructions) - da7c5d9
```
require(
  ['backbone', 'underscore', 'backbone-xhr-events'], function(Backbone, _, backboneXhrEvents) {
  backboneXhrEvents(Backbone, _); 
});
```
The underscore impl must be provided to the CommonJS function (see README CommonJS install instructions)
```
require('backbone-xhr-events')(require('backbone'), require('underscore'));
```


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.8.2...v0.9.0)

## v0.8.2 - November 25th, 2014
- update README - d0a7dea
- bug fix: ensure that the xhr activity state is correct even if a success/error callback pukes - e8c1d97


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.8.1...v0.8.2)

## v0.8.1 - November 6th, 2014
- add responseType to 'after-send' event - f60acdf

Compatibility notes:
This should really be a minor release but I just performed a minor release and I don't believe anyone will be using this event yet

[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.8.0...v0.8.1)

## v0.8.0 - November 4th, 2014
- add abort context method - bcd77bd
- add "abort" context method - 0d95e6a
- change "data" event to "after-send" and "request" context attribute to "data" - 5cb80b5


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.7.1...v0.8.0)

## v0.7.1 - November 4th, 2014
- remove model from context lifecycle event params - 782050c


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.7.0...v0.7.1)

## v0.7.0 - November 4th, 2014
- add "before-send" context event - f446504
- change context.stop to context.preventDefault - 937bb2a
- change context.intercept to context.preventDefault - 81c18ea

Compatibility notes:
if you are using context.stop or context.intercept, use context.preventDefault instead.
```
context.intercept = function(options) {
  options.success(...);
}
```
*to*

```
context.preventDefault = true;
context.options.success(...);

```

[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.6.1...v0.7.0)

## v0.6.1 - November 2nd, 2014
- add whenFetched method - 7c4d1ba


[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.6.0...v0.6.1)

## v0.6.0 - November 1st, 2014
- rename to backbone-xhr-events - 5b7d4be

[Commits](https://github.com/jhudson8/backbone-async-event/compare/v0.5.0...v0.6.0)

## v0.5.0 - November 1st, 2014
Large rewrite with additional features / existing features are *not* backwards compatible
*note: this is the last release of backbone-async-event.  The project will be renamed to backbone-xhr-events

- allow event names and referenced attributes to be overridden
- use "xhr" instead of "async" for event names
- change signature of all event parameters
- provide event forwarding capabilities
- additional 'data' context event

Your best bet is to look at the updated README file to see the new features

[Commits](https://github.com/jhudson8/backbone-async-event/compare/v0.4.0...v0.5.0)

## v0.4.0 - June 14th, 2014
- update README for hasBeenFetched/hadFetchError - f97acfd
- add Model/Collection.hasFetchError - d31b0af
- change Model/Collection.hasBeenFetched() to Model/Collection.hasBeenFetched (boolean rather than function) - d3f4ad6
- make sure options.url exists before firing events - d0235a1

[Commits](https://github.com/jhudson8/backbone-async-event/compare/v0.3.0...v0.4.0)

## v0.3.0 - May 22nd, 2014
- add "hasBeenFetched" to Backbone.Model and Backbone.Collection - da4ce8e
- add "isLoading" API docs to README - c2702a3
- add Backbone.async which can be used to track any async events - 2b03cad

[Commits](https://github.com/jhudson8/backbone-async-event/compare/v0.2.0...v0.3.0)

## v0.2.0 - May 17th, 2014
- added "options.intercept" ability to forcefully override an ajax response - 73a858e
- fix author email address - 8e9201a
- remove backbone as a dependency - 1ad0255

[Commits](https://github.com/jhudson8/backbone-async-event/compare/v0.1.3...v0.2.0)

## v0.1.3 - May 10th, 2014
- require Backbone to be passed as param for commonJS init - a63f4c9

[Commits](https://github.com/jhudson8/backbone-async-event/compare/v0.1.2...v0.1.3)

## v0.1.2 - May 10th, 2014
- add global event handler support

[Commits](https://github.com/jhudson8/backbone-async-event/compare/8ebf705...v0.1.2)

# Release Notes

## Development

[Commits](https://github.com/jhudson8/backbone-xhr-events/compare/v0.6.1...master)

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

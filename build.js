var fs = require('fs'),
    UglifyJS = require('uglify-js');

var version = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf-8'})).version;

function wrap(wrapperFile, contents) {
  var wrapper = fs.readFileSync('./lib/' + wrapperFile + '.wrapper', {encoding: 'utf8'});
  var parts = wrapper.split('{core}');
  return replaceTokens(parts[0] + contents + parts[1]);
}

function write(outfile, wrapper, contents) {
  fs.writeFileSync('./' + outfile + '.js', wrap(wrapper, contents), {encoding: 'utf8'});  
}

function replaceTokens(content) {
  return content.replace('{version}', version);
}

var contents = fs.readFileSync('./lib/core.js', {encoding: 'utf8'});
write('backbone-async-event', 'browser', contents);
write('index', 'commonjs', contents);

var minimized = UglifyJS.minify('./backbone-async-event.js');
var minimizedHeader = '/*!\n * backbone-async-event v' + version + ';  MIT license\n */\n';
fs.writeFileSync('./backbone-async-event.min.js', minimizedHeader + minimized.code, {encoding: 'utf8'});
var fs = require('fs'),
    UglifyJS = require('uglify-js');

var name = 'backbone-async-event',
    file = name + '.js',
    minimizedFile = name + '.min.js',
    repo = 'https://github.com/jhudson8/' + name,
    version = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf-8'})).version,
    content = fs.readFileSync(file, {encoding: 'utf8'}),
    versionMatcher = new RegExp(name + ' v[0-9\.]+');

content = content.replace(versionMatcher, name + ' v' + version);
fs.writeFileSync(file, content, {encoding: 'utf8'});

var minimized = UglifyJS.minify('./backbone-async-event.js');
var minimizedHeader = '/*!\n * [backbone-async-event](https://github.com/jhudson8/backbone-async-event) v' + version + ';  MIT license; Joe Hudson<joehud@gmail.com>\n */\n';
fs.writeFileSync('./backbone-async-event.min.js', minimizedHeader + minimized.code, {encoding: 'utf8'});
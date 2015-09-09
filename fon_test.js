var fondue = require('fondue'),
    vm = require('vm');

var src = fondue.instrument('function foo(a) { return a * 2 }; foo(4)');
var sandbox = { __tracer: undefined, console: console, require: require }; // NB: fondue-processed code requires console and require
var output = vm.runInNewContext(src, sandbox);
var tracer = sandbox.__tracer; // created by fondue when instrumented code is run

var functions = {};
var nodesHandle = tracer.trackNodes();
tracer.newNodes(nodesHandle).forEach(function (n) {
    if (n.type === 'function') {
        functions[n.name] = n;
    }
});

var fooNode = functions['foo'];
console.log('foo started at', fooNode.start, 'and ended at', fooNode.end);

var logHandle = tracer.trackLogs({ ids: [fooNode.id] });
var invocations = tracer.logDelta(logHandle);
console.log('foo returned:', invocations[0].returnValue);
console.log('foo accepted arguments:', invocations[0].arguments);

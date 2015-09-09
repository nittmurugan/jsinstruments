var fondue = require('fondue'),
    vm = require('vm');

// I can't figure out a way to trace return value of callsites
// so doing some hack job by adding another function getNow which just returns Date.now()
// without any change

// for a wrong implementation of this function use % 1000 instead of % 2
// and see the test case fail
var src = fondue.instrument('function evenTime() { return function getNow() { return Date.now();}() % 2 == 0; }; evenTime()');
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

var evenNode = functions['evenTime'];
var nowNode = functions['getNow'];
console.log('foo started at', evenNode.start, 'and ended at', evenNode.end);

var logHandle = tracer.trackLogs({ ids: [evenNode.id, nowNode.id] });
var invocations = tracer.logDelta(logHandle);

//console.log(functions);
console.log(invocations);

var evenTimeInvoc = invocations[0]; // returns true or false based on getNow->Date.now()
var getNowInvoc = invocations[1]; // returns Date.now()

// testing if return value of evenTime is equal to even or not
// based on time returned by the very same Date.now call
if(evenTimeInvoc.returnValue.value == (getNowInvoc.returnValue.value % 2 == 0)) {
  console.log('testPassed');
} else {
  console.log('testFailed');
}

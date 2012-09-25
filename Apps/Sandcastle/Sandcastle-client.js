/*global console,Sandcastle*/
(function() {
    "use strict";

    window.parent.postMessage('reload', '*');

    console.originalLog = console.log;
    console.log = function (d1) {
        console.originalLog.apply(console, arguments);
        window.parent.postMessage({ 'log': (typeof d1 === 'undefined') ? 'undefined' : d1.toString() }, '*');
    };

    console.originalError = console.error;
    console.error = function (d1) {
        console.originalError.apply(console, arguments);
        if (typeof d1 === 'undefined') {
            window.parent.postMessage({ 'error': 'undefined' }, '*');
        } else {
            // Look for d1.stack, "bucket.html:line:char"
            var lineNumber = -1, lineStart, lineEnd1, lineEnd2;
            var errorMsg = d1.toString();
            var rawErrorMsg = errorMsg;
            if (typeof d1.stack === 'string') {
                var stack = d1.stack;
                var pos = stack.indexOf('bucket.html');
                if (pos >= 0) {
                    lineStart = stack.indexOf(':', pos);
                    if (lineStart > pos) {
                        lineEnd1 = stack.indexOf(':', lineStart + 1);
                        lineEnd2 = stack.indexOf('\n', lineStart + 1);
                        if (lineEnd2 > lineStart && (lineEnd2 < lineEnd1 || lineEnd1 < lineStart)) {
                            lineEnd1 = lineEnd2;
                        }
                        if (lineEnd1 > lineStart) {
                            try {
                                lineNumber = parseInt(stack.substring(lineStart + 1, lineEnd1), 10);
                            } catch (ex) { }
                        }
                    }
                }
            }

            if (lineNumber >= 0) {
                errorMsg += ' (on line ' + lineNumber + ')';
                window.parent.postMessage({ 'error': errorMsg, 'lineNumber': lineNumber, 'rawErrorMsg': rawErrorMsg }, '*');
            } else {
                window.parent.postMessage({ 'error': errorMsg }, '*');
            }
        }
    };

    window.onerror = function (errorMsg, url, lineNumber) {
        var rawErrorMsg = errorMsg;
        if (typeof lineNumber !== 'undefined') {
            if (typeof url !== 'undefined' && url && url.indexOf('bucket.html') < 0) {
                errorMsg += ' (on line ' + lineNumber + ' of ' + url + ')';
            } else {
                errorMsg += ' (on line ' + lineNumber + ')';
            }
            window.parent.postMessage({ 'error': errorMsg, 'url': url, 'lineNumber': lineNumber, 'rawErrorMsg': rawErrorMsg }, '*');
        } else {
            window.parent.postMessage({ 'error': errorMsg, 'url': url }, '*');
        }
        console.originalError.apply(console, [ errorMsg ]);
        return false;
    };

    Sandcastle.declare = function (obj) {
        try {
            var stack = new Error().stack.toString();
            var pos = stack.indexOf('bucket.html:');
            if (pos >= 0) {
                pos = stack.indexOf('bucket.html:', pos + 12);
            }
            var lineNumber;
            if (pos >= 0) {
                pos += 12;
                lineNumber = parseInt(stack.substring(pos), 10);
                Sandcastle.registered.push({
                    'obj': obj,
                    'lineNumber': lineNumber
                });
            }
        } catch (ex) { }
    };

    Sandcastle.highlight = function (obj) {
        var len = Sandcastle.registered.length;
        var i;
        if (typeof obj !== 'undefined') {
            for (i = 0; i < len; ++i) {
                if (obj === Sandcastle.registered[i].obj) {
                    window.parent.postMessage({ 'highlight': Sandcastle.registered[i].lineNumber }, '*');
                    return;
                }
            }
        }
        window.parent.postMessage({ 'highlight': 0 }, '*');
    };

}());

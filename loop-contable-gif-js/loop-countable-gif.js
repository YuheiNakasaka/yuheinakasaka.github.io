(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.loopCountableGif = factory();
    }
})(this, function() {
    var loopCountableGif = function(opts) {
        var options = {
            gif: null,
            on_end: null
        };
        for (var i in opts) {
            options[i] = opts[i];
        }
        var localLoopCount = 0;

        var loopCount = function() {
            localLoopCount++;
        };

        var getCurrentLoops = function() {
            return localLoopCount;
        };

        var resetLocalLoops = function() {
            localLoopCount = 0;
        };

        var load = function() {
            var rub = new SuperGif({
                gif: options['gif'],
                on_end: function(gif) {
                    loopCount();
                    if (options['on_end']) options['on_end']();
                }
            });
            rub.load();
        };

        return {
            load: load,
            current_loops: getCurrentLoops,
            reset_local_loops: resetLocalLoops
        };


    };

    return loopCountableGif;
});
var ninerpc = (function() {

    function Channel(receiver, nameSpace, targetOrigin) {
        this.receiver = receiver;
        this.nameSpace = nameSpace;
        this.idCnt = 0;
        this.targetOrigin = targetOrigin;
        this.cblist = {};
        this.requestlist = {};
        this.listen();
    }
    Channel.prototype.generateId = function() {
        return '' + this.nameSpace + this.idCnt++;
    };

    Channel.prototype.buildRequest = function(method, params) {
        return {
            jsonrpc: '2.0',
            id: this.generateId(),
            method: method,
            params: params
        };
    };
    Channel.prototype.sendRequest = function(method, params, callback) {
        var msg = this.buildRequest(method, params, callback);
        this.requestlist[msg.id] = callback;
        this.receiver.postMessage(JSON.stringify(msg), this.targetOrigin);
    }

    Channel.prototype.buildNotification = function(method, params) {
        return {
            jsonrpc: '2.0',
            method: method,
            params: params
        };
    };
    Channel.prototype.sendNotification = function(method, params) {
        var msg = this.buildNotification(method, params);
        this.receiver.postMessage(JSON.stringify(msg), this.targetOrigin);
    };

    Channel.prototype.buildResult = function(id, result) {
        return {
            jsonrpc: '2.0',
            result: result,
            id: id
        }
    };
    Channel.prototype.sendResult = function(ev, id, result) {
        var msg = this.buildResult(id, result);
        ev.source.postMessage(JSON.stringify(msg), ev.origin);
    };

    Channel.prototype.subscribe = function(method, callback) {
        this.cblist[method] = callback;
    };
    Channel.prototype.unsubscribe = function(method) {
        delete this.cblist[method];
    };

    Channel.prototype.listen = function() {
        var self = this;

        function onMessage(ev) {
            var msg;
            if (self.targetOrigin !== '*' && ev.origin !== self.targetOrigin) {
                return;
            }
            try {
                msg = JSON.parse(ev.data);
            }
            catch(e) {

            }
            if (msg) {
                if (typeof msg['result'] != 'undefined') {
                    if (typeof self.requestlist[msg.id] == 'function') {
                        self.requestlist[msg.id].call(self, ev, msg, self);
                        delete self.requestlist[msg.id];
                    }
                }
                else {
                    if (typeof self.cblist[msg.method] == 'function') {
                        self.cblist[msg.method].call(self, ev, msg, self);
                    }
                }
            }
        }

        if (window.addEventListener) {
            window.addEventListener('message', onMessage, false);
        }
        else if (window.attachEvent) {
            window.attachEvent('onmessage', onMessage);
        }
    };

    return {
        buildChannel: function(receiver, nameSpace, targetOrigin) {
            return new Channel(receiver, nameSpace, targetOrigin);
        }
    }
})();
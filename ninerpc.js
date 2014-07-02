var ninerpc = (function() {

    function Channel(receiver, nameSpace, targetOrigin) {
        this.receiver = receiver;
        this.nameSpace = nameSpace;
        this.idCnt = 0;
        this.targetOrigin = targetOrigin;
        this.cblist = {};
        this.listen();
    }
    Channel.prototype.generateId = function() {
        return '' + this.nameSpace + this.idCnt++;
    };
    Channel.prototype.buildMessage = function(method, params) {
        return JSON.stringify({
            jsonrpc: '2.0',
            id: generateId(),
            method: method,
            params: params
        });
    };
    Channel.prototype.buildNotificationMessage = function(method, params) {
        return JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params
        });
    };
    Channel.prototype.sendNotification = function(method, params) {
        var msg = this.buildNotificationMessage(method, params);
        this.receiver.postMessage(msg, this.targetOrigin);
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
            msg = JSON.parse(ev.data);
            if (typeof self.cblist[msg.method] == 'function') {
                self.cblist[msg.method].call(self, ev, msg.params);
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
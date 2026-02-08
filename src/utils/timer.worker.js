/* eslint-disable no-restricted-globals */
self.onmessage = function (e) {
    if (e.data === 'start') {
        self.intervalId = setInterval(() => {
            self.postMessage('tick');
        }, 1000);
    } else if (e.data === 'stop') {
        clearInterval(self.intervalId);
    }
};

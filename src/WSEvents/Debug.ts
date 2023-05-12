import WSS from '../index.js';

WSS.on('debug', (msg) => {
	console.debug(`[DEBUG] ${msg}`);
});

import WSS from '..';

WSS.on('debug', (msg) => {
	console.debug(`[DEBUG] ${msg}`);
});

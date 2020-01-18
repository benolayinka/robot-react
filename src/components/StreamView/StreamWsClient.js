export default class StreamWsClient {
	constructor(ws_url) {
		this.hostname = ws_url
		this.webSocket = null
		this.open = false
	}

	//helper to check if websocket is alive before sending
	send = (json) => { 
		if(this.open && this.webSocket){
			this.webSocket.send(json);
		}
	}

	connect = () => {
		var webSocket = new WebSocket(this.hostname)
		this.webSocket = webSocket

		webSocket.onopen = (event) => {
			console.debug('Websocket opened!')
			this.open = true
			//sendUser(webSocket, user);
		};

		webSocket.onmessage = function(data) {
			console.debug('Received a message!', data);
		}

		webSocket.onclose = (e) => {
			this.webSocket = null;
			this.open = false
			console.debug('Socket is closed. Reconnecting..', e.reason);
		    setTimeout(() => {
		      this.connect();
		    }, 100);
		}

		webSocket.onerror = function(err) {
			console.debug('Socket encountered error: ', err.message, 'Closing socket');
			webSocket.close();
		};
	}
}
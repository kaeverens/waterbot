// { constants
const BOTSTATE_UNKNOWN=0;
// }
// { define bot
var bot={
	state:BOTSTATE_UNKNOWN, // state of the bot. default to "unknown"
}
// }
// { define web server
const http = require("http");
const fs = require('fs').promises;
const port = 3000;
var files={ // list of valid files
	'/404.html':0,
	'/index.html':0,
	'/botStateGet.json':0,
};
const requestListener=function(req, res) {
	function pushFile() {
		res.setHeader('Content-Type', {
			'html':'text/html',
			'css':'text/css',
			'json':'text/json',
		}[ext]);
		res.writeHead(200);
		if (ext==='json') { // application files - run them
			let fnName=req.url.replace(/^\/(.*)\..*/, '$1');
			res.end(JSON.stringify(global[fnName]()));
		}
		else {
			res.end(files[req.url]);
		}
	}
	if (req.url==='/') {
		req.url='/index.html';
	}
	if (files[req.url]===undefined) {
		req.url='/404.html';
	}
	let ext=req.url.replace(/.*\./, '');
	if (files[req.url]) {
		pushFile();
	}
	else {
		fs.readFile(__dirname+'/'+ext+req.url)
			.then(contents=>{
				if (ext==='json') {
					let fnName=req.url.replace(/^\/(.*)\..*/, '$1');
					contents=contents.toString();
					try {
						global[fnName]=eval(contents);
					}
					catch (e) {
						console.log('js error', e);
					}
					contents=1;
				}
				files[req.url]=contents;
				pushFile();
			})
			.catch(err=>{
				res.writeHead(500);
				console.log('404', req.url);
				res.end(err);
			});
	}
}
const server = http.createServer(requestListener);
server.listen(port);
// }

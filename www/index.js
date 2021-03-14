// { constants
const BOTSTATE_UNKNOWN=0;
// }
// { functions
function addUpdate(cmd, data) {
	var now=+(new Date);
	while(global.updates.length && global.updates[0].datetime<now-10000) {
		global.updates.shift();
	}
	global.updates.push({
		datetime:now,
		cmd:cmd,
		data:data,
	});
}
// }
// { define bot
var bot={
	state:BOTSTATE_UNKNOWN, // state of the bot. default to "unknown"
	setState:num=>{
		bot.state=num;
		addUpdate('botSetState', num);
	}
}
// }
// { define web server
const http = require("http");
const fs = require('fs').promises;
const port = 3000;
global.updates=[];
var files={ // list of valid files
	'/404.html':0,
	'/index.html':0,
	'/botStateGet.json':0,
	'/bot.js':0,
	'/updatesGet.json':0,
};
const requestListener=function(req, res) {
	function pushFile() {
		res.setHeader('Content-Type', {
			'html':'text/html',
			'css':'text/css',
			'json':'application/json',
			'js':'text/javascript',
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
				contents=contents.toString();
				if (ext==='json') {
					let fnName=req.url.replace(/^\/(.*)\..*/, '$1');
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
// { serial communication
const SerialPort=require('serialport');
const Readline=require('@serialport/parser-readline');
const sp=new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });
const parser = sp.pipe(new Readline({ delimiter: '\n' }));
sp.on("open", () => {
  console.log('serial port open');
});
parser.on('data', str =>{
	str=str.trim();
	var cmd=str.replace(/:.*/, ''), data=str.replace(/^[^:]*: /, '');
	switch (cmd) {
		case 'setState':
			bot.setState(+data);
		break;
		default:
			console.log('unknown serial command', str);
	}
});
// }

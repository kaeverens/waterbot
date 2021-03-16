// { constants
const BOTSTATE_UNKNOWN=0;
const { parse } = require('querystring');
const sqlite3 = require('sqlite3');
const http = require("http");
const fs = require('fs').promises;
const port = 3000;
const SerialPort=require('serialport');
const Readline=require('@serialport/parser-readline');
// }
global.updates=[];
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
		console.log(bot.state);
		addUpdate('botSetState', num);
	}
}
// }
// { database
function getDatabase(callback) {
	let db=new sqlite3.Database(__dirname+'/data.db', err=>{
		if (err) {
			return console.error('error opening sqlite database', err.message);
		}
		db.run('create table if not exists plants(id integer primary key autoincrement, position integer, ml_per_day float, last_watered integer)', ()=>{
			callback(db);
		});
	});
}
// }
// { define web server
var files={ // list of valid files
	'/404.html':0,
	'/bot.js':0,
	'/botStateGet.json':0,
	'/index.html':0,
	'/plantAdd.json':0,
	'/plantsGetDT.json':0,
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
			if (req.method==='POST') {
				let body = '';
				req.on('data', chunk => {
					body += chunk.toString(); // convert Buffer to string
				});
				req.on('end', () => {
					global[fnName](ret=>{
						res.end(JSON.stringify(ret));
					}, parse(body));
				});
			}
			else {
				global[fnName](ret=>{
					res.end(JSON.stringify(ret));
				});
			}
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
const sp=new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });
const parser = sp.pipe(new Readline({ delimiter: '\n' }));
sp.on("open", () => {
  console.log('serial port open');
});
parser.on('data', str =>{
	str=str.trim();
	console.log(str);
	var cmd=str.replace(/:.*/, ''), data=str.replace(/^[^:]*: /, '');
	switch (cmd) {
		case 'setState':
			bot.setState(+data);
		break;
		default:
			console.log('unknown serial command', str);
	}
});
global.serialPing=setInterval(()=>{
	sp.write('ping\n');
	console.log('> ping');
}, 4000);
// }

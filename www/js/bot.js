$(()=>{
	var bot={
		state:0,
		setState:num=>{
			bot.state=num;
			$('#bot-state').text(['unkown', 'at port', 'refilling syringe', 'waiting for command'][num]);
		}
	};
	var lastUpdate=0;
	function getUpdates() {
		$.post('/updatesGet.json', us=>{
			console.log(us);
			us.forEach(u=>{
				if (u.datetime>=lastUpdate) {
					switch (u.cmd) {
						case 'botSetState':
							bot.setState(u.data);
							break;
						default:
							console.warn('unknown update', u);
					}
					lastUpdate=u.datetime;
				}
			});
			lastUpdate++;
			setTimeout(getUpdates, 1000);
		});
	}
	getUpdates();
});

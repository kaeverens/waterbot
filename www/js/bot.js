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
		$.post('/updatesGet.json', {
			lastUpdate:lastUpdate
		}, us=>{
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
	// { show table of plants
	let $plantsTableDOM=$('#plants');
	let $plantsTable=$plantsTableDOM.DataTable({
		processing:true,
		serverSide:true,
		ajax:{
			url:'/plantsGetDT.json',
			type:'POST',
		}
	});
	// }
	// { button: add plant
	$('#plant-add').click(()=>{
		var $dialog=$('<div><table>'
			+'<tr><th>Position</th><td><input id="dialog-position" type="number"/></td></tr>'
			+'<tr><th>ML/Day</th><td><input id="dialog-ml_day" type="number" step="0.1"/></td></tr>'
			+'</table></div>')
			.dialog({
				modal:true,
				title:'add a plant',
				close:()=>{
					$dialog.remove();
				},
				buttons:{
					Add:()=>{
						var params={
							position:$('#dialog-position').val(),
							ml_per_day:$('#dialog-ml_day').val()
						};
						$.post('/plantAdd.json', params, r=>{
							$plantsTable.draw(false);
							$dialog.remove();
						});
					}
				}
			});
	});
});

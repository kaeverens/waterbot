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
	// { show table of pots
	let $potsTableDOM=$('#pots');
	let $potsTable=$potsTableDOM.DataTable({
		processing:true,
		columns:[
			{className:'id'},
			{className:'position editable'},
			{className:'ml_per_day editable'},
			{className:'last_watered'},
		],
		serverSide:true,
		ajax:{
			url:'/potsGetDT.json',
			type:'POST',
		},
		rowCallback:(r, data)=>{
			$(r).data('data', data);
			$('.last_watered', r).text(data[3]?new Date(data[3]*1000):' - ');
		},
	});
	$potsTableDOM.on('click', 'td.position', function() {
		var $td=$(this), $tr=$td.closest('tr'), data=$tr.data('data'), id=data[0], position=data[1];
		if ($td.data('clicked')) {
			return;
		}
		$td.data('clicked', true);
		var $inp=$('<input type="number"/>')
			.val(position)
			.appendTo($td.empty())
			.change(()=>{
				position=+$inp.val();
				$.post('/potPositionSet.json', {
					id:id,
					position:position
				}, r=>{
					data[1]=position;
					$td.data('clicked', false).data('data', data).text(position);
				});
			});
		console.log(data);
	});
	$potsTableDOM.on('click', 'td.ml_per_day', function() {
		var $td=$(this), $tr=$td.closest('tr'), data=$tr.data('data'), id=data[0], ml_per_day=data[2];
		if ($td.data('clicked')) {
			return;
		}
		$td.data('clicked', true);
		var $inp=$('<input type="number"/>')
			.val(ml_per_day)
			.appendTo($td.empty())
			.change(()=>{
				ml_per_day=+$inp.val();
				$.post('/potMlPerDaySet.json', {
					id:id,
					ml_per_day:ml_per_day,
				}, r=>{
					data[2]=ml_per_day;
					$td.data('clicked', false).data('data', data).text(ml_per_day);
				});
			});
		console.log(data);
	});
	// }
	$('#pot-add').click(()=>{ // button: add pot
		var $dialog=$('<div><table>'
			+'<tr><th>Position</th><td><input id="dialog-position" type="number"/></td></tr>'
			+'<tr><th>ML/Day</th><td><input id="dialog-ml_day" type="number" step="0.1"/></td></tr>'
			+'</table></div>')
			.dialog({
				modal:true,
				width:350,
				title:'add a pot',
				close:()=>{
					$dialog.remove();
				},
				buttons:{
					Add:()=>{
						var params={
							position:$('#dialog-position').val(),
							ml_per_day:$('#dialog-ml_day').val()
						};
						$.post('/potAdd.json', params, r=>{
							$potsTable.draw(false);
							$dialog.remove();
						});
					}
				}
			});
	});
});

document.addEventListener('DOMContentLoaded', () => {
	init();
});

const init = () => {
	fetch(getSheetUrl())
	.then((response) => response.text())
	.then((csvText) => handleResponse(csvText));
}

const getSheetUrl = () => {
	const urlParams = new URLSearchParams(window.location.search);

	// sheetName is the name of the TAB in your spreadsheet
	const sheetName = urlParams.get('m') != null ? encodeURIComponent(urlParams.get('m')) : encodeURIComponent("Sheet1");
	return generateSheetUrl(sheetName);
}

const generateSheetUrl = (sheetName) => {
	const sheetId = "11f3NRKQlu_singbDNBETHa52LPs5_qC9UFKfumeht4k";
	const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
	return sheetURL;
}

const handleResponse = (csvText) => {
  let sheetObjects = csvToObjects(csvText);
  // sheetObjects is now an Array of Objects
  console.table(sheetObjects);
  drawChart(sheetObjects);
  setPastMatches();
}

const setPastMatches = () => {
	const urlParams = new URLSearchParams(window.location.search);
	const defaultSelected = urlParams.get('m') != null ? urlParams.get('m') : '';

	fetch(generateSheetUrl('PAST_MATCHES'))
	.then((response) => response.text())
	.then((csvText) => {
		let app_data = csvToObjects(csvText);
		const pastMatches = app_data.filter(el => el.matches).map(el => el.matches);
		const selectEl = document.querySelector('#past-matches');
		pastMatches.forEach(el => {
			let opt = document.createElement('option');
			opt.value = el;
			opt.innerHTML = el;
			opt.selected = el == defaultSelected;
			selectEl.appendChild(opt);
		});

		// Remove Loading... option
		selectEl.querySelector('option').remove();
	
		selectEl.addEventListener('change', (event) => {
			if(event.target.value != 'latest') {
				window.location.href = `${window.location.origin}${window.location.pathname}?m=${event.target.value}`;
			} else {
				window.location.href = `${window.location.origin}${window.location.pathname}`;
			}
		});
	});

}

const csvToObjects = (csv) => {
  const csvRows = csv.split("\n");
  const propertyNames = csvSplit(csvRows[0]);
  let objects = [];
  for (let i = 1, max = csvRows.length; i < max; i++) {
	let thisObject = {};
	let row = csvSplit(csvRows[i]);
	for (let j = 0, max = row.length; j < max; j++) {
	  thisObject[propertyNames[j]] = row[j];
	}
	objects.push(thisObject);
  }
  return objects;
}

const csvSplit = (row) => {
  return row.split(",").map((val) => val.substring(1, val.length - 1));
}

const pluginBackground = {
	id: 'customCanvasBackgroundColor',
	beforeDraw: (chart, args, options) => {
	  const {ctx} = chart;
	  ctx.save();
	  ctx.globalCompositeOperation = 'destination-over';
	  ctx.fillStyle = options.color || '#99ffff';
	  ctx.fillRect(0, 0, chart.width, chart.height);
	  ctx.restore();
	}
  };

const pluginWatermark = {
	id: 'customWatermark',
	afterDraw: chart => {
		let ctx = chart.ctx;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '12px Arial';
		ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
		ctx.textAlign = 'left';
		ctx.fillText(`${window.location.host}/${window.location.pathname.replaceAll('/', '')}`, chart.width - 230, chart.height - 60);
		ctx.restore();
	}
}

const pluginWinningTeam = {
	id: 'winningTeam',
	afterDraw: (chart, args, options) => {
		if(options.text) {
			let ctx = chart.ctx;
			ctx.save();
			ctx.textAlign = 'center';
			ctx.font = 'bold 12px sans-serif';
			ctx.fillStyle = options.color;
			ctx.textAlign = 'left';
			ctx.fillText(`${options.text} WINS!`, 20, 52);
			ctx.restore();
		}
	}
}

const drawChart = (app_data) => {
	const chartEl = document.getElementById('myChart');
	const labels = Array.from({ length: 20 }, (_, i) => i + 1);
	const scoreTeam1 = app_data.filter(el => el.score1).map(el => Number(el.score1));
	const scoreTeam2 =  app_data.filter(el => el.score2).map(el => el.score2);

	const team1Score = typeof scoreTeam1[scoreTeam1.length - 1] != 'undefined' ? scoreTeam1[scoreTeam1.length - 1] : 0;
	const team2Score = typeof scoreTeam2[scoreTeam2.length - 1] != 'undefined' ? scoreTeam2[scoreTeam2.length - 1] : 0;

	const crr1 = scoreTeam1.length ? parseFloat(team1Score / scoreTeam1.length).toFixed(2) : 0;
	const crr2 = scoreTeam2.length ? parseFloat(team2Score / scoreTeam2.length).toFixed(2) : 0;

	const projScore1 = Math.round(crr1 * 20);
	const projScore2 = Math.round(crr2 * 20);

	const maxScore = Math.max(team1Score, team2Score);
	const maxYPoint = (Math.ceil((maxScore + 1) / 10) * 10) + 15;

	const arrWickets1 = app_data.filter(el => el.wicket1).map(el => {
		return {x: Number(el.over), y: maxYPoint, z: el.wicket1.length}
	});
	const lostW1 = arrWickets1.reduce((n, {z}) => n + z, 0);

	const arrWickets2 = app_data.filter(el => el.wicket2).map(el => {
		return {x: Number(el.over), y: maxYPoint + 10, z: el.wicket2.length}
	});
	const lostW2 = arrWickets2.reduce((n, {z}) => n + z, 0);

	const _score1 = `${team1Score}/${lostW1}`;
	const _score2 = `${team2Score}/${lostW2}`;
	const isMatchOver = scoreTeam2.length == 20 || team2Score > team1Score || lostW2 == 10;
	const currentScore1 = scoreTeam1.length == 20 ? `S: ${_score1}` : `S: ${_score1}, PS: ${projScore1}`;
	const currentScore2 =  isMatchOver ? `S: ${_score2}` : `S: ${_score2}, PS: ${projScore2}`;

	let winnerKey = '';
	if(isMatchOver) {
		winnerKey = team2Score > team1Score ? app_data[1].teams : app_data[0].teams;
	}
	
	const data = {
		labels: labels,
		datasets: [{
			...CONFIG.DATASETS,
			...TEAMS[app_data[0].teams],
			backgroundColor: 'rgba(0, 0, 0, 0)',
			data: scoreTeam1,
			order: 2,
			datalabels: {
				offset: (context) => {
					let index = context.dataIndex;
					let value = context.dataset.data[index];
					let diffScore = Number(scoreTeam2[index]) - value;
					
					if(diffScore > 0 && diffScore < 10) {
						return 4;
					}
				},
				align: (context) => {
					let index = context.dataIndex;
					let value = context.dataset.data[index];
					let diffScore = Number(scoreTeam2[index]) - value;
					
					if(diffScore > 0 && diffScore < 10) {
						return 'bottom';
					} else {
						return 'top';
					}
				}
			}
		},
		{
			...CONFIG.DATASETS,
			...TEAMS[app_data[1].teams],
			backgroundColor: 'rgba(0, 0, 0, 0)',
			data: scoreTeam2,
			order: 1,
			datalabels: {
				offset: (context) => {
					let index = context.dataIndex;
					let value = Number(context.dataset.data[index]);
					let diffScore = Number(scoreTeam1[index]) - value;
					
					if(diffScore >= 0) {
						return 4;
					}
				},
				align: (context) => {
					let index = context.dataIndex;
					let value = Number(context.dataset.data[index]);
					let diffScore = Number(scoreTeam1[index]) - value;
					
					console.log(index, value, Number(scoreTeam1[index]), (Number(scoreTeam1[index]) - value));
					if(diffScore >= 0) {
						return 'bottom';
					} else {
						return 'top';
					}
				}
			}
		},
		{
			...CONFIG.DATASETS,
			...TEAMS[app_data[0].teams],
			label: `${app_data[0].teams} wickets`,
			data: arrWickets1,
			showLine: false,
			pointBorderWidth: 16,
			backgroundColor: TEAMS[app_data[0].teams].borderColor,
			datalabels: {
				formatter: (value) => {
					return `${value.z}W`;
				},
				align: 'center',
				color: '#ffffff',
				font: {
					size: 10
				}
			}
		},
		{
			...CONFIG.DATASETS,
			...TEAMS[app_data[1].teams],
			label: `${app_data[1].teams} wickets`,
			data: arrWickets2,
			showLine: false,
			pointBorderWidth: 16,
			backgroundColor: TEAMS[app_data[1].teams].borderColor,
			datalabels: {
				formatter: (value) => {
					return `${value.z}W`;
				},
				align: 'center',
				color: '#ffffff',
				font: {
					size: 10
				}
			}
		}]
	};
	
	Chart.register(ChartDataLabels);
	new Chart(chartEl, {
		type: 'line',
		data: data,
		plugins: [
			pluginBackground,
			pluginWatermark,
			pluginWinningTeam
		],
		options: {
			plugins: {
				tooltip: {
					enabled: false
				},
				legend: {
					display: true,
					labels: {
						boxWidth: 12
					}
				},
				title: {
					display: true,
					text: 'IPL Score'
				},
				subtitle: {
					display: true,
					text: `${app_data[0].teams} (RR: ${crr1}, ${currentScore1}) vs ${app_data[1].teams} (RR: ${crr2}, ${currentScore2})`
				},
				customCanvasBackgroundColor: {
					color: '#ffffff',
				},
				winningTeam: {
					color: winnerKey ? `${TEAMS[winnerKey].borderColor}` : '',
					text: winnerKey
				}
			},
			hover: {
				mode: null, // Disable hovering interactions
			},
			scales: {
				y: {
					suggestedMax: 200,
					title: {
						display: true,
						text: 'RUNS'
					}
				},
				x: {
					title: {
						display: true,
						text: 'OVER'
					}
				}
			},
			maintainAspectRatio: false
		}
	});
	initDownloadButton(`${app_data[0].teams}v${app_data[1].teams}`);
}

const initDownloadButton = (matchName) => {
	const elButtonParent = document.querySelector('.download');
	const elButtonEl = document.querySelector('#download');

	elButtonEl.addEventListener('click', () => {
		let link = document.createElement('a');
		link.download = `${matchName}`;
		link.href = document.getElementById('myChart').toDataURL("image/jpeg");
		link.click();
	});

	elButtonParent.setAttribute('style', `left: ${window.innerWidth - 90}px;`);
	elButtonParent.classList.remove('hide');
}
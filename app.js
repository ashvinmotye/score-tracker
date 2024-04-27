// sheetID you can find in the URL of your spreadsheet after "spreadsheet/d/"
const sheetId = "11f3NRKQlu_singbDNBETHa52LPs5_qC9UFKfumeht4k";
// sheetName is the name of the TAB in your spreadsheet
const sheetName = encodeURIComponent("Sheet1");
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

fetch(sheetURL)
  .then((response) => response.text())
  .then((csvText) => handleResponse(csvText));

const handleResponse = (csvText) => {
  let sheetObjects = csvToObjects(csvText);
  // sheetObjects is now an Array of Objects
  console.table(sheetObjects);
  drawChart(sheetObjects);
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

const drawChart = (app_data) => {
	const chartEl = document.getElementById('myChart');
	const labels = Array.from({ length: 20 }, (_, i) => i + 1);
	const scoreTeam1 = app_data.filter(el => el.score1).map(el => Number(el.score1));
	const scoreTeam2 =  app_data.filter(el => el.score2).map(el => el.score2);

	const crr1 = scoreTeam1.length ? parseFloat(scoreTeam1[scoreTeam1.length - 1] / scoreTeam1.length).toFixed(2) : 0;
	const crr2 = scoreTeam2.length ? parseFloat(scoreTeam2[scoreTeam2.length - 1] / scoreTeam2.length).toFixed(2) : 0;

	const projScore1 = Math.round(crr1 * 20);
	const projScore2 = Math.round(crr2 * 20);
	
	const data = {
		labels: labels,
		datasets: [{
			...CONFIG.DATASETS,
			...TEAMS[app_data[0].teams],
			data: scoreTeam1,
		},
		{
			...CONFIG.DATASETS,
			...TEAMS[app_data[1].teams],
			data: scoreTeam2,
		}]
	};
	
	Chart.register(ChartDataLabels);
	new Chart(chartEl, {
		type: 'line',
		data: data,
		options: {
			plugins: {
				legend: {
					display: true
				},
				title: {
					display: true,
					text: 'IPL Score'
				},
				subtitle: {
					display: true,
					text: `${app_data[0].teams} (RR: ${crr1}, PS: ${projScore1}) vs ${app_data[1].teams} (RR: ${crr2}, PS: ${projScore2})`
				},
				datalabels: {
					align: 'top',
					offset: 5
				}
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
}
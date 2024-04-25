const chartEl = document.getElementById('myChart');
const labels = Array.from({ length: 20 }, (_, i) => i + 1);

const data = {
	labels: labels,
	datasets: [{
		...CONFIG.DATASETS,
		...TEAMS.KKR,
		data: [10, 24, 43, 49, 51, 61, 65, 73, 84, 94, 121, 127, 132, 136, 142, 157, 167, 179, 194, 206],
	},
	{
		...CONFIG.DATASETS,
		...TEAMS.CSK,
		data: [3, 11, 31, 37, 56, 62, 68, 72, 85, 89, 104, 119, 123, 126, 132, 141, 144, 159, 163, 171],
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
				text: 'Custom Chart Title'
			},
			subtitle: {
                display: true,
                text: 'Custom Chart Subtitle'
            },
			datalabels: {
				// align: 'top',
				// offset: 5
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
        }
    }
});
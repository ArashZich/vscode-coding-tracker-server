//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

const DAYS_OF_WEEK = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

// Configuration for heatmap visualization
const HEATMAP_CONFIG = {
	min: 0,
	max: 4,
	calculable: true,
	orient: "horizontal",
	left: "center",
	bottom: "15%",
	inRange: {
		// From less coding time to more
		color: ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"],
	},
};

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "activity_heatmap",
	init: base.init,
	update,
};

/**
 * Update the heatmap with coding data
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Initialize data structure for the heatmap [day][hour]
	let activityData = Array(7)
		.fill(0)
		.map(() => Array(24).fill(0));
	let maxValue = 1; // Default max for scale

	// Process data
	Object.keys(dataGroupByDay).forEach((dateStr) => {
		const date = new Date(dateStr);
		const dayOfWeek = date.getDay(); // 0-6

		// Get the hourly data for this day if available
		const hourlyData = dataGroupByDay[dateStr].hourly || {};

		// Sum up activity per hour
		Object.keys(hourlyData).forEach((hour) => {
			const hourNum = parseInt(hour);
			if (hourNum >= 0 && hourNum < 24) {
				const value = hourlyData[hour].coding / 60000; // Convert ms to minutes
				activityData[dayOfWeek][hourNum] += value;

				// Track max value for scale
				if (activityData[dayOfWeek][hourNum] > maxValue) {
					maxValue = activityData[dayOfWeek][hourNum];
				}
			}
		});
	});

	// Format data for echarts heatmap
	const formattedData = [];
	activityData.forEach((dayData, dayIndex) => {
		dayData.forEach((value, hourIndex) => {
			if (value > 0) {
				// Only add non-zero data points
				formattedData.push([hourIndex, dayIndex, value.toFixed(2)]);
			} else {
				formattedData.push([hourIndex, dayIndex, 0]);
			}
		});
	});

	// Update visualization config based on actual data
	const visualMapConfig = Object.assign({}, HEATMAP_CONFIG, {
		max: Math.ceil(maxValue),
	});

	base.getCharts().setOption({
		title: {
			top: "0",
			left: "center",
			text: "Coding Activity Heatmap",
		},
		tooltip: {
			position: "top",
			formatter: function (params) {
				return (
					`${DAYS_OF_WEEK[params.data[1]]} at ${
						params.data[0]
					}:00<br>` + `${params.data[2]} mins of coding activity`
				);
			},
		},
		grid: {
			top: "10%",
			height: "70%",
			left: "3%",
			right: "7%",
		},
		xAxis: {
			type: "category",
			data: HOURS,
			splitArea: {
				show: true,
			},
			axisLabel: {
				interval: 2,
			},
		},
		yAxis: {
			type: "category",
			data: DAYS_OF_WEEK,
			splitArea: {
				show: true,
			},
		},
		visualMap: [visualMapConfig],
		series: [
			{
				name: "Coding Activity",
				type: "heatmap",
				data: formattedData,
				label: {
					show: false,
				},
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowColor: "rgba(0, 0, 0, 0.5)",
					},
				},
			},
		],
	});
}

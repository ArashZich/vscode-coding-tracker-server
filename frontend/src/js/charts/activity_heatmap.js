//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

// GitHub-style color palette (from light to dark)
const COLORS = [
	"#ebedf0", // Light gray (almost no activity)
	"#9be9a8", // Light green
	"#40c463", // Medium green
	"#30a14e", // Darker green
	"#216e39", // Very dark green
];

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "activity_heatmap",
	init: base.init,
	update,
};

/**
 * Update the heatmap with coding data in GitHub style
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Prepare data
	const dates = Object.keys(dataGroupByDay).sort();

	if (dates.length === 0) {
		base.getCharts().setOption({
			title: {
				text: "Coding Activity Heatmap",
				left: "center",
				top: "10",
				subtext:
					"No data available. Start coding to see your activity!",
			},
		});
		return;
	}

	// We'll create a grid of cells (7 rows for days of week, ~15 columns for weeks)
	// Calculate weeks to show (at least 13 weeks - similar to GitHub)
	const weeksToShow = 13;
	const lastDate = new Date(dates[dates.length - 1]);
	let startDate = new Date(lastDate);
	startDate.setDate(startDate.getDate() - weeksToShow * 7);

	// Create grid data
	const gridData = [];
	let maxValue = 1; // Default max for scale

	// Days of week labels
	const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	// Fill the grid with actual data
	const currentDate = new Date(startDate);
	const weekLabels = [];
	let currentWeek = -1;

	while (currentDate <= lastDate) {
		const dateStr = dateTime.getYYYYMMDD(currentDate);
		const day = currentDate.getDay(); // 0-6 for Sun-Sat

		// Track week changes for labels
		const week = Math.floor(
			(currentDate - startDate) / (7 * 24 * 60 * 60 * 1000)
		);
		if (week !== currentWeek) {
			currentWeek = week;
			// Add week label (first day of the week)
			if (day === 0) {
				// Sunday
				weekLabels.push({
					week: currentWeek,
					label: dateTime.getMMDD(currentDate),
				});
			}
		}

		// Get coding time for this day
		const dayData = dataGroupByDay[dateStr] || { coding: 0 };
		const value = dayData.coding / 60000; // Convert ms to minutes

		// Update max value
		if (value > maxValue) {
			maxValue = value;
		}

		// Add to grid: [week, day, value]
		gridData.push([
			currentWeek, // x: week number
			day, // y: day of week
			value > 0 ? Math.round(value) : 0, // z: coding time in minutes
		]);

		// Move to next day
		currentDate.setDate(currentDate.getDate() + 1);
	}

	// Calculate thresholds for color scale (GitHub style)
	const thresholds = [
		0,
		Math.max(1, Math.ceil(maxValue / 20)), // Minimal activity
		Math.ceil(maxValue / 10),
		Math.ceil(maxValue / 4),
		Math.ceil(maxValue),
	];

	// Custom visual mapping for colors
	function getColorByValue(value) {
		if (value === 0) return COLORS[0];
		if (value < thresholds[1]) return COLORS[0];
		if (value < thresholds[2]) return COLORS[1];
		if (value < thresholds[3]) return COLORS[2];
		if (value < thresholds[4]) return COLORS[3];
		return COLORS[4];
	}

	// Process grid data to include colors
	const coloredGridData = gridData.map((item) => {
		return {
			value: [item[0], item[1], item[2]],
			itemStyle: {
				color: getColorByValue(item[2]),
			},
		};
	});

	// Generate week labels for x-axis
	const xAxisLabels = weekLabels.map((week) => week.label);

	base.getCharts().setOption({
		title: {
			text: "Coding Activity Heatmap",
			subtext: "Each cell represents minutes spent coding per day",
			left: "center",
			top: "10",
		},
		tooltip: {
			position: "top",
			formatter: function (params) {
				const weekNum = params.value[0];
				const dayNum = params.value[1];
				const minutes = params.value[2];

				// Find the date for this cell
				const cellDate = new Date(startDate);
				cellDate.setDate(cellDate.getDate() + weekNum * 7 + dayNum);

				return (
					dateTime.getYYYYMMDD(cellDate) +
					"<br>Day: " +
					daysOfWeek[dayNum] +
					"<br>Coding time: <b>" +
					minutes +
					"</b> mins"
				);
			},
		},
		grid: {
			height: "70%",
			top: "80",
			left: "60",
			right: "30",
		},
		xAxis: {
			type: "category",
			data: xAxisLabels,
			splitArea: {
				show: true,
			},
			axisLabel: {
				fontSize: 10,
				interval: 0,
				rotate: 45,
			},
			axisTick: {
				alignWithLabel: true,
			},
		},
		yAxis: {
			type: "category",
			data: daysOfWeek,
			splitArea: {
				show: true,
			},
			axisLabel: {
				fontSize: 10,
			},
		},
		visualMap: {
			min: 0,
			max: thresholds[4],
			calculable: true,
			orient: "horizontal",
			left: "center",
			bottom: "0",
			textStyle: {
				fontSize: 10,
			},
			inRange: {
				color: COLORS,
			},
			pieces: [
				{ min: 0, max: 0, color: COLORS[0] },
				{
					min: thresholds[1],
					max: thresholds[2] - 1,
					color: COLORS[1],
				},
				{
					min: thresholds[2],
					max: thresholds[3] - 1,
					color: COLORS[2],
				},
				{
					min: thresholds[3],
					max: thresholds[4] - 1,
					color: COLORS[3],
				},
				{ min: thresholds[4], color: COLORS[4] },
			],
			show: true,
		},
		series: [
			{
				name: "Coding Activity",
				type: "scatter",
				symbolSize: function (val) {
					// Make squares that fill the grid cells
					return 30; // Will be adjusted by the chart engine
				},
				data: coloredGridData,
				animationDelay: function (idx) {
					return idx * 5;
				},
				itemStyle: {
					borderWidth: 1,
					borderColor: "#fff",
				},
			},
		],
	});
}

//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "weekday_vs_weekend",
	init: base.init,
	update,
};

/**
 * Update the weekday vs weekend comparison chart
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Aggregate data by days of week
	const dayOfWeekData = aggregateByDayOfWeek(dataGroupByDay);

	// Format data for chart
	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	// Shortened day names for display
	const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const codingValues = days.map((day) => {
		const dayObj = dayOfWeekData[day] || {};
		const value = dayObj.coding || 0;
		return value ? Number(value) / 3600000 : 0; // Convert to hours
	});
	const watchingValues = days.map((day) => {
		const dayObj = dayOfWeekData[day] || {};
		const value = dayObj.watching || 0;
		return value ? Number(value) / 3600000 : 0;
	});

	// Calculate weekday and weekend averages
	const weekdayIndices = [1, 2, 3, 4, 5]; // Monday to Friday
	const weekendIndices = [0, 6]; // Sunday and Saturday

	let weekdayCoding = 0;
	let weekendCoding = 0;
	let weekdayWatching = 0;
	let weekendWatching = 0;

	weekdayIndices.forEach((i) => {
		weekdayCoding += codingValues[i] || 0;
		weekdayWatching += watchingValues[i] || 0;
	});

	weekendIndices.forEach((i) => {
		weekendCoding += codingValues[i] || 0;
		weekendWatching += watchingValues[i] || 0;
	});

	weekdayCoding =
		weekdayIndices.length > 0 ? weekdayCoding / weekdayIndices.length : 0;
	weekendCoding =
		weekendIndices.length > 0 ? weekendCoding / weekendIndices.length : 0;

	weekdayWatching =
		weekdayIndices.length > 0 ? weekdayWatching / weekdayIndices.length : 0;
	weekendWatching =
		weekendIndices.length > 0 ? weekendWatching / weekendIndices.length : 0;

	base.getCharts().setOption({
		title: {
			text: "Weekday vs Weekend Coding Patterns",
			left: "center",
			top: "0", // Changed to string
			textStyle: {
				fontSize: 16, // Reduced title size
			},
		},
		tooltip: {
			trigger: "axis",
			formatter: function (params) {
				const day = days[params[0].dataIndex];
				const value = params[0].value;

				// Format hours to be more readable
				let formattedValue;
				if (value < 1) {
					// If less than 1 hour, show in minutes
					formattedValue = Math.round(value * 60) + " minutes";
				} else {
					// If more than 1 hour, show hours with one decimal place
					formattedValue = value.toFixed(1) + " hours";
				}

				return `<strong>${day}</strong><br>Average coding time: <b>${formattedValue}</b>`;
			},
		},
		legend: {
			data: ["Daily Average", "Weekday Avg", "Weekend Avg"],
			top: "30", // Changed to string
			textStyle: {
				fontSize: 12, // Reduced legend text size
			},
			itemWidth: 15, // Reduced legend icon size
			itemHeight: 10,
		},
		grid: {
			left: "10%",
			right: "10%",
			bottom: "15%",
			top: "80", // Changed to string
			containLabel: true,
		},
		xAxis: {
			type: "category",
			data: shortDays, // Use shortened day names
			axisLabel: {
				interval: 0,
				fontSize: 12, // Increased for better readability
			},
		},
		yAxis: {
			type: "value",
			name: "Hours",
			nameTextStyle: {
				fontSize: 12, // Reduced axis name size
			},
			axisLabel: {
				formatter: function (value) {
					// Format to whole number if possible, one decimal if needed
					return value % 1 === 0
						? value + " h"
						: value.toFixed(1) + " h";
				},
				fontSize: 10, // Reduced Y-axis font size
			},
			splitLine: {
				lineStyle: {
					type: "dashed", // Dashed grid lines for better readability
					opacity: 0.7, // Reduced line opacity
				},
			},
		},
		series: [
			{
				name: "Daily Average",
				type: "bar",
				data: codingValues,
				itemStyle: {
					color: function (params) {
						// Weekend days get a different color
						return params.dataIndex === 0 || params.dataIndex === 6
							? "#ff9800"
							: "#4caf50";
					},
				},
				label: {
					show: true,
					position: "top",
					formatter: function (params) {
						const value = params.value;
						// Format labels based on value
						if (value === 0) return "";
						if (value < 1) return Math.round(value * 60) + "m";
						return value.toFixed(1) + "h";
					},
					fontSize: 10,
				},
				markLine: {
					symbol: ["none", "none"],
					label: {
						formatter: function (params) {
							const value = params.value;
							const prefix = params.name.split(" ")[0];
							// Format to whole number if possible, one decimal if needed
							if (value < 1) {
								return (
									prefix + ": " + Math.round(value * 60) + "m"
								);
							}
							return (
								prefix +
								": " +
								(value % 1 === 0
									? value + "h"
									: value.toFixed(1) + "h")
							);
						},
						fontSize: 10, // Reduced label font size
					},
					data: [
						{
							name: "Weekday Avg",
							yAxis: weekdayCoding,
							lineStyle: {
								color: "#4caf50",
								type: "dashed",
								width: 2,
							},
							label: {
								position: "end",
							},
						},
						{
							name: "Weekend Avg",
							yAxis: weekendCoding,
							lineStyle: {
								color: "#ff9800",
								type: "dashed",
								width: 2,
							},
							label: {
								position: "end",
							},
						},
					],
				},
			},
		],
	});

	// Add information about productivity statistics
	const weekdayRatio =
		weekdayWatching > 0 ? (weekdayCoding / weekdayWatching) * 100 : 0;
	const weekendRatio =
		weekendWatching > 0 ? (weekendCoding / weekendWatching) * 100 : 0;

	console.log("Weekday vs Weekend Statistics:");
	console.log(
		`Weekday Avg: ${weekdayCoding.toFixed(
			1
		)}h coding, ${weekdayWatching.toFixed(
			1
		)}h watching (${weekdayRatio.toFixed(0)}% productivity)`
	);
	console.log(
		`Weekend Avg: ${weekendCoding.toFixed(
			1
		)}h coding, ${weekendWatching.toFixed(
			1
		)}h watching (${weekendRatio.toFixed(0)}% productivity)`
	);
	console.log(
		`Difference: ${((weekendCoding / weekdayCoding) * 100 - 100).toFixed(
			0
		)}% ${
			weekendCoding > weekdayCoding ? "more" : "less"
		} coding on weekends`
	);
}

/**
 * Aggregate data by day of week
 * @param {CodingWatchingMap} dataGroupByDay
 * @returns {Object} Aggregated data by day of week
 */
function aggregateByDayOfWeek(dataGroupByDay) {
	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const dayData = {};
	const dayCounts = {};

	// Initialize data structure
	days.forEach((day) => {
		dayData[day] = { coding: 0, watching: 0 };
		dayCounts[day] = 0;
	});

	// Aggregate data
	Object.keys(dataGroupByDay).forEach((dateStr) => {
		const date = new Date(dateStr);
		const dayOfWeek = days[date.getDay()];
		const data = dataGroupByDay[dateStr];

		if (data && dayOfWeek) {
			dayData[dayOfWeek].coding += data.coding || 0;
			dayData[dayOfWeek].watching += data.watching || 0;
			dayCounts[dayOfWeek]++;
		}
	});

	// Calculate averages
	days.forEach((day) => {
		if (dayCounts[day] > 0) {
			dayData[day].coding /= dayCounts[day];
			dayData[day].watching /= dayCounts[day];
		}
	});

	return dayData;
}

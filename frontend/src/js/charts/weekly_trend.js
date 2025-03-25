//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "weekly_trend",
	init: base.init,
	update,
};

/**
 * Update the weekly trend chart
 * @param {CodingWatchingMap} dataGroupByDay
 */
function update(dataGroupByDay) {
	// Group data by weeks
	const weeklyData = getWeeklyData(dataGroupByDay);

	// Prepare series data
	const weeks = Object.keys(weeklyData).sort();
	const codingData = [];
	const watchingData = [];

	// Safely convert values to hours
	for (let i = 0; i < weeks.length; i++) {
		const week = weeks[i];
		const coding = weeklyData[week].coding;
		const watching = weeklyData[week].watching;

		// Make sure we're dealing with numbers
		codingData.push(coding > 0 ? coding / 3600000 : 0);
		watchingData.push(watching > 0 ? watching / 3600000 : 0);
	}

	// Format dates for display
	const formattedWeeks = [];
	for (let i = 0; i < weeks.length; i++) {
		const parts = weeks[i].split("-W");
		const year = parts[0];
		const weekNum = parts[1];
		formattedWeeks.push(`W${weekNum}\n${year}`);
	}

	base.getCharts().setOption({
		title: {
			text: "Weekly Coding Trends",
			left: "center",
			top: "5", // Changed to string
			textStyle: {
				fontSize: 16, // Reduced title size
			},
		},
		tooltip: {
			trigger: "axis",
			formatter: function (params) {
				const weekLabel = params[0].axisValue;
				let result = weekLabel + "<br>";

				params.forEach((param) => {
					const color = param.color;
					const seriesName = param.seriesName;
					const value = param.value;

					// Format hours to be more readable
					let formattedValue;
					if (value < 1) {
						// If less than 1 hour, show in minutes
						formattedValue = Math.round(value * 60) + " min";
					} else {
						// If more than 1 hour, show hours with one decimal place
						formattedValue = Math.round(value * 10) / 10 + " h";
					}

					result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
					result += `${seriesName}: <strong>${formattedValue}</strong><br>`;
				});

				return result;
			},
			textStyle: {
				fontSize: 12, // Reduced tooltip text size
			},
		},
		legend: {
			data: ["Coding", "Watching"],
			top: 30,
			textStyle: {
				fontSize: 12, // Reduced legend text size
			},
			itemWidth: 15, // Reduced legend icon size
			itemHeight: 10,
		},
		grid: {
			left: "40px", // Increased space for Y labels
			right: "20px",
			bottom: "60px", // Increased space for rotated X labels
			top: "70px", // Increased space for title and legend
			containLabel: true,
		},
		toolbox: {
			show: false, // Remove toolbox to save space
		},
		xAxis: {
			type: "category",
			boundaryGap: false,
			data: formattedWeeks,
			axisLabel: {
				interval: 0, // Show all labels
				rotate: 45, // Rotate labels for better readability
				fontSize: 10, // Reduced font size
				margin: 8, // Reduced margin for compactness
			},
		},
		yAxis: {
			type: "value",
			name: "Hours",
			nameTextStyle: {
				fontSize: 12, // Reduced axis name size
				padding: [0, 0, 0, 0], // Remove extra padding
			},
			axisLabel: {
				formatter: function (value) {
					// For Y-axis labels, simplify to whole numbers if possible
					return value % 1 === 0
						? value + " h"
						: Math.round(value * 10) / 10 + " h";
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
				name: "Coding",
				type: "line", // Explicitly set as "line"
				stack: "Total",
				data: codingData,
				lineStyle: {
					width: 2.5, // Reduced line thickness
					color: "#1b5e20",
				},
				itemStyle: {
					color: "#1b5e20",
				},
				areaStyle: {
					color: "#4caf50",
					opacity: 0.3, // Reduced area opacity
				},
				emphasis: {
					focus: "series",
				},
				markPoint: {
					data: [
						{
							type: "max",
							name: "Max",
							symbolSize: 50,
							label: {
								formatter: function (params) {
									// Format with only one decimal place or none if a whole number
									const value = params.data.value;
									return value < 1
										? Math.round(value * 60) + "m"
										: value % 1 === 0
										? value + "h"
										: Math.round(value * 10) / 10 + "h";
								},
								fontSize: 10, // Reduced label font size
							},
						},
						{
							type: "min",
							name: "Min",
							symbolSize: 50,
							label: {
								formatter: function (params) {
									// Format with only one decimal place or none if a whole number
									const value = params.data.value;
									return value < 1
										? Math.round(value * 60) + "m"
										: value % 1 === 0
										? value + "h"
										: Math.round(value * 10) / 10 + "h";
								},
								fontSize: 10, // Reduced label font size
							},
						},
					],
				},
				markLine: {
					data: [
						{
							type: "average",
							name: "Avg",
							label: {
								formatter: function (params) {
									// Format average with only one decimal place
									return (
										"Avg: " +
										Math.round(params.value * 10) / 10 +
										"h"
									);
								},
								fontSize: 10, // Reduced label font size
							},
						},
					],
				},
			},
			{
				name: "Watching",
				type: "line", // Explicitly set as "line"
				stack: "Total",
				data: watchingData,
				lineStyle: {
					width: 2.5, // Reduced line thickness
					color: "#01579b",
				},
				itemStyle: {
					color: "#01579b",
				},
				areaStyle: {
					color: "#2196f3",
					opacity: 0.3, // Reduced area opacity
				},
				emphasis: {
					focus: "series",
				},
			},
		],
	});
}

/**
 * Group daily data by ISO weeks
 * @param {CodingWatchingMap} dataGroupByDay
 * @returns {Object} Weekly accumulated data
 */
function getWeeklyData(dataGroupByDay) {
	const weeklyData = {};

	Object.keys(dataGroupByDay).forEach((dateStr) => {
		try {
			const date = new Date(dateStr);

			// Get ISO week and year
			const weekYear = getISOWeekYear(date);
			const weekKey =
				weekYear.year +
				"-W" +
				weekYear.week.toString().padStart(2, "0");

			// Initialize week data if not exists
			if (!weeklyData[weekKey]) {
				weeklyData[weekKey] = {
					coding: 0,
					watching: 0,
				};
			}

			// Add data - ensure we're dealing with numbers
			const dayData = dataGroupByDay[dateStr] || {
				coding: 0,
				watching: 0,
			};
			weeklyData[weekKey].coding += Number(dayData.coding) || 0;
			weeklyData[weekKey].watching += Number(dayData.watching) || 0;
		} catch (e) {
			console.error("Error processing date:", dateStr, e);
		}
	});

	return weeklyData;
}

/**
 * Get ISO week and year from date
 * @param {Date} date
 * @returns {Object} Object with week and year properties
 */
function getISOWeekYear(date) {
	// Create a copy of the date object
	const d = new Date(date.getTime());

	// Set to nearest Thursday (to get the correct ISO week number)
	d.setDate(d.getDate() + 4 - (d.getDay() || 7));

	// Get first day of year
	const yearStart = new Date(d.getFullYear(), 0, 1);

	// Calculate full weeks to nearest Thursday
	const daysSinceYearStart = (d.getTime() - yearStart.getTime()) / 86400000; // Days
	const weekNum = Math.ceil((daysSinceYearStart + 1) / 7);

	// Return week number and year
	return { week: weekNum, year: d.getFullYear() };
}

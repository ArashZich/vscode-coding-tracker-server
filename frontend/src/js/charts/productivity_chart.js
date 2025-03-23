//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	echarts = require("../utils/echartsUtils");

let base = require("./_base").createBaseChartClass();
module.exports = {
	recommendedChartId: "productivity_chart",
	init: base.init,
	update,
};

/**
 * Update the productivity chart
 * @param {Object} data
 */
function update(data) {
	// Extract relevant data
	const dailyData =
		data && data.groupBy && data.groupBy.day ? data.groupBy.day : {};

	// Process data to calculate productivity ratio
	const dates = Object.keys(dailyData).sort();
	const productivityData = [];
	const watchingData = [];
	const codingData = [];

	dates.forEach((date) => {
		const day = dailyData[date];
		const watching = day.watching || 0;
		const coding = day.coding || 0;

		// Calculate productivity ratio (coding time / watching time)
		// Avoid division by zero
		const ratio = watching > 0 ? (coding / watching) * 100 : 0;

		// Convert time to hours for display
		const watchingHours = watching / 3600000;
		const codingHours = coding / 3600000;

		productivityData.push(Math.round(ratio));
		watchingData.push(watchingHours.toFixed(2));
		codingData.push(codingHours.toFixed(2));
	});

	// Calculate the rolling average for a smoother line
	const rollingWindow = Math.min(7, dates.length); // 7-day rolling average
	const rollingAverageData = [];

	for (let i = 0; i < productivityData.length; i++) {
		let sum = 0;
		let count = 0;

		// Look back up to the window size
		for (let j = Math.max(0, i - rollingWindow + 1); j <= i; j++) {
			sum += productivityData[j];
			count++;
		}

		rollingAverageData.push(Math.round(sum / count));
	}

	// Format dates for display
	const formattedDates = dates.map((date) => {
		const dateObj = new Date(date);
		return dateTime.getMMDD(dateObj);
	});

	// Create and apply the chart options
	base.getCharts().setOption({
		title: {
			text: "Coding Productivity",
			subtext: "Percentage of watching time spent actively coding",
			left: "center",
			top: "10", // Changed to string
			textStyle: {
				fontSize: 16, // Reduced title font size
			},
			subtextStyle: {
				fontSize: 12, // Reduced subtitle font size
			},
		},
		tooltip: {
			trigger: "axis",
			formatter: function (params) {
				const index = params[0].dataIndex;
				const date = formattedDates[index];
				const productivity = productivityData[index];
				const watching = watchingData[index];
				const coding = codingData[index];

				return `<div style="font-weight:bold">${date}</div>
                <div>Productivity: <b>${productivity}%</b></div>
                <div>Coding: <b>${coding} hours</b></div>
                <div>Watching: <b>${watching} hours</b></div>`;
			},
		},
		legend: {
			data: ["Daily Productivity", "7-Day Average"],
			top: 40, // Proper distance from top
			textStyle: {
				fontSize: 11, // Reduced legend font size
			},
			itemWidth: 15, // Smaller legend icons
			itemHeight: 10,
		},
		grid: {
			left: "40px", // Increased space for Y-axis labels
			right: "40px", // Increased space on right
			bottom: "40px", // Increased space at bottom
			top: "90px", // Increased space at top for title and legend
			containLabel: true, // Include labels within grid
		},
		toolbox: {
			feature: {
				saveAsImage: {},
			},
			right: "20px", // Adjusted toolbox position
			top: "20px",
		},
		xAxis: {
			type: "category",
			boundaryGap: true, // Allow gap for bar chart
			data: formattedDates,
			axisLabel: {
				interval: Math.max(1, Math.ceil(dates.length / 15)), // Display max 15 labels
				rotate: 45, // Rotate labels for better readability
				fontSize: 10, // Reduced font size
				margin: 8, // Reduced margin
			},
		},
		yAxis: [
			{
				type: "value",
				name: "Productivity %",
				min: 0,
				max: 100,
				interval: 10,
				axisLabel: {
					formatter: "{value}%",
					fontSize: 10, // Reduced font size
				},
				nameTextStyle: {
					fontSize: 11, // Reduced font size for axis name
				},
				splitLine: {
					show: true,
					lineStyle: {
						type: "dashed",
					},
				},
			},
		],
		visualMap: [
			{
				show: false,
				type: "continuous",
				seriesIndex: 0,
				min: 0,
				max: 100,
				color: ["#91cc75", "#fac858", "#ee6666"],
			},
		],
		series: [
			{
				name: "Daily Productivity",
				type: "bar", // Explicitly set as "bar"
				data: productivityData,
				barWidth: dates.length > 30 ? "60%" : "70%", // Adjust bar width based on data count
				itemStyle: {
					borderRadius: [4, 4, 0, 0], // Rounded corners for bars
				},
				emphasis: {
					focus: "series",
				},
				markLine: {
					data: [
						{
							type: "average",
							name: "Average",
							lineStyle: {
								color: "#5470c6",
								width: 2,
							},
							label: {
								fontSize: 10, // Reduced label font size
							},
						},
					],
				},
			},
			{
				name: "7-Day Average",
				type: "line", // Explicitly set as "line"
				data: rollingAverageData,
				smooth: true,
				symbol: "none",
				lineStyle: {
					width: 3,
					color: "#5470c6",
				},
				emphasis: {
					focus: "series",
				},
				z: 2, // Ensure displayed above bars
			},
		],
	});

	// Add statistics box below the chart
	addProductivityStats(data);
}

/**
 * Add a statistics box below the chart
 * @param {Object} data
 */
function addProductivityStats(data) {
	// This function would normally add HTML elements below the chart
	// but since we can't directly manipulate DOM here, this would be implemented
	// in the route file that uses this chart

	// Calculate overall stats
	const total = data && data.total ? data.total : { watching: 0, coding: 0 };
	const watching = total.watching || 0;
	const coding = total.coding || 0;

	// Calculate productivity ratio
	const productivityRatio = watching > 0 ? (coding / watching) * 100 : 0;

	console.log("Productivity Statistics:");
	console.log(`Total Watching Time: ${dateTime.getReadableTime(watching)}`);
	console.log(`Total Coding Time: ${dateTime.getReadableTime(coding)}`);
	console.log(`Overall Productivity: ${productivityRatio.toFixed(2)}%`);
}

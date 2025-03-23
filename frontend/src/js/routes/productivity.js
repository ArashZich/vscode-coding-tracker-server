//@ts-check

let utils = require("../utils/utils"),
	dateTime = require("../utils/datetime"),
	resizer = require("../utils/resizer"),
	reportFilter = require("../reportFilter"),
	API = require("../api"),
	{ URL } = API;

// Components for this sub-page
let $page = $('<div class="page-productivity" style="display: none"></div>');
let $container = $('<div class="row"></div>');
$page.append($container);

// Add to main container
$("#bodyContainer").append($page);

// Charts for this page
let productivityChart = require("../charts/productivity_chart");
let activityHeatmap = require("../charts/activity_heatmap");
let weeklyTrend = require("../charts/weekly_trend");
let languageTrends = require("../charts/language_trends");
let weekdayWeekend = require("../charts/weekday_weekend");

/** @type {EChartsInstance[]} */
let charts = [];

module.exports = { name: utils.basename(__filename, ".js"), start, stop };

function stop() {
	charts.map((chart) => chart.dispose());
	$page.hide();
}

function start() {
	// Create chart containers if they don't exist
	if ($container.children().length === 0) {
		createChartContainers();
	}

	$page.show();

	charts = [
		productivityChart.init(
			utils.getChartDom(productivityChart.recommendedChartId, $page)[0]
		),
		activityHeatmap.init(
			utils.getChartDom(activityHeatmap.recommendedChartId, $page)[0]
		),
		weeklyTrend.init(
			utils.getChartDom(weeklyTrend.recommendedChartId, $page)[0]
		),
		languageTrends.init(
			utils.getChartDom(languageTrends.recommendedChartId, $page)[0]
		),
		weekdayWeekend.init(
			utils.getChartDom(weekdayWeekend.recommendedChartId, $page)[0]
		),
	];

	resizer.removeSubscriber();
	resizer.subscribe(charts);

	reportFilter.removeSubscribers();
	reportFilter.subscribe(loadChartData);

	loadChartData(reportFilter.getFilter());
}

function loadChartData(filter) {
	API.requestSilent(URL.overview(), (data) => {
		// Update all charts with the data
		productivityChart.update(data);
		activityHeatmap.update(data.groupBy.day);
		weeklyTrend.update(data.groupBy.day);
		languageTrends.update(data);
		weekdayWeekend.update(data.groupBy.day);

		// Update stats info
		updateProductivityStats(data);
	});
}

function createChartContainers() {
	// Productivity Chart (full width)
	$container.append(`
        <div class="col-12 mb-4">
            <div class="card">
                <div class="card-body">
                    <div data-chart="productivity_chart" style="height: 400px"></div>
                    <div id="productivity-stats" class="mt-3 p-3 border rounded bg-light"></div>
                </div>
            </div>
        </div>
    `);

	// Activity Heatmap (full width)
	$container.append(`
        <div class="col-12 mb-4">
            <div class="card">
                <div class="card-body">
                    <div data-chart="activity_heatmap" style="height: 400px"></div>
                </div>
            </div>
        </div>
    `);

	// Weekly Trend (half width)
	$container.append(`
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-body">
                    <div data-chart="weekly_trend" style="height: 400px"></div>
                </div>
            </div>
        </div>
    `);

	// Weekday vs Weekend (half width)
	$container.append(`
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-body">
                    <div data-chart="weekday_vs_weekend" style="height: 400px"></div>
                    <div id="weekday-weekend-stats" class="mt-3 p-3 border rounded bg-light"></div>
                </div>
            </div>
        </div>
    `);

	// Language Trends (full width)
	$container.append(`
        <div class="col-12 mb-4">
            <div class="card">
                <div class="card-body">
                    <div data-chart="language_trends" style="height: 400px"></div>
                </div>
            </div>
        </div>
    `);
}

/**
 * Updates the productivity stats box with calculated metrics
 * @param {Object} data The overview data
 */
function updateProductivityStats(data) {
	const total = data && data.total ? data.total : { watching: 0, coding: 0 };
	const watching = total.watching || 0;
	const coding = total.coding || 0;

	// Calculate productivity ratio
	const productivityRatio = watching > 0 ? (coding / watching) * 100 : 0;

	// Get readable times
	const watchingTime = dateTime.getReadableTime(watching);
	const codingTime = dateTime.getReadableTime(coding);

	// Update the stats box
	$("#productivity-stats").html(`
        <h5 class="text-center mb-3">Productivity Summary</h5>
        <div class="row text-center">
            <div class="col-md-4">
                <div class="p-2 rounded" style="background-color: rgba(84, 112, 198, 0.2);">
                    <h6>Total Time</h6>
                    <p class="mb-1"><strong>${watchingTime}</strong> watching</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="p-2 rounded" style="background-color: rgba(145, 204, 117, 0.2);">
                    <h6>Coding Time</h6>
                    <p class="mb-1"><strong>${codingTime}</strong> coding</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="p-2 rounded" style="background-color: rgba(250, 200, 88, 0.2);">
                    <h6>Productivity</h6>
                    <p class="mb-1"><strong>${productivityRatio.toFixed(
						2
					)}%</strong> efficient</p>
                </div>
            </div>
        </div>
    `);

	// Also update weekday-weekend stats if available
	if ($("#weekday-weekend-stats").length) {
		updateWeekdayWeekendStats(data.groupBy.day);
	}
}

/**
 * Updates the weekday vs weekend stats
 * @param {Object} dailyData The daily data
 */
function updateWeekdayWeekendStats(dailyData) {
	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const weekdayIndices = [1, 2, 3, 4, 5]; // Monday to Friday
	const weekendIndices = [0, 6]; // Sunday and Saturday

	let weekdayCoding = 0;
	let weekendCoding = 0;
	let weekdayWatching = 0;
	let weekendWatching = 0;
	let weekdayCount = 0;
	let weekendCount = 0;

	// Calculate totals
	Object.keys(dailyData || {}).forEach((dateStr) => {
		const date = new Date(dateStr);
		const dayOfWeek = date.getDay();
		const day = dailyData[dateStr];

		if (weekdayIndices.includes(dayOfWeek)) {
			weekdayCoding += day.coding || 0;
			weekdayWatching += day.watching || 0;
			weekdayCount++;
		} else if (weekendIndices.includes(dayOfWeek)) {
			weekendCoding += day.coding || 0;
			weekendWatching += day.watching || 0;
			weekendCount++;
		}
	});

	// Calculate averages
	const avgWeekdayCoding = weekdayCount
		? weekdayCoding / weekdayCount / 3600000
		: 0;
	const avgWeekendCoding = weekendCount
		? weekendCoding / weekendCount / 3600000
		: 0;

	const avgWeekdayWatching = weekdayCount
		? weekdayWatching / weekdayCount / 3600000
		: 0;
	const avgWeekendWatching = weekendCount
		? weekendWatching / weekendCount / 3600000
		: 0;

	// Calculate productivity
	const weekdayProductivity = avgWeekdayWatching
		? (avgWeekdayCoding / avgWeekdayWatching) * 100
		: 0;
	const weekendProductivity = avgWeekendWatching
		? (avgWeekendCoding / avgWeekendWatching) * 100
		: 0;

	// Update stats
	$("#weekday-weekend-stats").html(`
        <h5 class="text-center mb-3">Weekday vs Weekend</h5>
        <div class="row text-center">
            <div class="col-6">
                <div class="p-2 rounded" style="background-color: rgba(76, 175, 80, 0.2);">
                    <h6>Weekdays (Mon-Fri)</h6>
                    <p class="mb-1"><strong>${avgWeekdayCoding.toFixed(
						2
					)}</strong> hours coding</p>
                    <p class="mb-1"><strong>${avgWeekdayWatching.toFixed(
						2
					)}</strong> hours watching</p>
                    <p><strong>${weekdayProductivity.toFixed(
						1
					)}%</strong> productivity</p>
                </div>
            </div>
            <div class="col-6">
                <div class="p-2 rounded" style="background-color: rgba(255, 152, 0, 0.2);">
                    <h6>Weekends (Sat-Sun)</h6>
                    <p class="mb-1"><strong>${avgWeekendCoding.toFixed(
						2
					)}</strong> hours coding</p>
                    <p class="mb-1"><strong>${avgWeekendWatching.toFixed(
						2
					)}</strong> hours watching</p>
                    <p><strong>${weekendProductivity.toFixed(
						1
					)}%</strong> productivity</p>
                </div>
            </div>
        </div>
    `);
}

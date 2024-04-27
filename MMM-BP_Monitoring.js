Module.register("MMM-BP_Monitoring", {
    defaults: {
		width       : 800,
		height      : 500,
		numDays		: 30,
		chartConfig : {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'PM Syst',
					data: [],
					fill: false,
					borderColor: 'rgb(217, 89, 76)',
					tension: 0.1
				},
				{
					label: 'AM Syst',
					data: [],
					fill: false,
					borderColor: 'rgb(206, 141, 102)',
					tension: 0.1
				},
				{
					label: 'PM Dia',
					data: [],
					fill: false,
					borderColor: 'rgb(94, 191, 109)',
					tension: 0.1
				},
				{
					label: 'AM Dia',
					data: [],
					fill: false,
					borderColor: 'rgb(163, 227, 62)',
					tension: 0.1
				},
				{
					label: 'PM HR',
					data: [],
					fill: false,
					borderColor: 'rgb(57, 67, 183)',
					tension: 0.1
				},
				{
					label: 'AM HR',
					data: [],
					fill: false,
					borderColor: 'rgb(57, 150, 183)',
					tension: 0.1
				}]
			},
			options: {
				spanGaps: true
			}
		}
    },

    getScripts: function() {
		return ["modules/" + this.name + "/node_modules/chart.js/dist/Chart.bundle.min.js"];
	},

	start: function() {
        this.config = Object.assign({}, this.defaults, this.config);
		this.getUpdate();
		this.scheduleUpdate();
		Log.info("Starting module: " + this.name);
	},

	getDom: function() {
        // Create wrapper element
        const wrapperEl = document.createElement("div");
        wrapperEl.setAttribute("style", "position: relative; display: inline-block;");

        // Create chart canvas
        const chartEl  = document.createElement("canvas");

        // Init chart.js
        this.chart = new Chart(chartEl.getContext("2d"), this.config.chartConfig);

		// Set the size
		chartEl.width  = this.config.width;
        chartEl.height = this.config.height;
		chartEl.setAttribute("style", "display: block;");

        // Append chart
        wrapperEl.appendChild(chartEl);

		return wrapperEl;
	},

	scheduleUpdate: function () {
		var self = this;
        setInterval(function () {
			self.getUpdate();
        }, 3600000);
    },

	getUpdate: function () {
		this.sendSocketNotification("UPDATE_BP", this.config.numDays);
	},

	socketNotificationReceived: function(notification, payload) {
		console.log("Updated!");
		this.config.chartConfig.data.labels = payload.days;
		this.config.chartConfig.data.datasets[0].data = payload.pm.syst;
		this.config.chartConfig.data.datasets[1].data = payload.am.syst;
		this.config.chartConfig.data.datasets[2].data = payload.pm.dia;
		this.config.chartConfig.data.datasets[3].data = payload.am.dia;
		this.config.chartConfig.data.datasets[4].data = payload.pm.hr;
		this.config.chartConfig.data.datasets[5].data = payload.am.hr;
		this.updateDom({
			options: {
				speed: 1000,
				animate: {
					in: "backInLeft",
					out: "backOutLeft"
				}
			}
		});
	}

});

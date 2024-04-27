const express = require('express')
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const NodeHelper = require("node_helper");

const app = express();
app.use(express.json());
const db = new sqlite3.Database('./bp_db');

WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'input.html'));
});

app.post('/measurement', (req, res) => {
	const today = new Date();
	const timestamp = Date.parse(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
	const tod = today.getHours() < 12 ? 0 : 1;
	const params = [timestamp, tod, req.body.systolic, req.body.diastolic, req.body.heartrate];

	db.run('INSERT INTO Measurements VALUES (NULL, ?, ?, ?, ?, ?);', params, (err) => {
		if (err) {
			return res.status(400).send({msg: JSON.stringify(err)});
		}
		res.status(201).send({msg: 'Measurement has been inserted'});
		console.log('Inserted Measurement');
	});
});

module.exports = NodeHelper.create({
    start: function() {
		const query = `
			CREATE TABLE IF NOT EXISTS Measurements (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				meas_date INT,
				tod INT,
				systolic INT,
				diastolic INT,
				heartrate INT
			);`;

		db.run(query);

        app.listen(3000, () => {
            console.log(`BP app listening on port 3000`);
        });
    },

	socketNotificationReceived: function(notification, numDays) {
		console.log(`recieved ${notification}`);

		const today = new Date();
		const timestamp = Date.parse(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`)
		const query = `
			SELECT
				AVG(systolic) AS syst,
				AVG(diastolic) AS dia,
				AVG(heartrate) AS hr,
				tod,
				meas_date
			FROM Measurements
			WHERE meas_date >= ${timestamp - (86400000 * (numDays - 1))}
			GROUP BY meas_date, tod
			ORDER BY meas_date ASC;
		`

		let days = [];
		const am = {syst: [], dia: [], hr: []};
		const pm = {syst: [], dia: [], hr: []};

		for (let i = timestamp - (86400000 * (numDays - 1)); i <= timestamp; i += 86400000) {
			days.push(i);
		}

		db.all(query, (err, rows) => {
			if (err) return console.log(err);

			days = days.map(day => {
				const formatedDate = new Date(day);
				let measurements = rows.filter(row => row.meas_date == day);

				if (measurements.length == 0) {
					Object.keys(am).map(key => am[key].push(null));
					Object.keys(pm).map(key => pm[key].push(null));
				} else if (measurements.length == 1) {
					if (measurements[0].tod == 0) {
						Object.keys(am).map(key => am[key].push(measurements[0][key]));
						Object.keys(pm).map(key => pm[key].push(null));
					} else {
						Object.keys(pm).map(key => pm[key].push(measurements[0][key]));
						Object.keys(am).map(key => am[key].push(null));
					}
				} else {
					for (let data of measurements) {
						if (data.tod == 0) {
							Object.keys(am).map(key => am[key].push(data[key]));
						} else {
							Object.keys(pm).map(key => pm[key].push(data[key]));
						}
					}
				}

				return `${formatedDate.getMonth() + 1}-${formatedDate.getDate()}-${formatedDate.getFullYear()}`;
			});

			this.sendSocketNotification("UPDATE_BP", {days: days, am: am, pm: pm});
		});
	}
});

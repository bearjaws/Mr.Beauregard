const bluebird = require('bluebird');
const notifier = require('node-notifier');
const fspath = require('path');
const name = 'Mr.Beauregard';
const title = 'Mr.Beauregard';
let dbPath = require('os').homedir() + '/.beauregard.db';
let Datastore = require('nedb')
    , nedb = new Datastore({ filename: dbPath, autoload: true, timestampData: true });


nedb = bluebird.promisifyAll(nedb);
nedb.persistence.setAutocompactionInterval(60000);
function notifierBaseConfig() {
    // Deep clone
    return JSON.parse(JSON.stringify({
        title: title,
        message: 'Test message please ignore?',
        icon: fspath.join(__dirname, './assets/mr-beauregard.jpg'),
        sound: false, // Only Notification Center or Windows Toasters
        wait: true, // Wait with callback, until user action is taken against notification,
        timeout: 120
    }));
}
function recurringQuestion() {
    console.log('notifiying');
    notifier.notify({

        actions: ['Test this thing', 'Write the other thing', 'Something new', 'one more time', 'time time time '],
        timeout: 120
    }, function (err, response) {
        console.log(response);
    });
}

let event = null;

let test = nedb.findAsync({ '_id': 'setupComplete'}).then(async function(rows) {
    console.log(rows);
    if (rows.length === 0) {
        firstRun();
    }
    let timing = await nedb.findAsync({ '_id': 'timing'});
    let tasks = await nedb.findAsync({ '_id': 'tasks'});

});
// notifier.on('timeout', function (notifierObject, options) {
//     console.log('timeout');
//     clearInterval(event);
//     event = setTimeout(recurringQuestion, 30000);
// });
//
// notifier.on('replied', function (notifierObject, options, response) {
//     console.log(response);
//     clearInterval(event);
//     event = setTimeout(recurringQuestion, 600000);
// });
//
// notifier.on('click', function(notifier, options, response) {
//     console.log(arguments);
// });


async function firstRun() {
    let config = notifierBaseConfig();
    config.message = 'This is ' + name + '. You interact with him through notifications.';
    config.closeLabel = 'Unsubscribe';
    config.actions = 'Ok';
    return new bluebird(function(resolve, reject) {
        notifier.notify(config, function (err, response, test) {
            config = notifierBaseConfig();
            config.message = 'He helps you complete tasks by letting you track up to 5 priorities.';
            notifier.notify(config, function (err, response, test) {
                setTimeing(resolve, reject);
            });
        });
    });
}

function inquire(timing, tasks) {
    let config = notifierBaseConfig();
    config.message = 'What are you currently working on?';
    config.reply = 'First task';

}

function lastQuestion(timing, tasks) {
    let config = notifierBaseConfig();
    config.message = 'Anything else I can help you with?';
    config.actions = ['Configure timing', 'Add another task', 'Remove a task'];
    notifier.notify(config, function (err, response, test) {

    });

    }

async function setTimeing(resolve) {
    let config = notifierBaseConfig();
    config.message = 'How often do you want ' + name + ' to show up?';
    config.actions = ['1 Minute', '5 Minutes', '10 Minutes', '15 Minutes', '30 Minutes'];
    config.timeout = 360;
    notifier.notify(config, async function (err, thing, response) {
        var seconds = 3600;
        switch (Number(response.activationValueIndex)) {
            case 0:
                seconds = 60;
                break;
            case 1:
                seconds = 300;
                break;
            case 2:
                seconds = 600;
                break;
            case 3:
                seconds = 900;
                break;
            case 4:
                seconds = 1800;
                break;
        }
        let timingConfig = {
            'values': {
                'seconds': seconds,
                'milliseconds': seconds * 1000
            }
        };

        try {
            let current = await nedb.findAsync({'_id': 'timing'});
            if (current.length !== 0) {
               await nedb.updateAsync({ '_id': 'timing' }, { $set: timingConfig });
            } else {
                timingConfig._id = 'timing';
                await nedb.insertAsync(timingConfig);
                await nedb.insertAsync({
                    '_id': 'setupComplete',
                    'value': true
                });
                resolve();
            }
        } catch(err) {
            console.log(err);
            let config = notifierBaseConfig();
            config.message = name + ' cannot write to: ' + dbPath + ' please enable rw+ permissions';
            notifier.notify(config, function() {
                process.exit(1);
            });
        }
    });
}
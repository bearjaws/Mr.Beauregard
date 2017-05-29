const crypto = require('crypto');

class Database {

    constructor(nedb) {
        this.nedb = nedb;

        this.timingKey = {
            '_id': 'timing'
        };
        this.tasksKey = {
            '_id': 'tasks'
        };
    }

    async getTiming() {
        let current = await this.nedb.findAsync(this.timingKey);
        if (current.length === 0) {
            return false;
        }
        return current[0];
    }

    async getTasks() {
        await this.nedb.findAsync(this.tasksKey);
    }

    async addTask(taskText) {
        await this.nedb.insertAsync({
            '_id': this.getTaskIdFromText(taskText),
            'text': taskText,
            'timeLogs': [],
            'totalTime': 0
        });

        let tasks = this.nedb.findAsync(this.tasksKey);
        // @todo need to switch this to an array of tasks {id: <taskIdFromText>, text: text}> for use in menu options
        if (tasks.length === 0) {
            tasks = {
                tasks: []
            };
        } else {
            tasks = tasks[0];
        }
        tasks._id = this.tasksKey['_id'];
        tasks.keys.push(this.getTaskIdFromText(taskText));
        tasks.insertAsync(tasks);
    }

    async addTimeToTask(text) {
        let key = this.getTaskIdFromText(text);
        let timing = await this.getTiming();
        let seconds = timing.value.seconds;
        await this.nedb.update({
            '_id': key
        }, {
            $push: {
                timeLogs: {
                    date: new Date(),
                    seconds: seconds
                }
            }
        });

        // @todo get total time and add seconds to it.
        // await this.nedb.update({
        //     '_id': key
        // }, {
        //     totalTime
        // });

    }

    getTaskIdFromText(text) {
        let hash = crypto.createHash('sha256');
        return hash.update(text).digest('hex');
    }

    async getTaskById(id) {
        return await this.nedb.findAsync({
            '_id': id
        });
    }

    async getTaskByText(text) {
        let key = this.getTaskIdFromText(text);
        return await this.nedb.findAsync({
            '_id': key
        });
    }

    async upsertTiming(timingConfig) {
        let current = await this.getTiming(this.timingKey);
        if (current === false) {
            timingConfig._id = this.timingKey['_id'];
            return await this.nedb.insertAsync(timingConfig);
        }
        delete timingConfig._id;
        await this.nedb.updateAsync(this.timingKey, { $set: timingConfig });
    }

}

module.exports = Database;
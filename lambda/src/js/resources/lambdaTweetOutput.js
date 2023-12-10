class LambdaTweetOutput {
    constructor(userId, content, channelId, timestampUtcIso8601) {
        this.userId = userId;
        this.content = content;
        this.channelId = channelId;
        this.timestampUtcIso8601 = timestampUtcIso8601;
    }
}

module.exports = LambdaTweetOutput;
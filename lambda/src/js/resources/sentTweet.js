class SendTweetDto {
    constructor(userId, content) {
        this.userId = userId;
        this.content = content;
    }
}

module.exports = SendTweetDto;
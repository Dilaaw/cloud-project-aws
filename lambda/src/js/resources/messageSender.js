const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const ISO8601_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
});
const TABLE_NAME = 'dynamodb-all-messages';
const CHANNEL_ID = 'echo';

exports.handler = async (event, context) => {
    const timestampUtcIso8601 = ISO8601_FORMATTER.format(new Date());

    const params = {
        TableName: TABLE_NAME,
        Item: {
            'channel_id': CHANNEL_ID,
            'timestamp_utc_iso8601': timestampUtcIso8601,
            'user_id': event.userId,
            'content': event.content
        }
    };

    try {
        return await docClient.put(params).promise();
    } catch (error) {
        console.error(error);
        return null;
    }
};

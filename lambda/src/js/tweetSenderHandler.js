const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'dynamodb-all-messages';

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
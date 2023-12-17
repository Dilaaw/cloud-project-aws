const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const {
    TABLE_NAME,
    CHANNEL_ID
} = require('../const/constant');

exports.handler = async (event, context) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'channel_id = :v_id',
        ExpressionAttributeValues: {
            ':v_id': CHANNEL_ID
        },
        ScanIndexForward: false
    };

    try {
        const data = await docClient.query(params).promise();
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data.Items)
        };
    } catch (error) {
        console.error(error);
        return null;
    }
};

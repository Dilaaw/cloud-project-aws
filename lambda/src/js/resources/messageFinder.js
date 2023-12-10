const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

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
        return JSON.stringify(data.Items);
    } catch (error) {
        console.error(error);
        return null;
    }
};

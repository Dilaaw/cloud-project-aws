const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const {
    ISO8601_FORMATTER,
    TABLE_NAME,
    CHANNEL_ID
} = require('../const/constant');
const axios = require('axios');

exports.handler = async (event, context) => {
    const timestampUtcIso8601 = ISO8601_FORMATTER.format(new Date());

    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { 'Accept': 'application/json' }
        });

        if (response.status === 200) {
            const joke = response.data.joke;

            const params = {
                TableName: TABLE_NAME,
                Item: {
                    'channel_id': CHANNEL_ID,
                    'timestamp_utc_iso8601': timestampUtcIso8601,
                    'user_id': '-- System --',
                    'content': joke
                }
            };

            await docClient.put(params).promise();

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Blague enregistrée avec succès' })
            };
        } else {
            throw new Error(`Erreur API : ${response.status}`);
        }
    } catch (error) {
        console.error(`Erreur lors de l'obtention de la blague : ${error.message}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Erreur lors de l'obtention de la blague" })
        };
    }
};

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const axios = require('axios');
const {
    ISO8601_FORMATTER,
    TABLE_NAME,
    CHANNEL_ID,
    WEATHER_API_URL
} = require('../const/constant');

async function getWeather() {
    try {
        const response = await axios.get(WEATHER_API_URL);
        if (response.status === 200) {
            return response.data.current.temperature_2m;
        } else {
            throw new Error(`Erreur API : ${response.status}`);
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération de la météo : ${error.message}`);
        throw error;
    }
}

exports.handler = async (event, context) => {
    const timestampUtcIso8601 = ISO8601_FORMATTER.format(new Date());

    const temperature = await getWeather();

    const params = {
        TableName: TABLE_NAME,
        Item: {
            'channel_id': CHANNEL_ID,
            'timestamp_utc_iso8601': timestampUtcIso8601,
            'user_id': event.userId,
            'content': `La température de Lille est actuellement de ${temperature}°C`
        }
    };

    try {
        return await docClient.put(params).promise();
    } catch (error) {
        console.error(error);
        return null;
    }
};

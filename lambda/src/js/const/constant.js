const ISO8601_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
});

// Ajout des constantes pour dynamodb
const TABLE_NAME = 'dynamodb-all-messages';
const CHANNEL_ID = 'echo';

// URL pour la météo (ici c'est la ville de Lille)
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=50.62925&longitude=3.057256&current=temperature_2m&timezone=auto'

module.exports = {
    ISO8601_FORMATTER,
    TABLE_NAME,
    CHANNEL_ID,
    WEATHER_API_URL
};

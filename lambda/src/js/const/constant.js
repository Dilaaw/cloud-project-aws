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

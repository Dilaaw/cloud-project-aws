const poolInfo = {
    UserPoolId: "eu-west-1_RD81Pwt9p",
    ClientId: "3mmiqd0uajiascl5g86njjcdkn"
}
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolInfo);

let token = null;
let nextLastEvaluatedKey = null;

function handleSignUp(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("username").value;
    const emailInput = document.getElementById("email").value;
    const passwordInput = document.getElementById("password").value;

    const emailAttribute = new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: "email",
        Value: emailInput,
    });

    userPool.signUp(usernameInput, passwordInput, [emailAttribute], null, (err, result) => {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        localStorage.setItem('userSignedUp', 'true');
        localStorage.setItem('username', usernameInput);
        window.location.href = 'verification.html';
    });
}

function handleConfirmCode(event) {
    event.preventDefault();

    const digitInputs = document.querySelectorAll('.digit-input');
    let codeInput = '';
    digitInputs.forEach(input => {
        codeInput += input.value;
    });

    const usernameInput = localStorage.username;
    console.log("Username input:", usernameInput);
    console.log("Code input", codeInput)

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: usernameInput,
        Pool: userPool,
    });

    cognitoUser.confirmRegistration(codeInput, true, (err, result) => {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        alert("Compte vérifié !");
        localStorage.removeItem('username');
        localStorage.removeItem('userSignedUp');
        window.location.href = "login.html";
    });
}

function handleResendCode() {
    const usernameInput = localStorage.username;
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: usernameInput,
        Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err) => {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        alert("Le code a été renvoyé !");
    });
}

function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;

    console.log(usernameInput)
    console.log(passwordInput)

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: usernameInput,
        Pool: userPool,
    });

    console.log(cognitoUser)
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: usernameInput,
        Password: passwordInput,
    });
    console.log(authenticationDetails)
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: () => window.location.href = "forum.html",
        onFailure: (err) => alert(JSON.stringify(err)),
    });
}

function getToken(callback) {
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.error('Error getting session:', err);
                location.href = "login.html";
            } else {
                const jwtToken = session.getIdToken().getJwtToken();
                callback(jwtToken);
            }
        });
    } else {
        callback(null);
    }
}

function displayEchoMessages(messages) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    messageContainer.innerHTML = '';
    messages.forEach(message => {
        const echoMessageDiv = document.createElement('div');
        echoMessageDiv.classList.add('echo');

        const messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('message-content');
        messageContentDiv.textContent = `Message: ${message.content}`;

        const userInfoDiv = document.createElement('div');
        userInfoDiv.classList.add('user-info');
        userInfoDiv.textContent = `User: ${message.user_id}, Date: ${message.timestamp_utc_iso8601}`;

        echoMessageDiv.appendChild(messageContentDiv);
        echoMessageDiv.appendChild(userInfoDiv);
        messageContainer.appendChild(echoMessageDiv);
    });
}

function loadEchoMessages(limit = 10, lastKey = null) {
    if (!document.getElementById('messageContainer')) return;

    console.log("Loading messages");
    getToken(function (token) {
        fetch('https://kioz0r4i2g.execute-api.eu-west-1.amazonaws.com/echo/messages', {
            method: "POST",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                routeKey: 'GET /messages',
                last_evaluated_key: lastKey,
                limit
            })
        })
            .then(response => response.json())
            .then(result => {
                const data = JSON.parse(result.body);
                nextLastEvaluatedKey = data.last_evaluated_key ? data.last_evaluated_key : nextLastEvaluatedKey;
                displayEchoMessages(data.items);
            })
            .catch(err => console.error('Error loading messages:', err));
    });
}

function loadNextPage() {
    loadEchoMessages(10, nextLastEvaluatedKey);
}

function loadPreviousPage() {
    loadEchoMessages(10, null);
}

document.getElementById('messageForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const newMessageInput = document.getElementById('newMessage');
    const newMessageText = newMessageInput ? newMessageInput.value.trim() : '';
    if (newMessageText !== '') {
        sendEchoMessage(newMessageText);
        newMessageInput.value = '';
    }
});

function sendEchoMessage(messageText) {
    if (!document.getElementById('messageContainer')) return;

    getToken(function (token) {
        const currentTime = new Date();
        const timestamp = currentTime.toISOString();
        const currentUser = userPool.getCurrentUser();
        const userId = currentUser ? currentUser.username : 'unknown';
        const channelId = 'echo';

        const messagePayload = {
            content: messageText,
            user_id: userId,
            channel_id: channelId,
            timestamp_utc_iso8601: timestamp,
            routeKey: 'POST /messages'
        };

        fetch('https://kioz0r4i2g.execute-api.eu-west-1.amazonaws.com/echo/messages', {
            method: "POST",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagePayload)
        })
            .then(response => response.json())
            .then(result => {
                console.log('Message sent successfully:', result);
                loadEchoMessages();
            })
            .catch(err => console.error('Error sending message:', err));
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('messageContainer')) {
        loadEchoMessages();
    }
});

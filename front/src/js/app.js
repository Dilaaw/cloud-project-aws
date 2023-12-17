const poolInfo = {
    UserPoolId: "eu-west-1_RD81Pwt9p",
    ClientId: "3mmiqd0uajiascl5g86njjcdkn"
}
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolInfo);

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
                console.error('Impossible d\'obtenir la session:', err);
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

function loadChatMessages() {
    getToken(token => {
        if (!token) {
            console.error('Pas de token disponible');
            return;
        }

        fetch('https://kioz0r4i2g.execute-api.eu-west-1.amazonaws.com/echo/messages', {
            method: "GET",
            headers: { 'Authorization': token }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau | Mauvaise réponse');
                }
                return response.json();
            })
            .then(data => {
                displayEchoMessages(JSON.parse(data.body));
            })
            .catch(error => {
                console.error('Erreur dans la lecture des messages:', error);
            });
    });
}

function onMessageFormSubmit(event) {
    event.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    const currentUser = userPool.getCurrentUser();
    const userId = currentUser ? currentUser.username : 'unknown';

    if (messageText) {
        sendMessage({ userId, content: messageText });
        detectJokeCommand(messageText);
        messageInput.value = '';
    }
}

function sendMessage(messageData) {
    getToken(token => {
        if (!token) {
            console.error('Pas de token disponible.');
            return;
        }

        fetch('https://kioz0r4i2g.execute-api.eu-west-1.amazonaws.com/echo/messages', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(messageData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau | Mauvaise réponse');
                }
                return response.json();
            })
            .then(() => {
                loadChatMessages();
            })
            .catch(error => {
                console.error("Erreur dans l'envoi du message:", error);
            });
    });
}

function displayEchoMessages(messages) {
    const messageContainer = document.querySelector('#messageContainer');
    messageContainer.innerHTML = '';

    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('echo-message');

        const authorElement = document.createElement('div');
        authorElement.classList.add('message-author');
        const userNameSpan = document.createElement('span');
        userNameSpan.textContent = message.user_id || 'Utilisateur inconnu';
        authorElement.appendChild(userNameSpan);

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('message-timestamp');
        timestampElement.textContent = message.timestamp_utc_iso8601 || 'Date inconnue';
        authorElement.appendChild(timestampElement);

        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = message.content || 'Contenu non disponible';

        messageElement.appendChild(authorElement);
        messageElement.appendChild(contentElement);
        messageContainer.appendChild(messageElement);
    });
}

function sendJoke() {
    getToken(token => {
        if (!token) {
            console.error('Pas de token disponible.');
            return;
        }

        fetch('https://kioz0r4i2g.execute-api.eu-west-1.amazonaws.com/echo/joke', {
            method: "GET",
            headers: {
                'Authorization': token
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau | Mauvaise réponse');
                }
                return response.json();
            })
            .then(() => {
                console.log('Blague envoyée avec succès depuis l\'API Gateway.');
            })
            .then(() => {
                loadChatMessages();
            })
            .catch(error => {
                console.error('Erreur dans l\'envoi de la blague depuis l\'API Gateway:', error);
            });
    });
}

function detectJokeCommand(messageText) {
    if (messageText.includes('/joke') || messageText.includes('/blague')) {
        sendJoke();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatContainer')) {
        getToken(token => {
            if (!token) {
                console.error('Pas de token disponible');
                window.location.href = 'login.html';
            } else {
                loadChatMessages();
            }
        });
    }
});


const messageForm = document.getElementById('messageForm');
if (messageForm) {
    messageForm.addEventListener('submit', onMessageFormSubmit);
}

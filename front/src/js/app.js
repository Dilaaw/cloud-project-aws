const poolInfo = {
    UserPoolId: "eu-west-1_53O8CjEQm",
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
    const usernameInput = localStorage.getItem('username');
    const codeInput = document.getElementById("verification-code").value;

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
        window.location.href = "login.html";
    });
}

function handleResendCode() {
    const usernameInput = document.getElementById("username").value;
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

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: usernameInput,
        Pool: userPool,
    });

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: usernameInput,
        Password: passwordInput,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: () => window.location.href = "index.html",
        onFailure: (err) => alert(JSON.stringify(err)),
    });
}

let token = null;

function getToken(callback) {
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.error(err);
                location.href = "login.html";
            } else {
                const token = session.getIdToken().getJwtToken();
                callback(token);
            }
        });
    } else {
        callback(null);
    }
}

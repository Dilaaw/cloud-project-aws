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

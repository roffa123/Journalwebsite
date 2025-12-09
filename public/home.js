if (auth.isLoggedIn()) {
    document.getElementById('title').textContent = 'Welcome Back!';
    document.getElementById('message').textContent = 'You are logged in successfully!';
    document.getElementById('primaryBtn').href = '#';
    document.getElementById('primaryBtn').textContent = 'Logout';
    document.getElementById('primaryBtn').onclick = (e) => {
        e.preventDefault();
        auth.logout();
        window.location.href = '/';
    };
    document.getElementById('secondaryBtn').style.display = 'none';
} else {
    document.getElementById('message').textContent = 'Please login or register to continue.';
    document.getElementById('primaryBtn').textContent = 'Login';
    document.getElementById('secondaryBtn').textContent = 'Register';
}

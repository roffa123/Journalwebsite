document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            auth.login(data.user);
            alert(data.message);
            window.location.href = '/dashboard';
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Error logging in');
        console.error(error);
    }
});

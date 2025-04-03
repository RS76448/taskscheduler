document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginButton').addEventListener('click', async () => {
      if(localStorage.getItem('token')) {
        location.href = '/api/users/profileview';
        return;
      }
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        alert("Please fill in all fields");
        return;
      }

      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          window.location.href = '/api/users/profileview';
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  });



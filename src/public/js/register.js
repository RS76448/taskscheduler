document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Form validation
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-danger';
      errorDiv.textContent = 'Passwords do not match';
      document.querySelector('.auth-form').insertBefore(errorDiv, document.querySelector('form'));
      return;
    }
    
    // Prepare data
    const formData = {
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      password: password
    };
    
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token and redirect
        localStorage.setItem('token', data.token);
        window.location.href = '/api/users/profileview';
      } else {
        // Display error
        // alert(data.message || 'Registration failed');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = data.message || 'Registration failed';
        document.querySelector('.auth-form').insertBefore(errorDiv, document.querySelector('form'));
        window.scrollTo(0, 0); // Scroll to top to show error message
        setTimeout(() => {
          errorDiv.remove();
        }, 3000); // Remove error message after 3 seconds
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
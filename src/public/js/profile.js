  // Function to fetch user profile
  async function fetchProfile() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        displayProfile(data.user);
      } else {
        // If token is invalid or expired
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('profile-data').innerHTML = `
        <div class="alert alert-danger">Error loading profile data</div>
      `;
    }
  }
  
  // Function to display user profile data
  function displayProfile(user) {
    const profileContainer = document.getElementById('profile-data');
    
    // Format date
    const createdDate = new Date(user.createdAt).toLocaleDateString();
    
    profileContainer.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar">

        </div>
        
        <div class="profile-details">
          <div class="profile-field">
            <span class="field-label">Username:</span>
            <span class="field-value">${user.username}</span>
          </div>
          
          <div class="profile-field">
            <span class="field-label">Email:</span>
            <span class="field-value">${user.email}</span>
          </div>
          
          <div class="profile-field">
            <span class="field-label">Member Since:</span>
            <span class="field-value">${createdDate}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // Logout functionality
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  });
  
  // Fetch profile data when page loads
  document.addEventListener('DOMContentLoaded', fetchProfile);
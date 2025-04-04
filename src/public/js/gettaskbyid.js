document.addEventListener('DOMContentLoaded', function() {
    // Extract task ID from URL
    const pathParts = window.location.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];
    
    // Get elements
    const loadingElement = document.getElementById('loading');
    const taskDetailsElement = document.getElementById('task-details');
    const taskActionsElement = document.getElementById('task-actions');
    const errorContainer = document.getElementById('error-container');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const rescheduleTaskBtn = document.getElementById('reschedule-task-btn');
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to view task details.');
      window.location.href = '/api/users/loginview'; // Redirect to login page
      return;
    }
    // Fetch task data
    fetch(`/api/tasks/${taskId}`, {
    
      headers: { "Authorization": `Bearer ${token}` },
     
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch task details');
        }
        return response.json();
      })
      .then(task => {
        // Populate task details
        document.getElementById('task-name').textContent = task.task.name || 'N/A';
        document.getElementById('task-status').textContent = task.task.status || 'N/A';
        document.getElementById('task-description').textContent = task.task.description || 'N/A';
        document.getElementById('task-schedule-time').textContent = task.task.scheduleTime || 'N/A';
        document.getElementById('task-type').textContent = task.task.type || 'N/A';
        // document.getElementById('task-payload').textContent = JSON.stringify(task.payload) || 'N/A';
        document.getElementById('task-max-retries').textContent = task.task.maxRetries || 'N/A';
        
        // Show/hide action buttons based on status
        if (task.status !== "canceled") {
          cancelTaskBtn.href = `/api/tasks/${taskId}/cancel`;
          rescheduleTaskBtn.href = `/api/tasks/${taskId}/rescheduleview`;
          taskActionsElement.style.display = 'block';
        }
        
        // Hide loading, show task details
        loadingElement.style.display = 'none';
        taskDetailsElement.style.display = 'block';
      })
      .catch(error => {
        loadingElement.style.display = 'none';
        errorContainer.textContent = error.message;
        errorContainer.style.display = 'block';
        console.error('Error fetching task details:', error);
      });
  });
// public/js/createTask.js
document.addEventListener('DOMContentLoaded', () => {

document.getElementById('create-task-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission
    const authtoken=localStorage.getItem('token');
    if (!authtoken) {
      alert('Please log in to create a task.');
      return;
    }
    // Collect form data
    const formData = new FormData(event.target);
    const taskData = {
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      scheduleType: formData.get('scheduleType'),
      scheduleTime: formData.get('scheduleTime') || null,
      cronExpression: formData.get('cronExpression') || null,
      maxRetries: formData.get('maxRetries'),
    };

    // const taskData={
    //     "name": "ljlkj",
    //     "description": "ljlk",
    //     "type": "one_time",
    //     "scheduleType": "specific_time",
    //     "scheduleTime": "2025-04-02T18:07",
    //     "cronExpression": null,
    //     "maxRetries": "3"
    // }
    console.log("Form submitted",taskData); // Debugging line
    // Display loading message
    // document.getElementById('message').innerHTML = 'Creating task...';
  
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Get auth token from localStorage
        },
        body: JSON.stringify(taskData)
      });
      console.log('Response:', response); // Debugging line
      const result = await response.json();
      
      if (result.success) {
        // If task creation was successful
        alert('Task created successfully!');
       window.location.reload(); // Reload the page to see the new task
      } else {
        // If there was an error
        document.getElementById('message').innerHTML = `Error: ${result.message}`;
      }
    } catch (error) {
      document.getElementById('message').innerHTML = 'Error: Could not communicate with the server.';
      console.error('Error creating task:', error);
    }
  });
  
  // Show or hide fields based on schedule type
  document.getElementById('scheduleType').addEventListener('change', function() {
    const scheduleType = this.value;
    
    if (scheduleType === 'recurring') {
      document.getElementById('cron-div').style.display = 'block';
      document.getElementById('schedule-time-div').style.display = 'none';
    } else {
      document.getElementById('cron-div').style.display = 'none';
      document.getElementById('schedule-time-div').style.display = 'block';
    }
  });
})
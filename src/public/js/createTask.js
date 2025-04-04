// // public/js/createTask.js
// document.addEventListener('DOMContentLoaded', () => {

// document.getElementById('create-task-form').addEventListener('submit', async function(event) {
//     event.preventDefault(); // Prevent default form submission
//     const authtoken=localStorage.getItem('token');
//     if (!authtoken) {
//       alert('Please log in to create a task.');
//       return;
//     }
//     // Collect form data
//     const formData = new FormData(event.target);
//     const taskData = {
//       name: formData.get('name'),
//       description: formData.get('description'),
//       type: formData.get('type'),
//       scheduleType: formData.get('scheduleType'),
//       scheduleTime: formData.get('scheduleTime') || null,
//       cronExpression: formData.get('cronExpression') || null,
//       maxRetries: formData.get('maxRetries'),
//     };

//     // const taskData={
//     //     "name": "ljlkj",
//     //     "description": "ljlk",
//     //     "type": "one_time",
//     //     "scheduleType": "specific_time",
//     //     "scheduleTime": "2025-04-02T18:07",
//     //     "cronExpression": null,
//     //     "maxRetries": "3"
//     // }
//     console.log("Form submitted",taskData); // Debugging line
//     // Display loading message
//     // document.getElementById('message').innerHTML = 'Creating task...';
  
//     try {
//       const response = await fetch('/api/tasks', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}` // Get auth token from localStorage
//         },
//         body: JSON.stringify(taskData)
//       });
//       console.log('Response:', response); // Debugging line
//       const result = await response.json();
      
//       if (result.success) {
//         // If task creation was successful
//         alert('Task created successfully!');
//        window.location.reload(); // Reload the page to see the new task
//       } else {
//         // If there was an error
//         document.getElementById('message').innerHTML = `Error: ${result.message}`;
//       }
//     } catch (error) {
//       document.getElementById('message').innerHTML = 'Error: Could not communicate with the server.';
//       console.error('Error creating task:', error);
//     }
//   });
  
//   // Show or hide fields based on schedule type
//   document.getElementById('scheduleType').addEventListener('change', function() {
//     const scheduleType = this.value;
    
//     if (scheduleType === 'recurring') {
//       document.getElementById('cron-div').style.display = 'block';
//       document.getElementById('schedule-time-div').style.display = 'none';
//     } else {
//       document.getElementById('cron-div').style.display = 'none';
//       document.getElementById('schedule-time-div').style.display = 'block';
//     }
//   });
// })


document.addEventListener('DOMContentLoaded', function() {
  const scheduleTypeSelect = document.getElementById('scheduleType');
  const specificTimeGroup = document.getElementById('specificTimeGroup');
  const delayTimeGroup = document.getElementById('delayTimeGroup');
  
  // Handle schedule type changes
  scheduleTypeSelect.addEventListener('change', function() {
    if (this.value === 'delay') {
      // specificTimeGroup.style.display = 'none';
      delayTimeGroup.style.display = 'block';
    } else if (this.value === 'specific_time') {
      specificTimeGroup.style.display = 'block';
      delayTimeGroup.style.display = 'none';
    } else {
      // For recurring, you might want to show a cron expression input
      specificTimeGroup.style.display = 'block';
      delayTimeGroup.style.display = 'none';
    }
  });
  
  // Handle form submission
  document.getElementById('create-task-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    const authtoken=localStorage.getItem('token');
    if (!authtoken) {
      alert('Please log in to create a task.');
      return;
    }
    
    // Get form data
    const formData = new FormData(this);
    
    
    const taskData = {
      delayHours: formData.get('delayHours') || null,
      delayMinutes: formData.get('delayMinutes') || null,
      delaySeconds: formData.get('delaySeconds') || null,
      delayMs:formData.get('delayMs') || null,
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      scheduleType: formData.get('scheduleType'),
      scheduleTime: formData.get('scheduleTime') || null,
      cronExpression: formData.get('cronExpression') || null,
      maxRetries: formData.get('maxRetries'),
    };
    // Calculate delay in milliseconds if delay type is selected
    if (taskData.scheduleType === 'delay') {
      const hours = parseInt(taskData.delayHours) || 0;
      const minutes = parseInt(taskData.delayMinutes) || 0;
      const seconds = parseInt(taskData.delaySeconds) || 0;
      
      // Convert to milliseconds
      const delayMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      taskData.delayMs = delayMs;
      
      console.log(`Delay time: ${hours}h ${minutes}m ${seconds}s = ${delayMs}ms`);
    }
    console.log("Form submitted",taskData); // Debugging line
    // Send data to server (you'll need to implement this part)
    fetch('/api/tasks', {
      method: 'POST',
      headers: { "Authorization": `Bearer ${authtoken}`,
      accept: 'application/json',
      'Content-Type': 'application/json' 
    },
      body: JSON.stringify(taskData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('success-message').textContent = 'Task created successfully!';
        document.getElementById('success-message').style.display = 'block';
        document.getElementById('create-task-form').reset();
      
        // reload the page to see the new task
        // window.location.reload(); // Reload the page to see the new task
      } else {
        throw new Error(data.message || 'Error creating task');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error creating task: ' + error.message);
    });
  });
  

});



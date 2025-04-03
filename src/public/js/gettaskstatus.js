document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      document.getElementById("auth-message").innerHTML = 
        '<p>Please <a href="/login">log in</a> to view task statistics.</p>';
      return;
    }

    try {
      const response = await fetch("/api/tasks/stats", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
    //   alert(JSON.stringify(data));
    //   if (!data.status) throw new Error("Failed to fetch data");

     
    
      // Populate task stats
      const taskStatsBody = document.getElementById("task-stats-body");
      taskStatsBody.innerHTML = Object.entries(data.taskStats)
        .map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`)
        .join("");

      // Populate queue stats
       // Populate queue stats
       document.getElementById("waiting-tasks").textContent = data.queueStats.waiting;
       document.getElementById("active-tasks").textContent = data.queueStats.active;
       document.getElementById("completed-tasks").textContent = data.queueStats.completed;
       document.getElementById("failed-tasks").textContent = data.queueStats.failed;
       document.getElementById("total-tasks").textContent = data.queueStats.total;
      
    } catch (error) {
      document.getElementById("auth-message").innerHTML = 
        '<p style="color: red;">Failed to fetch data. Try logging in again.</p>';
    }
  });
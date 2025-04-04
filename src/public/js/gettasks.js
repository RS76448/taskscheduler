document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    document.getElementById("auth-message").innerHTML = '<p>Please <a href="/login">login</a> to view tasks.</p>';
    document.querySelector(".task-list").style.display = "none";
    return;
  }

  var taskBody = document.getElementById("task-body");
  const paginationInfo = document.getElementById("pagination-info");
  let page = 1;
  const limit = 8;
  let loading = false;
  let allLoaded = false;
  function repositionTrigger() {
    if (document.getElementById("load-more-trigger")) {
      document.getElementById("load-more-trigger").remove(); // Remove old trigger
    }
    const loadMoreTrigger = document.createElement("div");
    loadMoreTrigger.id = "load-more-trigger";
    taskBody.appendChild(loadMoreTrigger); // Append inside taskBody
    observer.observe(loadMoreTrigger); // Reattach observer
  }
  async function loadTasks() {
    if (loading || allLoaded) return;
    loading = true;
    paginationInfo.innerText = "Loading more tasks...";
    
    try {
      const response = await fetch(`/api/tasks?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.tasks.length === 0) {
        allLoaded = true;
        paginationInfo.innerText = "No more tasks";
        return;
      }
      
      data.tasks.forEach(task => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${task.name}</td>
          <td>${task.status}</td>
          <td>${new Date(task.scheduleTime).toLocaleString() }</td>
          <td>${new Date(task.createdAt).toLocaleString()}</td>
          <td>${task.description}</td>
          <td>${task.scheduleType}</td>
          <td>${task.error ? task.error : "None"}</td>
          <td>
            <a href="/api/tasks/view/${task._id}">View</a> |
            ${(task.status !== "canceled"||task.status !== "completed") ? `<a href="/api/tasks/${task._id}/cancel">Cancel</a> |` : ""}
             ${(task.status !== "canceled"||task.status !== "completed") ? ` <a href="/api/tasks/${task._id}/rescheduleview">Reschedule</a> |` : ""}
           
          </td>
        `;
        taskBody.appendChild(row);
       
      });

      page++;
      repositionTrigger(); 
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      loading = false;
      paginationInfo.innerText = "";
    }
  }

  // Infinite scrolling with Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    console.log("Observer triggered:", entries[0]); // Debugging

    if (entries[0].isIntersecting) {
      console.log("Loading more tasks...");
      loadTasks();
    }
  }, { threshold: 1.0 }); // Reduced threshold for better triggering

  // Add the trigger element at the end of the task list

  

  const loadMoreTrigger = document.createElement("div");
  loadMoreTrigger.id = "load-more-trigger";
  loadMoreTrigger.style.height = "10px"; // Ensure it has height
  taskBody.appendChild(loadMoreTrigger); // Appending inside the scrollable area

  observer.observe(loadMoreTrigger);

  // Initial Load
  loadTasks();
});

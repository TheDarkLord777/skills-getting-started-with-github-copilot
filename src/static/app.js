document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to escape text inserted into HTML
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${escapeHtml(details.schedule)}`;

        const avail = document.createElement("p");
        avail.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(avail);

        // Participants section
        const participants = details.participants || [];
        if (participants.length) {
          const partDiv = document.createElement("div");
          partDiv.className = "participants";

          const count = document.createElement("div");
          count.className = "participant-count";
          count.textContent = `Participants (${participants.length}):`;

          const ul = document.createElement("ul");

          participants.forEach((p) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.className = "participant-badge";
            span.textContent = p;

            // delete button
            const del = document.createElement("button");
            del.className = "delete-participant";
            del.type = "button";
            del.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            del.dataset.activity = name;
            del.dataset.email = p;
            del.textContent = "✖";

            // attach handler
            del.addEventListener("click", async (ev) => {
              ev.preventDefault();
              await unregisterParticipant(name, p);
            });

            li.appendChild(span);
            li.appendChild(del);
            ul.appendChild(li);
          });

          partDiv.appendChild(count);
          partDiv.appendChild(ul);
          activityCard.appendChild(partDiv);
        } else {
          const none = document.createElement("div");
          none.className = "participants info";
          none.textContent = "No participants yet";
          activityCard.appendChild(none);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }


  // Unregister helper
  async function unregisterParticipant(activity, email) {
    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await resp.json();

      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        // Refresh activities to update UI
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    } catch (err) {
      console.error("Error unregistering:", err);
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly signed-up participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

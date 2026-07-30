document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("task-input");
    const btnLaunch = document.getElementById("btn-launch");
    const launchLoader = document.getElementById("launch-loader");
    const btnText = document.querySelector(".btn-text");
    const businessIdDisplay = document.getElementById("business-id-display");
    const emptyState = document.getElementById("empty-state");
    const dagContainer = document.getElementById("dag-container");

    let businessId = null;
    let pollInterval = null;

    // Initialize application
    async function init() {
        try {
            const res = await fetch("/api/v1/setup");
            const data = await res.json();
            businessId = data.business_id;
            businessIdDisplay.textContent = `Business ID: ${businessId.substring(0, 8)}...`;
            
            // Start polling right away in case there are active tasks
            startPolling();
        } catch (err) {
            businessIdDisplay.textContent = "Failed to connect";
            businessIdDisplay.style.color = "var(--status-failed)";
            console.error("Initialization failed:", err);
        }
    }

    // Launch a new task
    btnLaunch.addEventListener("click", async () => {
        const description = taskInput.value.trim();
        if (!description || !businessId) return;

        setLoading(true);
        
        try {
            const res = await fetch(`/api/v1/tasks/${businessId}/queue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, priority: 10 })
            });
            
            if (res.ok) {
                taskInput.value = "";
                startPolling(); // Ensure polling is active
            }
        } catch (err) {
            console.error("Failed to launch task:", err);
            alert("Failed to launch task. Check console.");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        btnLaunch.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add("hidden");
            launchLoader.classList.remove("hidden");
        } else {
            btnText.classList.remove("hidden");
            launchLoader.classList.add("hidden");
        }
    }

    // Polling mechanism
    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        fetchTasks(); // immediate fetch
        pollInterval = setInterval(fetchTasks, 2000); // poll every 2s
    }

    async function fetchTasks() {
        if (!businessId) return;
        
        try {
            const res = await fetch(`/api/v1/tasks/${businessId}`);
            const data = await res.json();
            
            if (data.tasks && data.tasks.length > 0) {
                emptyState.classList.add("hidden");
                dagContainer.classList.remove("hidden");
                renderDAG(data.tasks);
            } else {
                emptyState.classList.remove("hidden");
                dagContainer.classList.add("hidden");
            }
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        }
    }

    // Rendering Logic
    function renderDAG(tasks) {
        // Build a hierarchical tree
        const taskMap = {};
        const roots = [];

        tasks.forEach(task => {
            task.children = [];
            taskMap[task.id] = task;
        });

        tasks.forEach(task => {
            if (task.parent_id && taskMap[task.parent_id]) {
                taskMap[task.parent_id].children.push(task);
            } else {
                roots.push(task);
            }
        });

        // Sort roots by created_at desc (newest first)
        roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        dagContainer.innerHTML = "";
        roots.forEach(root => {
            dagContainer.appendChild(createTaskNodeElement(root, 0));
        });
    }

    function createTaskNodeElement(task, depth) {
        const node = document.createElement("div");
        node.className = "task-node";
        
        // CSS variables for structure
        node.style.setProperty("--indent", `${depth * 40}px`);
        if (depth > 0) {
            node.style.setProperty("--has-parent", "block");
        }

        const agentDisplay = task.agent_id ? `<span class="agent-icon">A</span> ${task.agent_id.substring(0,8)}` : "Unassigned";
        
        let resultHtml = "";
        if (task.result) {
            // Truncate long results for UI
            const shortResult = task.result.length > 300 ? task.result.substring(0, 300) + "..." : task.result;
            resultHtml = `<div class="task-result">${shortResult}</div>`;
        }

        node.innerHTML = `
            <div class="task-header">
                <span class="task-id">#${task.id.substring(0, 8)} ${task.assignee_role ? `[${task.assignee_role}]` : ''}</span>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
            <div class="task-desc">${task.description}</div>
            ${resultHtml}
            <div class="task-footer">
                <div class="task-agent">${agentDisplay}</div>
                <div>${new Date(task.created_at).toLocaleTimeString()}</div>
            </div>
        `;

        // Create a wrapper for children if they exist
        const wrapper = document.createElement("div");
        wrapper.appendChild(node);
        
        // Sort children by created_at asc (oldest first for execution order)
        task.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        task.children.forEach(child => {
            wrapper.appendChild(createTaskNodeElement(child, depth + 1));
        });

        return wrapper;
    }

    // Start
    init();
});

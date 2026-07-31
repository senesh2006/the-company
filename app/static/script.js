document.addEventListener("DOMContentLoaded", async () => {
    // UI Elements
    const appContainer = document.getElementById("app-container");
    const taskInput = document.getElementById("task-input");
    const btnLaunch = document.getElementById("btn-launch");
    const launchLoader = document.getElementById("launch-loader");
    const btnText = document.querySelector(".btn-text");
    const businessIdDisplay = document.getElementById("business-id-display");
    const emptyState = document.getElementById("empty-state");
    const dagContainer = document.getElementById("dag-container");
    const btnOpenMarket = document.getElementById("btn-open-market");
    const marketModal = document.getElementById("market-modal");
    const btnCloseMarket = document.getElementById("btn-close-market");
    const resultModal = document.getElementById("result-modal");
    const fullResultText = document.getElementById("full-result-text");
    const btnCloseResult = document.getElementById("btn-close-result");

    let businessId = null;
    let pollInterval = null;

    // Helper for authenticated API calls
    async function apiFetch(url, options = {}) {
        const headers = { ...options.headers };
        return fetch(url, { ...options, headers });
    }

    // App Initialization
    async function initBusiness() {
        try {
            const res = await apiFetch("/api/v1/setup");
            const data = await res.json();
            
            if (data.error) throw new Error(data.error);
            
            businessId = data.business_id;
            businessIdDisplay.textContent = `Business ID: ${businessId.substring(0, 8)}...`;
            startPolling();
        } catch (err) {
            businessIdDisplay.textContent = "Setup Failed";
            businessIdDisplay.style.color = "var(--status-failed)";
            console.error("Initialization failed:", err.message);
        }
    }

    // Modals and Interactions
    btnOpenMarket.addEventListener("click", () => marketModal.classList.remove("hidden"));
    btnCloseMarket.addEventListener("click", () => marketModal.classList.add("hidden"));
    btnCloseResult.addEventListener("click", () => resultModal.classList.add("hidden"));

    document.querySelectorAll(".hire-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const role = e.target.getAttribute("data-role");
            const name = prompt(`Enter a name for your new ${role}:`, `New ${role}`);
            if (!name) return;
            
            e.target.disabled = true;
            e.target.textContent = "Hiring...";
            
            try {
                const res = await apiFetch(`/api/v1/agents/${businessId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role, name })
                });
                if (res.ok) {
                    alert(`${name} has been hired!`);
                }
            } catch (err) {
                alert("Failed to hire agent");
            } finally {
                e.target.disabled = false;
                e.target.textContent = `Hire for $${role === 'Coder' ? '75' : '50'}`;
            }
        });
    });

    window.openResultModal = function(fullText) {
        fullResultText.textContent = decodeURIComponent(fullText);
        resultModal.classList.remove("hidden");
    }

    // Task Launch and Polling
    btnLaunch.addEventListener("click", async () => {
        const description = taskInput.value.trim();
        if (!description || !businessId) return;

        setLoading(true);
        try {
            const res = await apiFetch(`/api/v1/tasks/${businessId}/queue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, priority: 10 })
            });
            if (res.ok) {
                taskInput.value = "";
                startPolling();
            }
        } catch (err) {
            console.error(err);
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

    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        fetchTasks();
        pollInterval = setInterval(fetchTasks, 2000);
    }

    async function fetchTasks() {
        if (!businessId) return;
        try {
            const res = await apiFetch(`/api/v1/tasks/${businessId}`);
            if (!res.ok) return;
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
            console.error("Poll error:", err);
        }
    }

    // Rendering Logic
    function renderDAG(tasks) {
        const taskMap = {};
        const roots = [];

        tasks.forEach(task => { task.children = []; taskMap[task.id] = task; });
        tasks.forEach(task => {
            if (task.parent_id && taskMap[task.parent_id]) {
                taskMap[task.parent_id].children.push(task);
            } else {
                roots.push(task);
            }
        });

        roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        dagContainer.innerHTML = "";
        roots.forEach(root => dagContainer.appendChild(createTaskNodeElement(root, 0)));
    }

    function createTaskNodeElement(task, depth) {
        const node = document.createElement("div");
        node.className = "task-node";
        node.style.setProperty("--indent", `${depth * 40}px`);
        if (depth > 0) node.style.setProperty("--has-parent", "block");

        const agentDisplay = task.agent_id ? `<span class="agent-icon">A</span> ${task.agent_id.substring(0,8)}` : "Unassigned";
        
        let resultHtml = "";
        if (task.result) {
            const isTruncated = task.result.length > 300;
            const shortResult = isTruncated ? task.result.substring(0, 300) + "..." : task.result;
            // encodeURIComponent does not escape single quotes, which breaks the onclick handler
            const encodedResult = encodeURIComponent(task.result).replace(/'/g, "%27");
            
            resultHtml = `
                <div class="task-result">
                    ${shortResult}
                    ${isTruncated ? `<button class="btn-ghost btn-small" onclick="openResultModal('${encodedResult}')">Read More</button>` : ''}
                </div>
            `;
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

        const wrapper = document.createElement("div");
        wrapper.appendChild(node);
        task.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        task.children.forEach(child => wrapper.appendChild(createTaskNodeElement(child, depth + 1)));

        return wrapper;
    }

    // Start
    initBusiness();
});

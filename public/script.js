
async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

function showError(id, message) {
    const element = document.getElementById(id);
    if (element) element.textContent = message;
}

async function loadDashboard() {
    try {
        const data = await request("/api/dashboard");
        document.getElementById("totalMembers").textContent =
            data.totalMembers ?? data.members ?? 0;
        document.getElementById("totalPlans").textContent =
            data.totalPlans ?? data.plans ?? 0;
        document.getElementById("totalSubscriptions").textContent =
            data.totalSubscriptions ?? data.subscriptions ?? 0;
    } catch (error) {
        showError("message", error.message);
    }
}

async function loadMembers() {
    const rows = await request("/api/members");
    const table = document.getElementById("membersTable");
    if (table) {
        table.innerHTML = "";
        rows.forEach(member => {
            const row = document.createElement("tr");
            [
                member.member_id, member.name, member.email,
                member.phone || "-", String(member.join_date).slice(0, 10),
                member.status
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });
            table.appendChild(row);
        });
    }

    const select = document.getElementById("memberSelect");
    if (select) {
        select.innerHTML = '<option value="">Choose member</option>';
        rows.forEach(member => {
            const option = document.createElement("option");
            option.value = member.member_id;
            option.textContent = member.name;
            select.appendChild(option);
        });
    }
}

async function loadPlans() {
    const plans = await request("/api/plans");
    const list = document.getElementById("plansList");
    if (list) {
        list.innerHTML = "";
        plans.forEach(plan => {
            const card = document.createElement("article");
            card.className = "card";
            const title = document.createElement("h3");
            title.textContent = plan.plan_name;
            const price = document.createElement("p");
            price.textContent = "₹" + Number(plan.fee).toFixed(2);
            const duration = document.createElement("p");
            duration.textContent = plan.duration_months + " month(s)";
            const description = document.createElement("p");
            description.textContent = plan.description || "";
            card.append(title, price, duration, description);
            list.appendChild(card);
        });
    }

    const select = document.getElementById("planSelect");
    if (select) {
        select.innerHTML = '<option value="">Choose plan</option>';
        plans.forEach(plan => {
            const option = document.createElement("option");
            option.value = plan.plan_id;
            option.textContent = plan.plan_name;
            select.appendChild(option);
        });
    }
}

async function loadSubscriptions() {
    const rows = await request("/api/subscriptions");
    const table = document.getElementById("subscriptionsTable");
    if (!table) return;

    table.innerHTML = "";
    rows.forEach(sub => {
        const row = document.createElement("tr");
        [
            sub.subscription_id, sub.member_name, sub.plan_name,
            String(sub.start_date).slice(0, 10),
            String(sub.end_date).slice(0, 10), sub.payment_status
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });
        table.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("totalMembers")) loadDashboard();

    const memberForm = document.getElementById("memberForm");
    if (memberForm) {
        memberForm.addEventListener("submit", async event => {
            event.preventDefault();
            const body = Object.fromEntries(new FormData(memberForm));
            try {
                await request("/api/members", {
                    method: "POST",
                    body: JSON.stringify(body)
                });
                showError("memberMessage", "Member added successfully.");
                memberForm.reset();
                await loadMembers();
            } catch (error) {
                showError("memberMessage", error.message);
            }
        });
        try { await loadMembers(); }
        catch (error) { showError("memberMessage", error.message); }
    }

    const planForm = document.getElementById("planForm");
    if (planForm) {
        planForm.addEventListener("submit", async event => {
            event.preventDefault();
            const body = Object.fromEntries(new FormData(planForm));
            body.duration_months = Number(body.duration_months);
            body.fee = Number(body.fee);
            try {
                await request("/api/plans", {
                    method: "POST",
                    body: JSON.stringify(body)
                });
                showError("planMessage", "Plan added successfully.");
                planForm.reset();
                await loadPlans();
            } catch (error) {
                showError("planMessage", error.message);
            }
        });
        try { await loadPlans(); }
        catch (error) { showError("planMessage", error.message); }
    }

    const subscriptionForm = document.getElementById("subscriptionForm");
    if (subscriptionForm) {
        try {
            await loadMembers();
            await loadPlans();
            await loadSubscriptions();
        } catch (error) {
            showError("subscriptionMessage", error.message);
        }

        subscriptionForm.addEventListener("submit", async event => {
            event.preventDefault();
            const body = Object.fromEntries(new FormData(subscriptionForm));
            body.member_id = Number(body.member_id);
            body.plan_id = Number(body.plan_id);
            try {
                await request("/api/subscriptions", {
                    method: "POST",
                    body: JSON.stringify(body)
                });
                showError("subscriptionMessage", "Subscription created successfully.");
                subscriptionForm.reset();
                await loadSubscriptions();
            } catch (error) {
                showError("subscriptionMessage", error.message);
            }
        });
    }
});

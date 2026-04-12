// Admin dashboard logic
const userList = document.getElementById('userList');

// Load mock data
const userData = getUsers();

// Utility functions
function renderUserList(users) {
    userList.innerHTML = '';

    users.forEach(user => {
        const userRow = document.createElement('tr');
        userRow.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td>${user.location}</td>
            <td><span class="status-badge">${getUserStatus(user)}</span></td>
        `;
        userList.appendChild(userRow);
    });
}

function getUserStatus(user) {
    // TO DO: implement user status logic
    return 'verified';
}

// Render user list
renderUserList(userData);

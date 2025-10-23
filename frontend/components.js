/**
 * A simulated UI component that displays a list of users.
 * It is "reactive" because it subscribes to the central store and
 * automatically re-renders itself whenever the relevant state changes.
 */
class UserListComponent {
  constructor(store, elementId) {
    this.store = store;
    this.element = document.getElementById(elementId);

    // Subscribe to the store. The store will call this function
    // whenever the state changes.
    this.unsubscribe = this.store.subscribe(this.render.bind(this));

    // Initial render.
    this.render();
  }

  /**
   * Renders the component based on the current state in the store.
   */
  render() {
    console.log('UserListComponent: State changed, re-rendering...');
    const users = this.store.getState().users;
    const userList = Object.values(users);

    if (userList.length === 0) {
      this.element.innerHTML = '<p>No users yet. A new user will appear here in real-time when registered.</p>';
      console.log('Rendered empty user list');
      return;
    }

    // A simple, declarative way to render the UI based on state.
    this.element.innerHTML = userList.map(user => `
      <div class="user">
        <strong>ID:</strong> ${user.id}<br>
        <strong>Email:</strong> ${user.email}
      </div>
    `).join('');
    console.log('Rendered user list with users');
  }
}

// --- Component Initialization ---
// Create an instance of the component, connecting it to the global store and a DOM element.
const userListComponent = new UserListComponent(store, 'user-list');
// Ensure the initial state is rendered before the test starts.
userListComponent.render();

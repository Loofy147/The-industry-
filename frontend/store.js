/**
 * A simple, generic, reactive state management Store.
 * Inspired by the patterns of Redux and Vuex.
 */
class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = initialState || {};
    this.listeners = [];
  }

  /**
   * Returns the current state of the application.
   */
  getState() {
    return this.state;
  }

  /**
   * Subscribes a listener function to be called on any state change.
   * @param {Function} listener The callback function.
   * @returns {Function} An unsubscribe function.
   */
  subscribe(listener) {
    this.listeners.push(listener);
    // Return an unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Dispatches an action. The action is sent to the reducer, which is the
   * only place where state mutations should occur.
   * @param {object} action An object with a `type` and optional `payload`.
   */
  dispatch(action) {
    // The reducer is a pure function that takes the current state and an
    // action and returns the new state.
    this.state = this.reducer(this.state, action);
    // Notify all subscribed listeners of the change.
    this.listeners.forEach(listener => listener());
  }
}

// --- Application-Specific Reducer and Initial State ---

const initialState = {
  users: {}, // A map of userId -> user
};

/**
 * The reducer determines how the state should change in response to an action.
 * @param {object} state The current state.
 * @param {object} action The dispatched action.
 */
function rootReducer(state = initialState, action) {
  if (action.type === 'HANDLE_EVENT') {
    const event = action.payload;
    if (event.type === 'UserRegistered') {
      const newUser = {
        id: event.aggregateId,
        email: event.data.email,
      };
      return {
        ...state,
        users: {
          ...state.users,
          [newUser.id]: newUser,
        },
      };
    }
  }
  return state;
}

// Create and export a single, global store instance.
const store = new Store(rootReducer, initialState);

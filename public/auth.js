// Authentication utilities
const auth = {
    isLoggedIn: () => localStorage.getItem('user') !== null,
    
    getUser: () => JSON.parse(localStorage.getItem('user')),
    
    login: (user) => localStorage.setItem('user', JSON.stringify(user)),
    
    logout: () => localStorage.removeItem('user')
};

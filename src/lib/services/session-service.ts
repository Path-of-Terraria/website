export function GetJwtToken() {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.getItem('jwt_token');
}
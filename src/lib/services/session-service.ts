export function GetJwtToken() {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.getItem('jwt_token');
}

export function SetJwtToken(value: string) {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.setItem('jwt_token', value);
}
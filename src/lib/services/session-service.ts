export function GetJwtToken() {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.getItem('jwt_token');
}

export function IsLoggedIn() {
    return GetJwtToken() !== null;
}

export function SetJwtToken(value: string) {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.setItem('jwt_token', value);
}

export function ClearStorageItem(key: string) {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.removeItem(key);
}
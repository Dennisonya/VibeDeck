const authFetch = async (url, navigate) =>{
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
        if (navigate) navigate('/');
        return null;
    }

    const { token } = JSON.parse(userInfo);

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status === 401 || res.status === 403){
        localStorage.removeItem("userInfo");
        if (navigate) navigate('/');
        return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')){
        const text = await res.text().catch(() => '');
        const err = new Error(`Expected JSON but received '${contentType}'. Status ${res.status}. Body starts with: ${text?.slice(0, 120)}`);
        err.status = res.status;
        err.body = text;
        throw err;
    }

    return await res.json();
}
export default authFetch;
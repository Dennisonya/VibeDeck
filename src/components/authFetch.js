const authFetch = async (url, navigate) =>{
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
        navigate('/');
        return null;
    }
    
    const { token } = JSON.parse(userInfo);

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (res.status === 401 || res.status=== 403){
        localStorage.removeItem("userInfo");
        navigate('/');
        return null;
    }

    return await res.json();
}
export default authFetch;
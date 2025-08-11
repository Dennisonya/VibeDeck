const authFetch = async (url, navigate) =>{
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (res.status === 401 || res.status=== 403){
        localStorage.removeItem("token");
        navigate('/');
        return null;
    }

    return await res.json();
}
export default authFetch;
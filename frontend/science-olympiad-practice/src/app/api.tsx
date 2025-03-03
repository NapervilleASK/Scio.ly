const api = {
    api: process.env.NEXT_PUBLIC_API_URL,
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
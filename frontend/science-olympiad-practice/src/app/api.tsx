const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/871c042db9f41b9fb983354120d85317/raw/63f323d99ef7f116c38d067cde89f07ee084147b/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
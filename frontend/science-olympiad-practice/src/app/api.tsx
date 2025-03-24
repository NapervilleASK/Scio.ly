const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/53a213efb382a9cc7a5dce8dd9b3f9a7/raw/038a9480f4723d0cd0361e649b02b7891da8455e/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
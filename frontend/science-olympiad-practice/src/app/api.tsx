const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/ea8912d956a8402dc8fb813c8897f981/raw/2327f352e74c9e02868e4ab6a3a54338ba0d7658/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
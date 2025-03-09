const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/b88a5b982a59e5a947912e84d17559f4/raw/04e8863df4f348f6fdb4653fd0b0570607b23f28/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
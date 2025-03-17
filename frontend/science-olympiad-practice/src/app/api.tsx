const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/908a8cc7c2c4887f9654dda754a2c85f/raw/d5bbcbf3966fd8773e07ce21150c2b177bf6a5ca/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
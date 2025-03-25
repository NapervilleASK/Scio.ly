const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/8a6cb495e39b3a1776f4032a712b3a2a/raw/45948d9abacb2dabebd91a3edf7768e38c19b40f/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/ee9940af5336487345c8577d8da1948d/raw/f5341a3878aa55d8b92a535285e8313fab97bdd4/final2.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/35964bbd2c4d9dcd77a6304bea6c3de9/raw/7401fd339b205aecb92789d59dbc722baf39b4ce/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
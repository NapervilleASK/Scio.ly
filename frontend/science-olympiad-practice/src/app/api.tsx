const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/00bb73c2c2c101ad5adc634c31a88089/raw/94dfbd6b3f8f542ea735be1c740c02b9ecdf1ea5/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
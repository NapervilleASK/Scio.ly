const api = {
    api: "https://gist.githubusercontent.com/Kudostoy0u/22b2a3349fc3adc96804a652c1688ac7/raw/eef669a4b3e34b17cc3616ad26cc8eaa901297b6/final.json",
    arr: JSON.parse(process.env.NEXT_PUBLIC_API_KEYS || "[]"),
};

export default api;
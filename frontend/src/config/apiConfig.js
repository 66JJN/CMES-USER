// User browsers use CMES-USER only. Calls to CMES-ADMIN are made exclusively
// by the CMES-USER backend with its server-side service token.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
  || process.env.REACT_APP_API_URL
  || 'https://cmes-user-5b5h.onrender.com';

export default API_BASE_URL;

// app.js
// Update these URLs and parameters as needed
const BASE_URL = 'https://app.azaleahealth.com/fhir/R4'; // <-- Update to your base URL
const CLIENT_ID = '125'; // <-- Update to your client ID
const CLIENT_SECRET = '57d59fc4768834aa4c0a6431c0da7e4'; // <-- Update to your client secret
const API_URL_BASE = 'https://app.azaleahealth.com/fhir/R4'; // Update as needed

const authBtn = document.getElementById('authBtn');
const fetchBtn = document.getElementById('fetchBtn');
const facilityInput = document.getElementById('facilityInput');
const dataTable = document.getElementById('dataTable');
const headerRow = document.getElementById('headerRow');
const tbody = dataTable.querySelector('tbody');
const infoBox = document.getElementById('infoBox');

let authToken = '';
let tenantId = '';

// Authenticate and get token
authBtn.addEventListener('click', async () => {
    tenantId = facilityInput.value.trim();
    infoBox.textContent = '';
    if (!tenantId) {
        infoBox.textContent = 'Please enter a tenant ID.';
        fetchBtn.disabled = true;
        return;
    }
    const authUrl = `${BASE_URL}/${tenantId}/oauth/token`;
    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'system/Patient.read system/PaymentReconciliation.read system/PaymentReconciliation.write system/Account.read system/DocumentReference.write system/Encounter.read system/DocumentReference.read system/Location.read'); // <-- Update scope value as needed
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        if (!response.ok) throw new Error('Authentication failed');
        const result = await response.json();
        authToken = result.access_token || result.token || '';
        if (!authToken) throw new Error('No token received');
        fetchBtn.disabled = false;
        infoBox.style.color = '#080';
        infoBox.textContent = 'Authentication successful!';
        setTimeout(() => { infoBox.textContent = ''; infoBox.style.color = '#b00'; }, 2000);
    } catch (error) {
        fetchBtn.disabled = true;
        infoBox.style.color = '#b00';
        infoBox.textContent = 'Authentication error: ' + error.message;
    }
});

// Fetch data with token and variable
fetchBtn.addEventListener('click', async () => {
    infoBox.textContent = '';
    if (!tenantId) {
        infoBox.textContent = 'Please authenticate first.';
        return;
    }
    try {
        // Fetch from baseurl/tenantid/location
        const apiUrl = `${BASE_URL}/${tenantId}/Location`;
        const response = await fetch(apiUrl, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();
        renderTable(data);
    } catch (error) {
        headerRow.innerHTML = '';
        tbody.innerHTML = `<tr><td colspan="100">Error: ${error.message}</td></tr>`;
        infoBox.textContent = 'Fetch error: ' + error.message;
    }
});

function renderTable(response) {
    console.log("API Response", response);
    const entries = Array.isArray(response.entry) ? response.entry : [];
    if (entries.length === 0) {
        headerRow.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="100">No data found</td></tr>';
        return;
    }
    headerRow.innerHTML = '<th>ID</th><th>Name</th><th>Address</th>';
    tbody.innerHTML = entries.map(entry => {
        const resource = entry.resource || {};
        const name = resource.name || '';
        let address = '';
        if (resource.address && Array.isArray(resource.address.line)) {
            address = resource.address.line.join(', ');
        } else if (resource.address && resource.address.line) {
            address = resource.address.line;
        }
        const id = resource.id || '';
        return `<tr><td>${id}</td><td>${name}</td><td>${address}</td></tr>`;
    }).join('');
}

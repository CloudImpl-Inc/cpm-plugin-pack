import http from "http";
import axios from "axios";

const redirectUrl = 'http://localhost:3000/callback'; // Your redirect URI

export async function authCodeLogin(clientId: string, clientSecret: string) {
    try {
        const authorizationCode = await startServerAndWaitForCode(clientId);

        // Step 3: Exchange authorization code for access token
        return await getAccessToken(authorizationCode, clientId, clientSecret);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function startServerAndWaitForCode(clientId: string) {
    return new Promise<string>((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            if (req.url && req.url.startsWith('/callback')) {
                const urlParams = new URLSearchParams(req.url.split('?')[1]);
                const authorizationCode = urlParams.get('code');

                if (authorizationCode) {
                    res.end('Authentication successful. You can close this window.');
                    resolve(authorizationCode);
                } else {
                    res.end('Failed to retrieve authorization code.');
                    reject(new Error('Failed to retrieve authorization code.'));
                }

                server.close(); // Close the server after handling the request
            } else {
                res.end('Invalid callback URL.');
                reject(new Error('Invalid callback URL.'));
            }
        });

        server.listen(3000, () => {
            console.log('Waiting for auth code');
        });

        // Step 2: Redirect user to ClickUp authorization page
        const authorizationUrl = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=code`;
        console.log(`Please visit this URL to authenticate: ${authorizationUrl}`);
    });
}

async function getAccessToken(authorizationCode: string, clientId: string, clientSecret: string) {
    const tokenUrl = `https://api.clickup.com/api/v2/oauth/token`;

    const response = await axios.post(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUrl
    });

    return response.data.access_token;
}
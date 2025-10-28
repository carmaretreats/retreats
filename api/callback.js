import axios from "axios";

export async function GET(req) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI;
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  console.log(url, params);
  const code = params.get("code");
  console.log(code);
  if (!code) {
    return new Response(
      `<script>window.opener.postMessage({ error: "Missing code" }, "*"); window.close();</script>`
    );
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    const content = JSON.stringify({ token: accessToken, provider: "github" });
    const message = JSON.stringify(`authorization:github:success:${content}`);

    return new Response(
      `
      <html><body><script>
    (function() {
      function recieveMessage(e) {
        console.log("recieveMessage %o", e)
        // send message to main window with da app
        window.opener.postMessage(
          ${message},
          e.origin
        )
      }
      window.addEventListener("message", recieveMessage, false)
      // Start handshare with parent
      console.log("Sending message: %o", "github")
      window.opener.postMessage("authorizing:github", "*")
      })()
    </script></body></html>
    `,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    const content = JSON.stringify(error);
    const message = JSON.stringify(`authorization:github:error:${content}`);
    return new Response(`
      <html><body><script>
    (function() {
      function recieveMessage(e) {
        console.log("recieveMessage %o", e)
        // send message to main window with da app
        window.opener.postMessage(
          ${message},
          e.origin
        )
      }
      window.addEventListener("message", recieveMessage, false)
      // Start handshare with parent
      console.log("Sending message: %o", "github")
      window.opener.postMessage("authorizing:github", "*")
      })()
    </script></body></html>
    `);
  }
}

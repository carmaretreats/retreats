export function GET(request, res) {
  const CLIENT_ID = import.meta.env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.REDIRECT_URI;
  const authURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo,user`;
  return Response.redirect(authURL, 307);
}

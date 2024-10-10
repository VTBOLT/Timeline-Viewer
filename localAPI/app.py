import logging
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import msal
import httpx
import os
from msgraph import GraphServiceClient, GraphRequestAdapter
from azure.identity import (
    ClientSecretCredential,
    OnBehalfOfCredential,
    AuthorizationCodeCredential,
)
from azure.core.credentials import TokenCredential, AccessToken
from kiota_authentication_azure.azure_identity_authentication_provider import (
    AzureIdentityAuthenticationProvider,
)
from msgraph_core import GraphClientFactory
from dotenv import load_dotenv

load_dotenv()


# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TENANT_ID = os.getenv("TENANT_ID")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPE = ["User.Read", "Tasks.Read"]  # Updated scopes for delegated flow
REDIRECT_URI = "http://localhost:5001/api/auth_callback"
CLIENT_REDIRECT_URI = "http://localhost:4200/auth-callback"

msal_app = msal.ConfidentialClientApplication(
    CLIENT_ID,
    client_credential=CLIENT_SECRET,
    authority=AUTHORITY,
    token_cache=msal.SerializableTokenCache(),
)


class RawAccessTokenProvider:
    """
    A simple credential provider that returns a raw access token for use with Azure SDK clients.
    """

    def __init__(self, access_token: str, expires_on: int) -> None:
        self._access_token = access_token
        self._expires_on = expires_on

    def get_token(self, *scopes, **kwargs) -> AccessToken:
        return AccessToken(self._access_token, self._expires_on)


@app.route("/api/login")
def login():
    auth_url = msal_app.get_authorization_request_url(
        SCOPE, redirect_uri=REDIRECT_URI, prompt="select_account"
    )
    logger.debug(f"Generated auth URL: {auth_url}")
    return redirect(auth_url)


@app.route("/api/auth_callback")
def auth_callback():
    code = request.args.get("code")
    if not code:
        return redirect(f"{CLIENT_REDIRECT_URI}?error=no_code")

    try:
        result = msal_app.acquire_token_by_authorization_code(
            code, scopes=SCOPE, redirect_uri=REDIRECT_URI
        )

        if "access_token" not in result:
            logger.error(
                f"Error acquiring token: {result.get('error_description', 'Unknown error')}"
            )
            return redirect(
                f"{CLIENT_REDIRECT_URI}?error={result.get('error_description', 'Failed to acquire token')}"
            )

        logger.debug("Token acquired successfully")
        logger.debug(f"Token expiration: {result.get('expires_in')} seconds")

        # Redirect back to the client with the access token
        return redirect(f"{CLIENT_REDIRECT_URI}?token={result['access_token']}")

    except Exception as e:
        logger.error(f"Exception during token acquisition: {str(e)}")
        return redirect(f"{CLIENT_REDIRECT_URI}?error={str(e)}")


@app.route("/api/tasks", methods=["GET"])
async def get_tasks():
    try:
        # Get the token from the Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "No valid authorization header"}), 401

        token = auth_header.split(" ")[1]

        credentials = RawAccessTokenProvider(token, 0)
        graph_client = GraphServiceClient(credentials=credentials)

        # Get task lists
        task_lists = await graph_client.me.planner.plans.get()
        logger.info(f"Task lists data: {task_lists}")

        all_tasks = []
        for plan in task_lists.value:
            list_id = plan.id
            tasks = await graph_client.planner.plans.by_planner_plan_id(
                list_id
            ).tasks.get()
            logger.info(f"Tasks for list {list_id} data: {tasks.value}")
            all_tasks.extend(tasks.value)

        print(all_tasks[0].id)

        return jsonify(
            {
                "value": [
                    {
                        "id": task.id,
                        "title": task.title,
                        "dueDate": task.due_date_time,
                    }
                    for task in all_tasks
                ]
            }
        )
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
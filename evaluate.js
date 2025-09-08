const { app } = require('@azure/functions');
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const KEY_VAULT_NAME = process.env.KEYVAULT_NAME; 
const SECRET_NAMES = ["secret00", "secret01"];

const KV_URL = `https://${KEY_VAULT_NAME}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const client = new SecretClient(KV_URL, credential);

const secrets = {};
(async () => {
  for (const name of SECRET_NAMES) {
    try {
      const secret = await client.getSecret(name);
      secrets[name] = secret.value;
    } catch (err) {
      console.error(`Failed to fetch secret ${name}: ${err.message}`);
      secrets[name] = null;
    }
  }
})();

app.http('evaluate', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    const expression = await request.text() || '"No expression provided"';

    const { secret00, secret01 } = secrets;

    let result;

    try {
      result = eval(expression);
    } catch (err) {
      result = `Error: ${err.message}`;
    }

    return { body: `Evaluation result: ${result}` };
  }
});

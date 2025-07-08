const express = require('express');
const app = express();

app.use(express.json());

app.post('/api', (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;
  let responseText = `Webhook trên Vercel đã nhận được intent: ${intentName}`;

  const responseJson = {
    fulfillmentMessages: [{ text: { text: [responseText] } }],
  };

  res.status(200).send(responseJson);
});

module.exports = app;

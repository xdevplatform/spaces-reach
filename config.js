export const headers = {
  authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
  'x-des-apiservices': 'staging1',
  'X-Decider-Overrides': 'tfe_route:des_apiservice_staging1=on'
}
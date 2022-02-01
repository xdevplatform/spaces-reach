# Spaces Reach 🟣🚀

Spaces Reach is a template app to show you how to get started with the Spaces endpoints to create experiences to measure the performance of your Spaces.

This app uses the new [Spaces endpoints](https://developer.twitter.com/en/docs/twitter-api/spaces/overview) to get details about a Space, such as title and participants.
It periodically checks the status of the Space to compute its duration, and to plot a chart of how many people are listening and speaking over time.

## How to make this code work for you

Before you start, make sure you have an active [Twitter developer account](https://developer.twitter.com/apply). 

As with all v2 endpoints, you will need to add an active app to any of your available Projects. For more details, [read our documentation](https://developer.twitter.com/en/docs/apps/overview).

You will need to configure some environment variables with your credentials. To do so, copy `.env.template` and rename it to `.env`, then fill the values in the file.

This app uses a Redis instance for caching purposes, but you can change the code and use any other service (or no service at all).

# Teams Integration Admin

Its the admin part of the teams integration.
## IMPORTANT
It's working but not perfect some state changes need to be fixed so please just use the Accept call and Hang up buttons.
In order to make the application work correctly you need to go into your browser settings and give it permission to autoplay and play sounds without user interaction otherwise the app will crash on call.

## Available Scripts

### `npm run start-dev`
(Use for local development)
Is used to start the local development server/env.

###   `start`
Is used to serve the applications build(dist) folder when deployed.

###  `start-dev-server`
Is used to imitate the deployed product by building the app and serving the build(dist) folder.

###  `build`
Builds the application.

###    `test`
Runs the test's which we dont have. :)

## Starting the project

cd into the project folder / open a terminal from the IDE and run `npm install`, after everything is installed run `npm run start-dev`

## Components 

there is one component the App component.

All of the logic for the azure teams integration is in this component - time constrains

## Functions

   There are 6 main functions:
1. init()
2. fetchTokenFromGitHub()
3. acceptCall()
4. hangUpVideoCall()
5. startVideoInCall()
6. stopVideoInCall()

init: Called on component render via the `useEffect` lifecycle hook initializes the call agent and calls all of the helper funtions.

fetchTokenFromGitHub: Fetches and sets the right access tokens and identities from a Json file in my (BorisStankov98)'s account.

acceptCall: Accepts the call from the caller and updates the state of the buttons.

hangUpVideoCall: Hangs up the call and updates the state of the buttons.

startVideoInCall: Starts the camera while already in the call and updates the state of the buttons.

stopVideoInCall: Stops the camera while already in the call and updates the state of the buttons.

 ## Deployment 

 Currently all applications are deployed on heroku with my (BorisStankov98) GitHub account and the repositories are forks from the BiekeSurfOrg GitHub Account. 

 The whole deployment process is automated via the scripts mentioned above, so all you need to do in Heroku is select the correct branch you would like to deploy and click on deploy,the rest is taken care of. 

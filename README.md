# Project : Would You Rather API
## By  Fouad Asharf

## Table of contents
- [Description](#description)
- [Data](#data)
- [Setting up the project](#setting-up-the-project)
- [Deploy and test](#deploy-and-test)
- [Attribution](#attribution)
- [Copyright and license](#copyright-and-license)


## Description
- A Would You Rather API that allows you to save questions, answers and get a complete list of questions' and users' data.
- Built using [Firebase Cloud Functions](https://firebase.google.com/docs/functions) and [Express](https://expressjs.com/).

## Data

There are two types of objects stored in our database:

* Users
* Questions

### Users

Users include:

| Attribute    | Type             | Description           |
|-----------------|------------------|-------------------         |
| uid                 | String           | The user’s unique identifier |
| username          | String           | The user’s first name  and last name     |
| avatarUrl  | String           | The path to the image file |
| questions | Array | A list of ids of the polling questions this user created|
| answers      | Object         |  The object's keys are the ids of each question this user answered. The value of each key is the answer the user selected. It can be either `'optionOne'` or `'optionTwo'` since each question has two options.

### Questions

Questions include:

| Attribute | Type | Description |
|-----------------|------------------|-------------------|
| id                  | String | The question’s unique identifier |
| author        | String | The author’s unique identifier |
| timestamp | Number | The time when the question was created|
| optionOne | Object | The first voting option|
| optionTwo | Object | The second voting option|

### Voting Options

Voting options are attached to questions. They include:

| Attribute | Type | Description |
|-----------------|------------------|-------------------|
| votes             | Array | A list that contains the id of each user who voted for that option|
| text                | String | The text of the option |

## API

### Get Users
- Description
    - Get all of the existing users from the database.
- Request 
    ```
        GET /api/get-users
        Authorization: Bearer <token>
    ```
- Response
    ```
        {
            user_id: {
                uid: [String],
                username: [String],
                avatarUrl: [String],
                questions: [Array],
                answers: [Object]
            },
            .
            .
            .
            .
        }
    ```
### Get Questions
- Description
    - Get all of the existing questions from the database.
- Request 
    ```
        GET /api/get-questions
        Authorization: Bearer <token>
    ```
- Response
    ```
        {
            question_id: {
                id: [String],                 
                author: [String], 
                timestamp: [Number], 
                optionOne: [Object], 
                optionTwo: [Object] 
            },
            .
            .
            .
            .
        }
    ```
### Save Question
- Description
    - Save the polling question in the database.
- Request 
    ```
        POST /api/save-question
        Authorization: Bearer <token>
    ```
- Payload
   ```
        {
            question: {
                author: [String],
                optionOneText: [String],
                optionTwoText: [String]
            }
        }
    ```
- Response
    ```
        {
            id: [String],                 
            author: [String], 
            timestamp: [Number], 
            optionOne: [Object], 
            optionTwo: [Object] 
        }
    ```

### Save Question Answer
- Description
    - Save the polling question in the database.
- Request 
    ```
        POST /api/save-question-answer
        Authorization: Bearer <token>
    ```
- Payload
   ```
        {
            authedUserId: [String],
            qid: [String],
            answer: [String]
        }
    ```



## Setting up the project

 1. Create a Firebase Project using the [Firebase Console](https://console.firebase.google.com).
 1. Enable the **Google** Provider in the **Auth** section.
 1. Clone or download this repo and open the `authorized-https-endpoint` directory.
 1. You must have the Firebase CLI installed. If you don't have it install it with `npm install -g firebase-tools` and then configure it with `firebase login`.
 1. Configure the CLI locally by using `firebase use --add` and select your project in the list.
 1. Generate a private key file for your service account:
    1. In the Firebase console, open Settings > Service Accounts.
    1. Click Generate New Private Key, then confirm by clicking Generate Key.
    1. Securely store the JSON file containing the key and name it `permissions.json`.
 1. Install dependencies locally by running: `cd functions; npm install; cd -`


## Deploy and test

This sample comes with a web-based UI for testing the function.
To test locally do:

 1. Start serving your project locally using `firebase serve --only hosting,functions`
 1. Open the app in a browser at `http://localhost:5000`.
 1. Sign in the web app in the browser using Google Sign-In and two authenticated requests will be performed from the client and the result will be displayed on the page, normally "Hello <user displayname>".


To deploy and test on prod do:

 1. Deploy your project using `firebase deploy`
 1. Open the app using `firebase open hosting:site`, this will open a browser.
 1. Sign in the web app in the browser using Google Sign-In and two authenticated requests will be performed from the client and the result will be displayed on the page, normally "Hello <user displayname>".


 ## Attribution
* [reactnd-project-would-you-rather-starter](https://github.com/udacity/reactnd-project-would-you-rather-starter)
* [firebase/functions-samples](https://github.com/firebase/functions-samples)
* [Firebase](https://firebase.google.com/)

## Copyright and License
- Copyright 2016 Google Inc. All Rights Reserved.
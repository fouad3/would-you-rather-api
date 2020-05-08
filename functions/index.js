/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./permissions.json');
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const Busboy = require('busboy');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { uuid } = require('uuidv4');
const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://reactnd-would-you-rather.firebaseio.com',
  storageBucket: 'gs://reactnd-would-you-rather.appspot.com',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const validateFirebaseIdToken = async (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');
  if(req.headers.authorization) {
    console.log('entered!')
  }
  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

const createProfile = (userRecord, context) => {
  const { uid } = userRecord;

  return db
    .collection('users')
    .doc(uid)
    .set({ 
      uid,
      answers: {},
      questions: [],
    })
    .catch((error) => {
      return res.status(400).send(error);
    });
};

const generateUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const formatQuestion = ({ optionOneText, optionTwoText, author }) => {
  return {
    id: generateUID(),
    timestamp: Date.now(),
    author,
    optionOne: {
      votes: [],
      text: optionOneText,
    },
    optionTwo: {
      votes: [],
      text: optionTwoText,
    }
  }
}

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);
app.post('/api/save-question', (req, res) => {
  (async () => {
      try {
        const formattedQuestion = formatQuestion(req.body.question);
        console.log(formattedQuestion);
        let authedUser = {};
        // create question
        await db.collection('questions').doc(formattedQuestion.id)
          .create({question: formattedQuestion});
        // get authed user 
        await db.collection('users').doc(req.body.question.author).get().then((user)=> {
          authedUser = user.data();
          authedUser.questions = authedUser.questions.concat([formattedQuestion.id]);
          console.log('authedUser', authedUser);
          return user;
        })
        // add the question for authed user 
        await db.collection('users').doc(req.body.question.author)
          .update({
            questions: authedUser.questions
          });
        return res.status(200).send(formattedQuestion);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
});

app.post('/api/save-question-answer', (req, res) => {
  (async () => {
      try {
        let authedUser = {};
        let question = {};
        // get question from db and update its votes property
        await db.collection('questions').doc(req.body.qid).get().then((item)=> {
          question = item.data().question;
          question[req.body.answer] = {
            text: question[req.body.answer].text,
            votes: question[req.body.answer].votes.concat([req.body.authedUserId])
          }
          return item;
        })
        // update question in db
        await db.collection('questions').doc(req.body.qid)
          .update({
            question: question
          });
        // get user from db and update its answers property
        await db.collection('users').doc(req.body.authedUserId).get().then((item)=> {
          authedUser = item.data();
          authedUser.answers[req.body.qid] = req.body.answer;
          return item;
        })
        // update user in db
        await db.collection('users').doc(req.body.authedUserId)
          .update({
            answers: authedUser.answers
          });
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
});

app.get('/api/get-questions', (req, res) => {
  (async () => {
      try {
        let query = db.collection('questions');
        let response = {};
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          for (let doc of docs) {
            response[doc.id] = doc.data().question;
          }
          return querySnapshot;
        });
        return res.status(200).send(response);
        
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
});

app.get('/api/get-users', (req, res) => {
  (async () => {
    try {
      const query = db.collection('users');
      let response = {};
      await query.get().then(querySnapshot => {
        let docs = querySnapshot.docs;
        for (let doc of docs) {
          response[doc.id] = doc.data();
        }
        return querySnapshot;
      });
      return res.status(200).send(response);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
    }
  )();
});

app.post('/api/update-user-profile/:user_id', (req, res) => {
  (async () => {
    try {
      const busboy = new Busboy({ headers: req.headers });
      let uploadData = null;
      let username = null;
      
      await busboy.on('field', (fieldname, val) => {
        if (fieldname === 'username') {
          username = val;
        }
      });
    
      await busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const filepath = path.join(os.tmpdir(), `${req.params.user_id}.${filename.split('.')[1]}`);
        uploadData = { file: filepath, type: mimetype, name: filename};
        file.pipe(fs.createWriteStream(filepath));
      })
  
      await busboy.on('finish', async () => {
        try {
          const document = db.collection('users').doc(req.params.user_id);
          const file = await bucket
          .upload(uploadData.file, {
            uploadType: 'media',
            metadata: {
              metadata: {
                contentType: uploadData.type,
                firebaseStorageDownloadTokens: uuid(),
              },
            },
          })
          const metadata = file[0].metadata;
          const url = `https://firebasestorage.googleapis.com/v0/b/${metadata.bucket}/o/${metadata.name}?alt=media&token=${metadata.metadata.firebaseStorageDownloadTokens}`;
         
          await delay(10000);

          await   document.update({
            username: username,
            avatarUrl: url
          })
          return res.status(200).send();
        } catch(error) {
          return res.status(500).send(error);
        }
      })
      return await busboy.end(req.rawBody);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
    }
  )();
});

module.exports = {
  onCreate: functions.auth.user().onCreate(createProfile),
  onRequest: functions.https.onRequest(app),
};






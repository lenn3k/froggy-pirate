import dotenv from 'dotenv';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { DiscordBot } from './bot';


dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: `${process.env.FB_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${process.env.FB_PROJECT_ID}.firebaseio.com`,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: `${process.env.FB_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FB_SENDER_ID,
  appId: process.env.FB_APP_ID,
};

firebase.initializeApp(firebaseConfig);
firebase.firestore();

const bot = DiscordBot.getInstance();

bot.connect();

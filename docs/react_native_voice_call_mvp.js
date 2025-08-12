# React Native Voice Call MVP

This document contains a runnable **React Native + Firebase + Agora** MVP project structure and key files. Use this as a starter you can run locally. Replace placeholder keys with your own Agora and Firebase credentials.

---

## Project idea
A minimal React Native app that uses:
- **Firebase** for Authentication, Firestore, Cloud Functions (to mint Agora tokens), and FCM
- **Agora** for real-time voice calls
- **React Navigation** for simple screen flow

---

## Prerequisites
- Node.js (16+)
- Yarn or npm
- React Native CLI or Expo (this project assumes a bare React Native setup)
- Firebase project and `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
- Agora account and APP_ID + APP_CERTIFICATE (for token generation)

---

## File tree

```
voicecall-mvp/
├─ android/ ios/
├─ functions/ (firebase cloud functions)
│  └─ index.js
├─ src/
│  ├─ screens/
│  │  ├─ LoginScreen.js
│  │  ├─ ContactList.js
│  │  └─ CallScreen.js
│  ├─ firebaseConfig.js
│  └─ navigation.js
├─ App.js
├─ package.json
└─ README.md
```

---

## package.json (important deps)

```json
{
  "name": "voicecall-mvp",
  "version": "0.0.1",
  "main": "App.js",
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "functions": "firebase deploy --only functions"
  },
  "dependencies": {
    "@react-native-firebase/app": "^17.0.0",
    "@react-native-firebase/auth": "^17.0.0",
    "@react-native-firebase/firestore": "^17.0.0",
    "@react-native-firebase/messaging": "^17.0.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "react-native-agora": "^4.0.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/native-stack": "^6.0.0"
  }
}
```

> Some versions may change — use the latest compatible versions with your RN version.

---

## src/firebaseConfig.js

```javascript
// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## src/screens/LoginScreen.js

```javascript
// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Button, TextInput, Text } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      navigation.replace('Contacts');
    } catch (e) {
      console.warn(e.message);
    }
  };

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      navigation.replace('Contacts');
    } catch (e) {
      console.warn(e.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Password</Text>
      <TextInput value={pass} onChangeText={setPass} secureTextEntry style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Login" onPress={login} />
      <View style={{ height: 10 }} />
      <Button title="Register" onPress={register} />
    </View>
  );
}
```

---

## src/screens/ContactList.js

```javascript
// src/screens/ContactList.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ContactList({ navigation }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const startCall = (user) => {
    navigation.navigate('Call', { remoteUser: user });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={users}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => startCall(item)} style={{ padding: 15, borderBottomWidth: 1 }}>
            <Text>{item.name || item.email}</Text>
            <Text>{item.phone || ''}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

---

## src/screens/CallScreen.js

```javascript
// src/screens/CallScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import RtcEngine from 'react-native-agora';

const APP_ID = 'YOUR_AGORA_APP_ID';

export default function CallScreen({ route, navigation }) {
  const { remoteUser } = route.params;
  const [engine, setEngine] = useState(null);
  const [joined, setJoined] = useState(false);
  const CHANNEL = `call_${remoteUser.id}`;

  useEffect(() => {
    let rtc = null;
    (async () => {
      rtc = await RtcEngine.create(APP_ID);
      await rtc.enableAudio();
      rtc.addListener('JoinChannelSuccess', () => setJoined(true));
      rtc.addListener('UserJoined', (uid) => console.log('remote joined', uid));
      setEngine(rtc);

      // In production, request token from your server (Firebase function)
      const token = null; // temporary for testing
      await rtc.joinChannel(token, CHANNEL, null, 0);
    })();

    return () => {
      if (rtc) {
        rtc.leaveChannel();
        rtc.destroy();
      }
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{joined ? 'In Call' : 'Connecting...'}</Text>
      <Button title="End Call" onPress={() => navigation.goBack()} />
    </View>
  );
}
```

---

## App.js & Navigation

```javascript
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import ContactList from './src/screens/ContactList';
import CallScreen from './src/screens/CallScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Contacts" component={ContactList} />
        <Stack.Screen name="Call" component={CallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Firebase Cloud Function: Agora Token Generation (functions/index.js)

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Install: npm install agora-access-token
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = 'YOUR_AGORA_APP_ID';
const APP_CERTIFICATE = 'YOUR_AGORA_APP_CERTIFICATE';

exports.generateToken = functions.https.onCall((data, context) => {
  const channelName = data.channel;
  const uid = data.uid || 0;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpiredTs);
  return { token };
});
```

> Deploy this function and call it from your app to get a short-lived token instead of using `null`.

---

## How to run (quick)
1. `yarn` or `npm install`
2. Add Firebase config to `src/firebaseConfig.js` and platform files (google-services.json / plist)
3. Configure Agora APP_ID and APP_CERT in functions and CallScreen
4. `npm run functions` to deploy cloud function (requires Firebase CLI)
5. `npx react-native run-android` or `run-ios`

---

## Notes & Next steps
- Replace temporary tokens with Cloud Function token calls.
- Add push notifications (FCM) for incoming call invites.
- Implement offline SMS ping using Africa's Talking/Termii API when callee is offline.
- Harden security rules on Firestore and add validation.
- Optimize audio bitrate with Agora settings for low-data scenarios.

---

If you want, I can now:
- generate the `.zip` or scaffold files for you to download, or
- expand any file into more complete production-ready code (e.g., FCM integration, permissions, Android manifest edits).

Which would you like next?

import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

import teams_call_sound from "./microsoft_teams_call.mp3"

const { CallClient, VideoStreamRenderer, LocalVideoStream } = require('@azure/communication-calling');
const { AzureCommunicationTokenCredential } = require('@azure/communication-common');


let callAgent;
let deviceManager;
let call;
let incomingCall;
let localVideoStream;
let localVideoStreamRenderer;

let remoteVideosGallery;
let localVideoContainer;

let USER_ACCESS_TOKEN_ADMIN = ""
let USER_CALLE_ID = ""

let audio;

function App() {

  function fetchTokenFromGitHub() {
    return axios.get("https://api.github.com/repos/BiekeSurfOrg/acess-tokens/contents/acess-tokens.json", {
      headers: {
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }).then((result => {

      const { caller, callee } = JSON.parse(atob(result.data.content).toString())
      USER_ACCESS_TOKEN_ADMIN = callee.userAcessToken
    }
    ))
  }

  const [isCameraEnabled, setEnableCamera] = useState(false);
  const [isIncomingCallDisabled, setIncomingCallDisabledButtonDissable] = useState(true);


  useEffect(() => {
    remoteVideosGallery = document.getElementById('remoteVideosGallery');
    localVideoContainer = document.getElementById('localVideoContainer');
    audio = new Audio(teams_call_sound);
    audio.loop = true;
    init();
  }, []);

  const init = async () => {
    try {
      await fetchTokenFromGitHub()
      console.log(USER_ACCESS_TOKEN_ADMIN)
      const callClient = new CallClient();
      const tokenCredential = new AzureCommunicationTokenCredential(USER_ACCESS_TOKEN_ADMIN);
      callAgent = await callClient.createCallAgent(tokenCredential)
      // Set up a camera device to use.
      deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ video: true });
      await deviceManager.askDevicePermission({ audio: true });
      // Listen for an incoming call to accept.
      callAgent.on('incomingCall', async (args) => {
        try {
          incomingCall = args.incomingCall;
          setIncomingCallDisabledButtonDissable(false);
          audio.play();
        } catch (error) {
          console.error(error);
        }
      });

    } catch (error) {
      console.error(error);
    }
  }

  const startVideoCall = async () => {
    try {
      const localVideoStream = await createLocalVideoStream();
      console.log(localVideoStream);
      setEnableCamera(true)
      const videoOptions = localVideoStream ? { localVideoStreams: [localVideoStream] } : undefined;
      call = callAgent.startCall([{ communicationUserId: USER_CALLE_ID }], { videoOptions });
      // Subscribe to the call's properties and events.
      subscribeToCall(call);
    } catch (error) {
      console.error(error);
    }
  }

  const acceptCall = async () => {
    try {
      const localVideoStream = await createLocalVideoStream();
      audio.pause()
      setIncomingCallDisabledButtonDissable(true);
      setEnableCamera(true)
      console.log(isIncomingCallDisabled, "accept call");

      const videoOptions = localVideoStream ? { localVideoStreams: [localVideoStream] } : undefined;
      call = await incomingCall.accept({ videoOptions });
      // Subscribe to the call's properties and events.
      subscribeToCall(call);
    } catch (error) {
      console.error(error);
    }
  }

  const subscribeToCall = (call) => {
    try {
      // Inspect the initial call.id value.
      console.log(`Call Id: ${call.id}`);
      //Subscribe to call's 'idChanged' event for value changes.
      call.on('idChanged', () => {
        console.log(`Call Id changed: ${call.id}`);
      });

      // Inspect the initial call.state value.
      console.log(`Call state: ${call.state}`);
      // Subscribe to call's 'stateChanged' event for value changes.
      call.on('stateChanged', async () => {
        console.log(`Call state changed: ${call.state}`);
        if (call.state === 'Connected') {
        } else if (call.state === 'Disconnected') {
          setIncomingCallDisabledButtonDissable(false)
          console.log(`Call ended, call end reason={code=${call.callEndReason.code}, subCode=${call.callEndReason.subCode}}`);
        }
      });

      call.on('isLocalVideoStartedChanged', () => {
        console.log(`isLocalVideoStarted changed: ${call.isLocalVideoStarted}`);
      });
      console.log(`isLocalVideoStarted: ${call.isLocalVideoStarted}`);
      call.localVideoStreams.forEach(async (lvs) => {
        localVideoStream = lvs;
        await displayLocalVideoStream();
      });
      call.on('localVideoStreamsUpdated', e => {
        e.added.forEach(async (lvs) => {
          localVideoStream = lvs;
          await displayLocalVideoStream();
        });
        e.removed.forEach(lvs => {
          removeLocalVideoStream();
        });
      });

      // Inspect the call's current remote participants and subscribe to them.
      call.remoteParticipants.forEach(remoteParticipant => {
        subscribeToRemoteParticipant(remoteParticipant);
      });
      // Subscribe to the call's 'remoteParticipantsUpdated' event to be
      // notified when new participants are added to the call or removed from the call.
      call.on('remoteParticipantsUpdated', e => {
        // Subscribe to new remote participants that are added to the call.
        e.added.forEach(remoteParticipant => {
          subscribeToRemoteParticipant(remoteParticipant)
        });
        // Unsubscribe from participants that are removed from the call
        e.removed.forEach(remoteParticipant => {
          console.log('Remote participant removed from the call.');
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  const subscribeToRemoteParticipant = (remoteParticipant) => {
    try {
      // Inspect the initial remoteParticipant.state value.
      console.log(`Remote participant state: ${remoteParticipant.state}`);
      // Subscribe to remoteParticipant's 'stateChanged' event for value changes.
      remoteParticipant.on('stateChanged', () => {
        console.log(`Remote participant state changed: ${remoteParticipant.state}`);
      });

      // Inspect the remoteParticipants's current videoStreams and subscribe to them.
      remoteParticipant.videoStreams.forEach(remoteVideoStream => {
        subscribeToRemoteVideoStream(remoteVideoStream)
      });
      // Subscribe to the remoteParticipant's 'videoStreamsUpdated' event to be
      // notified when the remoteParticiapant adds new videoStreams and removes video streams.
      remoteParticipant.on('videoStreamsUpdated', e => {
        // Subscribe to new remote participant's video streams that were added.
        e.added.forEach(remoteVideoStream => {
          subscribeToRemoteVideoStream(remoteVideoStream)
        });
        // Unsubscribe from remote participant's video streams that were removed.
        e.removed.forEach(remoteVideoStream => {
          console.log('Remote participant video stream was removed.');
        })
      });
    } catch (error) {
      console.error(error);
    }
  }

  const subscribeToRemoteVideoStream = async (remoteVideoStream) => {
    let renderer = new VideoStreamRenderer(remoteVideoStream);
    let view;
    let remoteVideoContainer = document.createElement('div');
    remoteVideoContainer.className = 'remote-video-container';

    let loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    remoteVideoStream.on('isReceivingChanged', () => {
      try {
        if (remoteVideoStream.isAvailable) {
          const isReceiving = remoteVideoStream.isReceiving;
          const isLoadingSpinnerActive = remoteVideoContainer.contains(loadingSpinner);
          if (!isReceiving && !isLoadingSpinnerActive) {
            remoteVideoContainer.appendChild(loadingSpinner);
          } else if (isReceiving && isLoadingSpinnerActive) {
            remoteVideoContainer.removeChild(loadingSpinner);
          }
        }
      } catch (e) {
        console.error(e);
      }
    });

    const createView = async () => {
      // Create a renderer view for the remote video stream.
      view = await renderer.createView();
      // Attach the renderer view to the UI.
      console.log(remoteVideoContainer, "Remote video container");

      remoteVideoContainer.appendChild(view.target);
      remoteVideosGallery.appendChild(remoteVideoContainer);
    }

    // Remote participant has switched video on/off
    remoteVideoStream.on('isAvailableChanged', async () => {
      try {
        if (remoteVideoStream.isAvailable) {
          await createView();
        } else {
          view.dispose();
          remoteVideosGallery.removeChild(remoteVideoContainer);
        }
      } catch (e) {
        console.error(e);
      }
    });

    // Remote participant has video on initially.
    if (remoteVideoStream.isAvailable) {
      try {
        await createView();
      } catch (e) {
        console.error(e);
      }
    }
  }


  const stopVideoInCall = async () => {
    try {
      await call.stopVideo(localVideoStream);
      setEnableCamera(false)
    } catch (error) {
      console.error(error);
    }
  }

  const startVideoInCall = async () => {
    try {
      const localVideoStream = await createLocalVideoStream();
      await call.startVideo(localVideoStream);
      setEnableCamera(true)
    } catch (error) {
      console.error(error);
    }
  }


  const createLocalVideoStream = async () => {
    const camera = (await deviceManager.getCameras())[0];
    if (camera) {
      return new LocalVideoStream(camera);
    } else {
      console.error(`No camera device found on the system`);
    }
  }

  /**
   * Display your local video stream preview in your UI
   */
  const displayLocalVideoStream = async () => {
    try {
      localVideoStreamRenderer = new VideoStreamRenderer(localVideoStream);
      const view = await localVideoStreamRenderer.createView();
      localVideoContainer.appendChild(view.target);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Remove your local video stream preview from your UI
   */
  const removeLocalVideoStream = async () => {
    try {
      localVideoStreamRenderer.dispose();
    } catch (error) {
      console.error(error);
    }
  }

  const hangUpVideoCall = async () => {
    await call.hangUp();
    setIncomingCallDisabledButtonDissable(false)

  }

  return (
    <div className='main-content'>
      <h1>Holopod Teams Integration Admin</h1>
      <div className='video-container-holder'>
        <div className='video-container'>
          <div id="localVideoContainer" >You:</div>
        </div>
        <div className='video-container'>
          <div id="remoteVideosGallery" >Holopod User:</div>
        </div>
      </div>
      <div className='buttons'>
        <button className={isIncomingCallDisabled ? 'kbc-style-button button-dissabled' : 'kbc-style-button'} id="accept-call-button" type="button" onClick={() => acceptCall()} >Accept Call</button>
        <button className={!isIncomingCallDisabled ? 'kbc-style-button button-dissabled' : 'kbc-style-button'} id="hangup-call-button" type="button" onClick={() => hangUpVideoCall()} >Hang up Call</button>

        {!isIncomingCallDisabled ? <button className={isCameraEnabled ? 'kbc-style-button button-dissabled' : 'kbc-style-button'} id="start-video-button" type="button" onClick={() => startVideoInCall()}>Start Video</button> : ""}
        {!isIncomingCallDisabled ? <button className={!isCameraEnabled ? 'kbc-style-button button-dissabled' : 'kbc-style-button'} type="button" onClick={() => stopVideoInCall()}>Stop Video</button> : ''}
      </div>

      <script src="./main.js"></script>
    </div>
  );
}


export default App;
